import { readFile, readdir, mkdir, writeFile, access, symlink, lstat } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { buildFixture } from "../fixtures/candidate-build.js";
import { digest } from "../fixtures/release-candidate.js";
import { buildCandidate } from "../../lib/release-workflow.js";
import { validateCandidate } from "../../lib/candidate-validation.js";

test("baseline checks retain exact output identities without inventing release evidence", async () => {
  const fixture = await buildFixture();
  try {
    await fixture.put("test.js", "process.exit(9); // uncommitted input is not built\n");
    const result = await buildCandidate({ source: fixture.source, output: fixture.output, run: "a".repeat(128) });
    const manifest = JSON.parse(await readFile(result.manifestPath));
    const identity = JSON.parse(await readFile(path.join(fixture.output, manifest.identity.path)));
    const index = JSON.parse(await readFile(path.join(fixture.output, manifest.evidenceIndex.path)));
    expect(identity.sourceRevision).toBe(fixture.git("rev-parse", "HEAD"));
    expect(identity.pwaAssets.map(asset => asset.path)).toEqual(["assets/app.js", "index.html"]);
    expect(identity.npmSha256).toBe(digest(await readFile(path.join(fixture.output, manifest.npmArchive))));
    expect(index.records.map(record => [record.check, record.status])).toEqual([
      ["clean-install", "pass"], ["jest", "pass"], ["pwa-build", "pass"], ["package", "pass"],
    ]);
    expect(index.clauses).toEqual([]);
    expect(index.records.every(record => record.kind === "check")).toBe(true);
    await expect(validateCandidate(result.manifestPath)).rejects.toMatchObject({ field: "evidence.requiredKinds" });
    expect(index.records.every(record => record.run === "a".repeat(128))).toBe(true);
    expect(await readFile(path.join(fixture.source, "test.js"), "utf8")).toContain("process.exit(9)");
  } finally { await fixture.cleanup(); }
}, 30000);

test("retained source stores link text while the build keeps native checkout behavior", async () => {
  const fixture = await buildFixture();
  try {
    await symlink("test.js", path.join(fixture.source, "linked-test.js"));
    const pkg = JSON.parse(await readFile(path.join(fixture.source, "package.json")));
    pkg.scripts.test = "node linked-test.js";
    await fixture.put("package.json", JSON.stringify(pkg));
    fixture.git("add", ".");
    fixture.git("-c", "commit.gpgsign=false", "commit", "-qm", "Build through a tracked link");
    const result = await buildCandidate({ source: fixture.source, output: fixture.output, run: "link-run" });
    const retained = path.join(fixture.output, "source/linked-test.js");
    expect((await lstat(retained)).isFile()).toBe(true);
    expect(await readFile(retained, "utf8")).toBe("test.js");
    expect((await lstat(path.join(fixture.source, "linked-test.js"))).isSymbolicLink()).toBe(true);
    await expect(validateCandidate(result.manifestPath)).rejects.toMatchObject({ field: "evidence.requiredKinds" });
  } finally { await fixture.cleanup(); }
}, 30000);

test("a later failed check retains earlier observations but no candidate manifest", async () => {
  const fixture = await buildFixture({ testExit: 7 });
  try {
    await expect(buildCandidate({ source: fixture.source, output: fixture.output, run: "failure-run" }))
      .rejects.toThrow("jest failed");
    expect(await readFile(path.join(fixture.output, "raw/jest.stdout"), "utf8"))
      .toContain("Public test boundary ran");
    expect(await readFile(path.join(fixture.output, "stages.txt"), "utf8"))
      .toContain("clean-install: pass\njest: fail (exit 7)");
    await expect(access(path.join(fixture.output, "manifest.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(path.join(fixture.output, "raw/pwa-build.stdout"))).rejects.toMatchObject({ code: "ENOENT" });
  } finally { await fixture.cleanup(); }
}, 30000);

test("an existing output directory is never overwritten", async () => {
  const fixture = await buildFixture();
  try {
    await mkdir(fixture.output);
    await writeFile(path.join(fixture.output, "original.txt"), "Retain this observation");
    await expect(buildCandidate({ source: fixture.source, output: fixture.output, run: "another-run" }))
      .rejects.toMatchObject({ code: "EEXIST" });
    expect(await readdir(fixture.output)).toEqual(["original.txt"]);
    expect(await readFile(path.join(fixture.output, "original.txt"), "utf8")).toBe("Retain this observation");
  } finally { await fixture.cleanup(); }
});

const command = fileURLToPath(new URL("../../bin/release-candidate.js", import.meta.url));
const runCommand = (...args) => spawnSync(process.execPath, [command, ...args], {
  encoding: "utf8", env: { ...process.env, NO_COLOR: "1" }, timeout: 30000,
});

test("the real command distinguishes safe checks from refused release requests", async () => {
  const fixture = await buildFixture();
  try {
    const args = ["--source", fixture.source, "--run", "cli-run"];
    const checked = runCommand(...args, "--output", fixture.output, "--request", "check");
    expect(checked.status).toBe(0);
    expect(checked.stdout).toContain("Baseline checks complete");
    expect(checked.stdout).toContain("Approval still required");
    expect(checked.stderr).toContain("evidence.requiredKinds");
    const released = runCommand(...args, "--output", path.join(fixture.root, "release"), "--request", "release");
    expect(released.status).toBe(1);
    expect(released.stdout).toBe("");
    expect(released.stderr).toContain("evidence.requiredKinds");
    expect(released.stderr).toContain("No publication");
  } finally { await fixture.cleanup(); }
}, 30000);

test.each([
  ["missing PWA assets", 'import {mkdirSync} from "node:fs"; mkdirSync("dist");', "pwa-build"],
  ["linked PWA assets", 'import {mkdirSync,symlinkSync} from "node:fs"; mkdirSync("dist"); symlinkSync("../package.json","dist/link");', "pwa-build"],
  ["a missing package entry point", null, "package"],
])("%s cannot leave a passing stage or candidate", async (name, build, stage) => {
  const fixture = await buildFixture();
  try {
    if (build) await fixture.put("build.js", build);
    else await fixture.put("package.json", JSON.stringify({ ...fixture.pkg, main: "missing.js" }));
    fixture.git("add", ".");
    fixture.git("-c", "commit.gpgsign=false", "commit", "-qm", "Invalid public output case");
    await expect(buildCandidate({ source: fixture.source, output: fixture.output, run: "invalid-output" }))
      .rejects.toThrow();
    const status = await readFile(path.join(fixture.output, "stages.txt"), "utf8");
    expect(status).toContain(`${stage}: fail`);
    expect(status).not.toContain(`${stage}: pass`);
    await expect(access(path.join(fixture.output, "manifest.json"))).rejects.toMatchObject({ code: "ENOENT" });
  } finally { await fixture.cleanup(); }
}, 30000);

test.each(["", "a".repeat(129), "bad\nrun", "../run", null])(
  "an invalid run identifier %j is refused before filesystem work", async run => {
    await expect(buildCandidate({ source: "/missing", output: "/missing", run }))
      .rejects.toThrow("run identifier");
  });

test("build subprocesses cannot read inherited publication credentials", async () => {
  const fixture = await buildFixture();
  const previous = process.env.NODE_AUTH_TOKEN;
  process.env.NODE_AUTH_TOKEN = "PUBLIC-TEST-PUBLICATION-TOKEN";
  try {
    await fixture.put("test.js", 'console.log(process.env.NODE_AUTH_TOKEN === undefined ? "credential absent" : "credential exposed");');
    fixture.git("add", "test.js");
    fixture.git("-c", "commit.gpgsign=false", "commit", "-qm", "Observe public credential boundary");
    await buildCandidate({ source: fixture.source, output: fixture.output, run: "a" });
    const raw = await readFile(path.join(fixture.output, "raw/jest.stdout"), "utf8");
    expect(raw).toContain("credential absent");
    expect(raw).not.toContain("credential exposed");
  } finally {
    if (previous === undefined) delete process.env.NODE_AUTH_TOKEN;
    else process.env.NODE_AUTH_TOKEN = previous;
    await fixture.cleanup();
  }
}, 30000);

test("a draft event does no filesystem or build work even with an invalid source", async () => {
  const fixture = await buildFixture();
  try {
    const event = path.join(fixture.root, "event.json");
    await writeFile(event, JSON.stringify({ action: "synchronize", pull_request: { draft: true } }));
    const result = runCommand("--event", event, "--event-name", "pull_request",
      "--source", "/missing", "--output", fixture.output);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    await expect(access(fixture.output)).rejects.toMatchObject({ code: "ENOENT" });
  } finally { await fixture.cleanup(); }
});

test.each([[], ["--request", "publish"], ["--request", "check"], ["--output"],
  ["--unknown"], ["--request", "check", "--event", "some.json"]])(
  "invalid CLI arguments %j refuse without output or a stack trace", (...args) => {
    const result = runCommand(...args);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toContain("node:internal");
  });

test("a non-repository source retains the Git refusal and creates no candidate", async () => {
  const fixture = await buildFixture();
  try {
    await expect(buildCandidate({ source: fixture.root, output: fixture.output, run: "invalid-source" }))
      .rejects.toThrow("source-revision failed");
    expect(await readFile(path.join(fixture.output, "raw/source-revision.stderr"), "utf8"))
      .toContain("not a git repository");
    await expect(access(path.join(fixture.output, "manifest.json"))).rejects.toMatchObject({ code: "ENOENT" });
  } finally { await fixture.cleanup(); }
});

test("Ctrl-C stops the live build process and removes its temporary checkout", async () => {
  const fixture = await buildFixture();
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let observed, connection;
  try {
    await fixture.put("test.js", [
      'import {connect} from "node:net";',
      `const socket = connect(${server.address().port}, "127.0.0.1");`,
      'socket.on("connect", () => socket.write(JSON.stringify({cwd:process.cwd()})));',
      'setInterval(() => {}, 1000);',
    ].join("\n"));
    fixture.git("add", "test.js");
    fixture.git("-c", "commit.gpgsign=false", "commit", "-qm", "Public cancellable boundary");
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [command, "--source", fixture.source,
        "--output", fixture.output, "--run", "cancel-run", "--request", "check"],
      { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "", stderr = "", closed = false, exitCode;
      const deadline = setTimeout(() => {
        child.kill("SIGINT");
        reject(new Error(`Cancellation deadline exceeded: ${stderr}`));
      }, 10000);
      const finish = () => {
        if (exitCode === undefined || !closed) return;
        clearTimeout(deadline);
        resolve({ code: exitCode, stdout });
      };
      server.once("connection", socket => {
        connection = socket;
        let bytes = "";
        socket.on("data", data => {
          bytes += data;
          try { observed = JSON.parse(bytes); } catch { return; }
          child.kill("SIGINT");
        });
        socket.on("close", () => { closed = true; finish(); });
      });
      child.stdout.on("data", bytes => { stdout += bytes; });
      child.stderr.on("data", bytes => { stderr += bytes; });
      child.on("error", reject);
      child.on("close", code => { exitCode = code; finish(); });
    });
    expect(observed).toHaveProperty("cwd");
    expect(result.code).toBe(130);
    expect(result.stdout).toBe("");
    await expect(access(observed.cwd)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(path.join(fixture.output, "manifest.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(path.join(fixture.output, "raw/pwa-build.stdout"))).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    connection?.destroy();
    await new Promise(resolve => server.close(resolve));
    await fixture.cleanup();
  }
}, 15000);

test("a final identity refusal is retained beside the earlier build observations", async () => {
  const fixture = await buildFixture();
  try {
    const retainedSource = path.join(fixture.output, "source/package.json");
    await fixture.put("test.js",
      `import {appendFileSync} from "node:fs"; appendFileSync(${JSON.stringify(retainedSource)}, "\\n");`);
    fixture.git("add", "test.js");
    fixture.git("-c", "commit.gpgsign=false", "commit", "-qm", "Public changed-source boundary");
    const result = runCommand("--source", fixture.source, "--output", fixture.output,
      "--run", "changed-source", "--request", "check");
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(await readFile(path.join(fixture.output, "release-refusal.txt"), "utf8"))
      .toContain("identity.sourceRevision");
    expect(await readFile(path.join(fixture.output, "stages.txt"), "utf8")).toContain("package: pass");
  } finally { await fixture.cleanup(); }
}, 30000);

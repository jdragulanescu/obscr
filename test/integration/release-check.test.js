import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { candidateFixture, digest } from "../fixtures/release-candidate.js";

const command = fileURLToPath(new URL("../../bin/release-check.js", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [command, ...args], {
  encoding: "utf8", env: { ...process.env, NO_COLOR: "1" }, timeout: 10000,
});

describe("read-only candidate command", () => {
  test("a script without a manifest refuses without waiting or printing a result", () => {
    const result = run();
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("--manifest");
    expect(result.stderr).not.toContain("node:internal");
  });

  test("help explains selection, cancellation and the lack of publication", () => {
    const result = run("--help");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("--manifest");
    expect(result.stdout).toContain("Ctrl-C");
    expect(result.stdout).toContain("does not publish");
  });

  test.each([["--unknown"], ["--manifest"], ["--manifest", "/missing/public.json"], ["--help", "--unknown"]])(
    "invalid command arguments %j refuse with no result", (...args) => {
      const result = run(...args);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("refused");
      expect(result.stderr).not.toContain("node:internal");
    });

  test("the real command prints the checked identity and separates diagnostics from results", async () => {
    const fixture = await candidateFixture();
    try {
      const result = run("--manifest", fixture.manifestPath);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(fixture.manifest.identity.sha256);
      expect(result.stdout).toContain(fixture.manifest.evidenceIndex.sha256);
      expect(result.stdout).toContain("Approval still required");
      expect(result.stdout).toContain(pathToFileURL(fixture.manifestPath).href);
      expect(result.stdout).toContain("PUBLIC FIXTURE");
      expect(result.stdout).not.toMatch(/\x1b|Checking|Reading/);
      expect(result.stderr).not.toContain(fixture.manifest.identity.sha256);
    } finally { await fixture.cleanup(); }
  });

  test("a later report read failure preserves every input and prints no result", async () => {
    const fixture = await candidateFixture();
    try {
      fixture.index.records.at(-1).report.path = "reports/missing.json";
      await fixture.save();
      const snapshot = async () => {
        const files = await readdir(fixture.root, { recursive: true, withFileTypes: true });
        const result = {};
        for (const entry of files) if (entry.isFile()) {
          const full = path.join(entry.parentPath, entry.name);
          result[path.relative(fixture.root, full)] = digest(await readFile(full));
        }
        return result;
      };
      const before = await snapshot();
      const result = run("--manifest", fixture.manifestPath);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("check-21");
      expect(await snapshot()).toEqual(before);
    } finally { await fixture.cleanup(); }
  });

  test("Ctrl-C during validation closes resources and emits no successful result", async () => {
    const fixture = await candidateFixture();
    try {
      const result = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [command, "--manifest", fixture.manifestPath], {
          env: { ...process.env, NO_COLOR: "1" }, stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "", stderr = "", interrupted = false;
        const deadline = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("Cancellation deadline exceeded")); }, 10000);
        child.stdout.on("data", bytes => { stdout += bytes; });
        child.stderr.on("data", bytes => {
          stderr += bytes;
          if (!interrupted && stderr.includes("Checking source revision")) {
            interrupted = true;
            child.kill("SIGINT");
          }
        });
        child.on("error", reject);
        child.on("close", code => { clearTimeout(deadline); resolve({ code, stdout, stderr, interrupted }); });
      });
      expect(result.interrupted).toBe(true);
      expect(result.code).toBe(130);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Cancelled");
      expect(run("--manifest", fixture.manifestPath).status).toBe(0);
    } finally { await fixture.cleanup(); }
  });

  test("terminal controls in a selected path are visible escapes, not instructions", () => {
    const result = run("--manifest", "missing\u001b[2J\u202e.json");
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toMatch(/[\u001b\u202e]/u);
    expect(result.stderr).toContain("\\u{1b}");
  });

  test("invalid JSON does not expose its secret content in a refusal", async () => {
    const fixture = await candidateFixture();
    try {
      await fixture.put("manifest.json", '{"password":"PRIVATE-TEST-SECRET",');
      const result = run("--manifest", fixture.manifestPath);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).not.toContain("PRIVATE-TEST-SECRET");
    } finally { await fixture.cleanup(); }
  });
});

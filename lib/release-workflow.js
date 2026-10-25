import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, open, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const jsonBytes = value => JSON.stringify(value, null, 2) + "\n";

export function selectRequest(eventName, event) {
  if (eventName === "pull_request") {
    if (event?.pull_request?.draft === true || event?.action === "converted_to_draft") return "skip";
    if (event?.pull_request?.draft === false &&
      ["opened", "synchronize", "reopened", "ready_for_review"].includes(event.action)) return "check";
  }
  if (eventName === "release" && event?.action === "created") return "release";
  if (eventName === "workflow_dispatch" && ["check", "release"].includes(event?.inputs?.request)) {
    return event.inputs.request;
  }
  throw new Error("Unsupported candidate request.");
}

function cleanEnvironment(home) {
  return {
    PATH: process.env.PATH, HOME: home, TMPDIR: home, CI: "true", NO_COLOR: "1",
    GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_NO_LAZY_FETCH: "1",
    GIT_ALLOW_PROTOCOL: "file", GIT_TERMINAL_PROMPT: "0",
    NPM_CONFIG_USERCONFIG: path.join(home, "user.npmrc"),
    NPM_CONFIG_GLOBALCONFIG: path.join(home, "global.npmrc"),
    NPM_CONFIG_CACHE: path.join(home, "npm-cache"),
  };
}

async function command(file, args, { cwd, env, signal, log }) {
  signal?.throwIfAborted();
  const stdout = await open(`${log}.stdout`, "wx");
  let stderr;
  try {
    stderr = await open(`${log}.stderr`, "wx");
    return await new Promise((resolve, reject) => {
      const child = spawn(file, args, {
        cwd, env, stdio: ["ignore", stdout.fd, stderr.fd],
        detached: process.platform !== "win32",
      });
      const cancel = () => {
        try {
          if (process.platform === "win32") child.kill("SIGTERM");
          else process.kill(-child.pid, "SIGTERM");
        } catch (error) { if (error.code !== "ESRCH") reject(error); }
      };
      signal?.addEventListener("abort", cancel, { once: true });
      if (signal?.aborted) cancel();
      child.on("error", reject);
      child.on("close", code => {
        signal?.removeEventListener("abort", cancel);
        if (signal?.aborted) reject(signal.reason);
        else resolve(code);
      });
    });
  } finally {
    await stdout.close();
    await stderr?.close();
  }
}

async function inventory(root, prefix = "") {
  const assets = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (/[\\\x00-\x1f\x7f]/u.test(name)) throw new Error("Unsafe asset path.");
    if (entry.isDirectory()) assets.push(...await inventory(root, `${name}/`));
    else if (entry.isFile()) {
      assets.push({ path: name, sha256: digest(await readFile(path.join(root, name))) });
    } else throw new Error("Candidate assets must be regular files.");
  }
  return assets.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

async function saveJson(root, name, value) {
  const bytes = jsonBytes(value);
  await writeFile(path.join(root, name), bytes, { flag: "wx" });
  return { path: name, sha256: digest(bytes) };
}

async function packageArchive(work, output) {
  const packed = JSON.parse(await readFile(path.join(output, "raw/package.stdout"), "utf8"));
  if (!Array.isArray(packed) || packed.length !== 1 ||
    !/^[a-zA-Z0-9._-]+\.tgz$/.test(packed[0]?.filename)) throw new Error("Invalid npm archive result.");
  const pkg = JSON.parse(await readFile(path.join(work, "package.json"), "utf8"));
  const entries = packed[0].files?.map(file => file.path);
  const binaries = typeof pkg.bin === "string" ? [pkg.bin] : Object.values(pkg.bin || {});
  const required = ["package.json", ...(pkg.main ? [pkg.main] : []), ...binaries]
    .map(name => name.replace(/^\.\//, ""));
  if (!entries || !required.every(name => entries.includes(name)) ||
    !packed[0].size || !packed[0].integrity) throw new Error("The npm archive omits a declared entry point.");
  const archive = packed[0].filename;
  await rename(path.join(output, archive), path.join(output, "package.tgz"));
  return digest(await readFile(path.join(output, "package.tgz")));
}

async function retainEvidence(output, identity, run, stages, npmVersion) {
  const checklistBytes = await readFile(new URL("./release-checklist.json", import.meta.url));
  const packageRef = { path: "source/package.json",
    sha256: digest(await readFile(path.join(output, "source/package.json"))) };
  const lockRef = { path: "source/package-lock.json",
    sha256: digest(await readFile(path.join(output, "source/package-lock.json"))) };
  const records = [];
  for (const stage of stages) {
    const observations = [];
    for (const stream of ["stdout", "stderr"]) {
      const name = `raw/${stage.check}.${stream}`;
      observations.push({ path: name, sha256: digest(await readFile(path.join(output, name))) });
    }
    const record = {
      schemaVersion: 1, purpose: "release", candidate: identity.sha256,
      check: stage.check, run, status: "pass", category: "A13", kind: "check",
      fixtureManifest: packageRef, fixtures: [packageRef, lockRef],
      environment: {
        os: `${os.type()} ${os.release()}`, runtime: { name: "Node", version: process.versions.node },
        tools: [{ name: "npm", version: npmVersion }],
        device: { kind: "runner", model: `${os.platform()} ${os.arch()}`,
          osVersion: os.release(), ram: `${os.totalmem()} bytes reported by the operating system` },
      },
      actions: [stage.action], expected: "Command exits 0 and required outputs are present.",
      actual: "Command exited 0; required outputs were checked.",
      limits: ["Baseline build checks only. No complete normative-clause mapping, physical-device evidence, independent review, or application/tools review is asserted."],
      verifier: { name: "candidate workflow", role: "automated build checker",
        competence: "Process exit status and file identity checks only; not an independent security reviewer." },
      observations, exclusions: [],
    };
    records.push({ ...record, report: await saveJson(output, `reports/${stage.check}.json`, record) });
  }
  return saveJson(output, "evidence-index.json", {
    schemaVersion: 1, purpose: "release", candidate: identity.sha256,
    checklistRevision: digest(checklistBytes), clauses: [], records, carryForward: [],
  });
}

export async function buildCandidate({ source, output, run, signal, onProgress = () => {} }) {
  if (!/^24\./.test(process.versions.node)) throw new Error("Use Node 24.x.");
  if (typeof run !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(run)) {
    throw new Error("Select a valid run identifier.");
  }
  signal?.throwIfAborted();
  source = await realpath(source);
  output = path.resolve(output);
  await mkdir(output);
  await mkdir(path.join(output, "raw"));
  await mkdir(path.join(output, "reports"));
  const scratch = await mkdtemp(path.join(os.tmpdir(), "obscr-candidate-work-"));
  const env = cleanEnvironment(scratch);
  const work = path.join(scratch, "build");
  const stages = [];
  let active = "source";
  const execute = async (name, file, args, cwd = work, verify) => {
    active = name;
    onProgress(name);
    const code = await command(file, args, {
      cwd, env, signal, log: path.join(output, "raw", name),
    });
    let result;
    let passed = code === 0;
    try { if (passed && verify) result = await verify(); }
    catch (error) {
      passed = false;
      await writeFile(path.join(output, "raw", `${name}.verification.txt`),
        `${error.message}\n`, { flag: "wx" });
    }
    const status = passed ? "pass" : code === 0 ? "fail (output verification)" : `fail (exit ${code})`;
    await writeFile(path.join(output, "stages.txt"), `${name}: ${status}\n`, { flag: "a" });
    if (!passed) throw new Error(`Candidate stage ${name} failed; read retained raw logs.`);
    return result;
  };
  try {
    await execute("source-revision", "git", ["rev-parse", "HEAD"], source);
    const revision = (await readFile(path.join(output, "raw/source-revision.stdout"), "utf8")).trim();
    if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("Invalid source revision.");
    await execute("retain-source", "git", ["clone", "--no-hardlinks", "--no-checkout", "--", source, path.join(output, "source")], scratch);
    await execute("checkout-source", "git", ["checkout", "--detach", revision], path.join(output, "source"));
    await execute("prepare-build", "git", ["clone", "--no-hardlinks", "--", path.join(output, "source"), work], scratch);
    await execute("npm-version", "npm", ["--version"]);
    const npmVersion = (await readFile(path.join(output, "raw/npm-version.stdout"), "utf8")).trim();
    let assets, npmSha256;
    for (const [check, args, verify] of [
      ["clean-install", ["ci"]], ["jest", ["test"]],
      ["pwa-build", ["run", "build"], async () => {
        assets = await inventory(path.join(work, "dist"));
        if (!assets.length) throw new Error("The PWA asset set is empty.");
        await rename(path.join(work, "dist"), path.join(output, "pwa"));
      }],
      ["package", ["pack", "--json", "--ignore-scripts", "--pack-destination", output], async () => {
        npmSha256 = await packageArchive(work, output);
      }],
    ]) {
      await execute(check, "npm", args, work, verify);
      stages.push({ check, action: `npm ${args.join(" ")}` });
    }
    const identity = await saveJson(output, "identity.json", {
      schemaVersion: 1, sourceRevision: revision,
      lockfileSha256: digest(await readFile(path.join(output, "source/package-lock.json"))),
      format: 1, profile: 1, npmSha256, pwaAssets: assets,
    });
    const evidenceIndex = await retainEvidence(output, identity, run, stages, npmVersion);
    await saveJson(output, "manifest.json", {
      schemaVersion: 1, purpose: "release", identity, evidenceIndex,
      source: "source", lockfile: "source/package-lock.json", npmArchive: "package.tgz", pwaDirectory: "pwa",
    });
    return { manifestPath: path.join(output, "manifest.json"), candidate: identity.sha256,
      evidenceIndex: evidenceIndex.sha256 };
  } catch (error) {
    await writeFile(path.join(output, "stages.txt"), `${active}: incomplete; no passing candidate result.\n`, { flag: "a" });
    throw error;
  } finally { await rm(scratch, { recursive: true, force: true }); }
}

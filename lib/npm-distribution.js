import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { chmod, lstat, mkdir, mkdtemp, open, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { CandidateRefusal, validateCandidate } from "./candidate-validation.js";

const HASH = /^[a-f0-9]{64}$/;
const REVISION = /^[a-f0-9]{40}$/;
const JSON_LIMIT = 16 * 1024 * 1024;
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const positiveInteger = value => Number.isSafeInteger(value) && value > 0;
const exec = promisify(execFile);
const REGISTRY = "https://registry.npmjs.org";
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*))*))?(?:\+[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)?$/;

export class NpmDistributionError extends Error {
  constructor(code, field, message) {
    super(`${field}: ${message}`);
    this.name = "NpmDistributionError";
    this.code = code;
    this.field = field;
  }
}

function requireValue(condition, field, message = "invalid or missing value") {
  if (!condition) throw new NpmDistributionError("NPM_REFUSED", field, message);
}

function safeError(error) {
  if (error instanceof NpmDistributionError) return error;
  if (error instanceof CandidateRefusal || error?.name === "EvidenceRefusal") {
    return new NpmDistributionError("NPM_REFUSED", error.field, error.message);
  }
  return new NpmDistributionError("NPM_REFUSED", "input", "cannot read or validate the retained inputs");
}

export function validateReleaseRequest(value) {
  const keys = ["schemaVersion", "artifactId", "artifactSha256", "candidate", "evidenceIndex"];
  requireValue(isObject(value) && value.schemaVersion === 1, "request", "expected schemaVersion 1");
  requireValue(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)),
    "request", "expected exactly the v1 request fields");
  requireValue(positiveInteger(value.artifactId), "request.artifactId", "expected a positive safe integer");
  for (const key of ["artifactSha256", "candidate", "evidenceIndex"]) {
    requireValue(typeof value[key] === "string" && HASH.test(value[key]), `request.${key}`, "expected lowercase SHA-256");
  }
  return Object.freeze(Object.fromEntries(keys.map(key => [key, value[key]])));
}

function inside(root, filename) {
  const relative = path.relative(root, filename);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function bundlePath(root, name, field) {
  requireValue(typeof name === "string" && name.length > 0 && !path.isAbsolute(name) &&
    !/[\\\x00-\x1f\x7f]/u.test(name) && name.split("/").every(part => part && part !== "." && part !== ".."),
  field, "expected a relative bundle path");
  return path.join(root, name);
}

async function readJson(filename, field) {
  let handle;
  try {
    handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = await handle.stat({ bigint: true });
    requireValue(before.isFile() && before.size <= BigInt(JSON_LIMIT), field, "expected a regular JSON file below 16 MiB");
    const bytes = await handle.readFile();
    const after = await handle.stat({ bigint: true });
    requireValue(bytes.length <= JSON_LIMIT && before.size === after.size && before.mtimeNs === after.mtimeNs &&
      before.ctimeNs === after.ctimeNs, field, "input changed while reading");
    return { value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), sha256: digest(bytes) };
  } catch (error) {
    if (error instanceof NpmDistributionError) throw error;
    throw new NpmDistributionError("NPM_REFUSED", field, "cannot read valid retained JSON");
  } finally { await handle?.close(); }
}

async function validatedBundle({ manifestPath, request, sourceRevision, signal }) {
  signal?.throwIfAborted();
  const selected = validateReleaseRequest(request);
  requireValue(typeof sourceRevision === "string" && REVISION.test(sourceRevision), "sourceRevision", "expected the selected Git revision");
  requireValue(typeof manifestPath === "string" && manifestPath.length > 0, "manifest", "select a retained manifest");
  const root = await realpath(path.dirname(path.resolve(manifestPath)));
  const filename = path.join(root, path.basename(manifestPath));
  const manifestRead = await readJson(filename, "manifest");
  const manifest = manifestRead.value;
  requireValue(isObject(manifest) && isObject(manifest.identity) && isObject(manifest.evidenceIndex), "manifest");
  requireValue(manifest.identity.sha256 === selected.candidate, "request.candidate", "selected candidate differs from the bundle");
  requireValue(manifest.evidenceIndex.sha256 === selected.evidenceIndex, "request.evidenceIndex", "selected evidence differs from the bundle");
  const identityPath = bundlePath(root, manifest.identity.path, "manifest.identity");
  const identityRead = await readJson(identityPath, "identity");
  requireValue(identityRead.sha256 === selected.candidate, "request.candidate", "identity bytes differ from the request");
  requireValue(identityRead.value.sourceRevision === sourceRevision, "sourceRevision", "selected source differs from the candidate");
  const validated = await validateCandidate(filename, { signal });
  requireValue(validated.candidate === selected.candidate && validated.evidenceIndex === selected.evidenceIndex &&
    validated.purpose === manifest.purpose, "request", "bundle changed during preparation");
  requireValue((await readJson(filename, "manifest")).sha256 === manifestRead.sha256, "manifest", "manifest changed during preparation");
  requireValue((await readJson(identityPath, "identity")).sha256 === selected.candidate, "identity", "identity changed during preparation");
  requireValue(JSON.stringify(validateReleaseRequest(request)) === JSON.stringify(selected), "request", "request changed during preparation");
  return { root, manifestPath: filename, archivePath: bundlePath(root, manifest.npmArchive, "manifest.npmArchive"),
    result: { candidate: selected.candidate, evidenceIndex: selected.evidenceIndex, sourceRevision,
      npmSha256: identityRead.value.npmSha256, purpose: validated.purpose } };
}

export async function prepareNpm(options) {
  try { return (await validatedBundle(options)).result; }
  catch (error) { throw safeError(error); }
}

function validateRun(value) {
  requireValue(isObject(value) && positiveInteger(value.id) && positiveInteger(value.attempt), "run",
    "retain the GitHub run ID and attempt");
  return Object.freeze({ id: value.id, attempt: value.attempt });
}

function validateApproval(value, request, run) {
  requireValue(isObject(value) && value.schemaVersion === 1, "approval", "retain a v1 approval from GitHub");
  requireValue(value.decision === "approved", "approval.decision", "an explicit approval is required");
  requireValue(typeof value.reviewer === "string" && /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value.reviewer),
    "approval.reviewer", "retain the approving GitHub login");
  requireValue(value.candidate === request.candidate, "approval.candidate", "candidate changed; obtain renewed approval");
  requireValue(value.evidenceIndex === request.evidenceIndex, "approval.evidenceIndex", "evidence changed; obtain renewed approval");
  requireValue(value.runId === run.id, "approval.runId", "approval belongs to another run");
  requireValue(value.runAttempt === run.attempt, "approval.runAttempt", "approval belongs to another attempt");
  return Object.freeze({ schemaVersion: 1, candidate: value.candidate, evidenceIndex: value.evidenceIndex,
    decision: "approved", reviewer: value.reviewer, runId: value.runId, runAttempt: value.runAttempt });
}

function unchangedSelection(options, selected) {
  requireValue(JSON.stringify(validateReleaseRequest(options.request)) === JSON.stringify(selected.request),
    "request", "request changed during publication preparation");
  const run = validateRun(options.run);
  requireValue(JSON.stringify(run) === JSON.stringify(selected.run), "run", "run changed during publication preparation");
  requireValue(JSON.stringify(validateApproval(options.approval, selected.request, run)) === JSON.stringify(selected.approval),
    "approval", "approval changed during publication preparation");
  requireValue(options.sourceRevision === selected.sourceRevision && options.manifestPath === selected.manifestPath,
    "sourceRevision", "selected input changed during publication preparation");
}

async function snapshotArchive(source, expectedSha256, snapshot, signal) {
  const directory = path.join(snapshot, "archive");
  await mkdir(directory, { mode: 0o700 });
  const archivePath = path.join(directory, "package.tgz");
  let input;
  let output;
  try {
    input = await open(source, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = await input.stat({ bigint: true });
    requireValue(before.isFile(), "npm.archive", "expected a regular archive");
    output = await open(archivePath, "wx", 0o600);
    const hashes = { sha256: createHash("sha256"), sha1: createHash("sha1"), sha512: createHash("sha512") };
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let size = 0;
    while (true) {
      signal?.throwIfAborted();
      const { bytesRead } = await input.read(buffer, 0, buffer.length, null);
      if (!bytesRead) break;
      size += bytesRead;
      requireValue(BigInt(size) <= before.size, "npm.archive", "archive changed during snapshot");
      const bytes = buffer.subarray(0, bytesRead);
      for (const hash of Object.values(hashes)) hash.update(bytes);
      let written = 0;
      while (written < bytesRead) {
        const result = await output.write(bytes, written, bytesRead - written);
        requireValue(result.bytesWritten > 0, "npm.archive", "cannot retain archive snapshot");
        written += result.bytesWritten;
      }
    }
    const after = await input.stat({ bigint: true });
    requireValue(before.size === after.size && before.mtimeNs === after.mtimeNs && before.ctimeNs === after.ctimeNs &&
      BigInt(size) === before.size, "npm.archive", "archive changed during snapshot");
    const sha256 = hashes.sha256.digest("hex");
    requireValue(sha256 === expectedSha256, "npm.archive", "archive snapshot differs from the checked identity");
    await output.sync();
    await output.chmod(0o400);
    await chmod(directory, 0o500);
    return { archivePath, sha256, size, shasum: hashes.sha1.digest("hex"),
      integrity: `sha512-${hashes.sha512.digest("base64")}` };
  } finally {
    await input?.close();
    await output?.close();
  }
}

async function packageMetadata(archivePath, sandbox, signal) {
  let metadata;
  try {
    // Read only this tar member to stdout. Never extract candidate files or run package scripts.
    const { stdout } = await exec("tar", ["-xOzf", archivePath, "package/package.json"], {
      cwd: sandbox, env: { PATH: process.env.PATH, HOME: sandbox, LANG: "C" },
      encoding: "utf8", maxBuffer: JSON_LIMIT, signal,
    });
    metadata = JSON.parse(stdout);
  } catch {
    throw new NpmDistributionError("NPM_REFUSED", "npm.archive", "expected an npm tarball with one package/package.json");
  }
  requireValue(isObject(metadata) && metadata.name === "obscr", "npm.package", "the approved package must be obscr");
  requireValue(typeof metadata.version === "string" && metadata.version.length <= 256 && SEMVER.test(metadata.version),
    "npm.package", "expected an npm semantic version");
  requireValue(!metadata.private, "npm.package", "private packages cannot be published");
  requireValue(metadata._id === undefined || metadata._id === `obscr@${metadata.version}`,
    "npm.package", "package ID differs from its name and version");
  requireValue(metadata.publishConfig === undefined || (isObject(metadata.publishConfig) &&
    Object.entries(metadata.publishConfig).every(([key, value]) =>
      key === "registry" && [REGISTRY, `${REGISTRY}/`].includes(value))),
  "npm.publishConfig", "only the public npm registry may be configured in the archive");
  return { name: "obscr", version: metadata.version, id: `obscr@${metadata.version}` };
}

function checkedProviderResult(value, metadata, archive) {
  // npm 11.5.1 emits one object; newer npm versions key it by package name.
  const result = isObject(value) && Object.hasOwn(value, "obscr") ? value.obscr : value;
  if (!isObject(result) || result.id !== metadata.id || result.name !== metadata.name ||
      result.version !== metadata.version || result.shasum !== archive.shasum ||
      result.integrity !== archive.integrity || result.error !== undefined) {
    throw new NpmDistributionError("NPM_UNKNOWN", "npm.result",
      "the provider did not confirm publication of the checked archive; inspect npm before any new request");
  }
  return { id: result.id, name: result.name, version: result.version,
    shasum: result.shasum, integrity: result.integrity };
}

async function productionBoundary(sandbox, selected, signal) {
  requireValue(process.env.GITHUB_ACTIONS === "true" && process.env.GITHUB_REPOSITORY === "jdragulanescu/obscr" &&
    process.env.GITHUB_WORKFLOW_REF?.startsWith("jdragulanescu/obscr/.github/workflows/publish.yml@"),
  "npm.oidc", "publication requires the authorized GitHub publish workflow");
  requireValue(process.env.GITHUB_SHA === selected.sourceRevision, "npm.oidc",
    "GitHub provenance source differs from the checked candidate");
  requireValue(process.env.GITHUB_RUN_ID === String(selected.run.id) &&
    process.env.GITHUB_RUN_ATTEMPT === String(selected.run.attempt), "npm.oidc", "GitHub run differs from the approval");
  requireValue(process.env.RUNNER_ENVIRONMENT === "github-hosted", "npm.oidc", "use a GitHub-hosted OIDC runner");
  requireValue(Boolean(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN),
    "npm.oidc", "GitHub OIDC permission is required; token fallback is forbidden");
  requireValue(!Object.entries(process.env).some(([key, value]) => value &&
    (/^(NPM_TOKEN|NPM_AUTH_TOKEN|NODE_AUTH_TOKEN)$/i.test(key) ||
      /^npm_config_.*(?:auth|token|password|username)/i.test(key))),
  "npm.oidc", "remove ambient npm credentials; only GitHub OIDC is allowed");
  const [major, minor] = process.versions.node.split(".").map(Number);
  requireValue(major > 22 || (major === 22 && minor >= 14), "npm.runtime", "OIDC requires Node 22.14 or newer");
  const env = { PATH: process.env.PATH, HOME: sandbox, TMPDIR: sandbox, CI: "true", NO_COLOR: "1",
    NPM_CONFIG_USERCONFIG: path.join(sandbox, "user.npmrc"),
    NPM_CONFIG_GLOBALCONFIG: path.join(sandbox, "global.npmrc"),
    NPM_CONFIG_CACHE: path.join(sandbox, "cache") };
  const githubVariables = ["GITHUB_ACTIONS", "GITHUB_ACTOR", "GITHUB_ACTOR_ID", "GITHUB_EVENT_NAME",
    "GITHUB_REPOSITORY", "GITHUB_REPOSITORY_ID", "GITHUB_REPOSITORY_OWNER", "GITHUB_REPOSITORY_OWNER_ID",
    "GITHUB_REF", "GITHUB_REF_TYPE", "GITHUB_SHA", "GITHUB_WORKFLOW", "GITHUB_WORKFLOW_REF", "GITHUB_WORKFLOW_SHA",
    "GITHUB_RUN_ID", "GITHUB_RUN_NUMBER", "GITHUB_RUN_ATTEMPT", "GITHUB_SERVER_URL", "GITHUB_API_URL",
    "RUNNER_ENVIRONMENT", "ACTIONS_ID_TOKEN_REQUEST_URL", "ACTIONS_ID_TOKEN_REQUEST_TOKEN"];
  for (const key of githubVariables) if (process.env[key] !== undefined) env[key] = process.env[key];
  await writeFile(env.NPM_CONFIG_USERCONFIG, "", { flag: "wx", mode: 0o600 });
  await writeFile(env.NPM_CONFIG_GLOBALCONFIG, "", { flag: "wx", mode: 0o600 });
  await writeFile(path.join(sandbox, "package.json"), '{"private":true}\n', { flag: "wx", mode: 0o600 });
  const options = { cwd: sandbox, env, encoding: "utf8", maxBuffer: JSON_LIMIT, signal };
  let version;
  try { version = (await exec("npm", ["--version"], options)).stdout.trim(); }
  catch { throw new NpmDistributionError("NPM_REFUSED", "npm.runtime", "cannot read the installed npm version"); }
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  requireValue(match && (Number(match[1]) > 11 || (Number(match[1]) === 11 &&
    (Number(match[2]) > 5 || (Number(match[2]) === 5 && Number(match[3]) >= 1)))),
  "npm.runtime", "OIDC requires npm 11.5.1 or newer");
  return async ({ archivePath }) => {
    // The only publishing process. No token, rebuild, script, implicit workspace, or retry.
    const { stdout } = await exec("npm", ["publish", archivePath, "--json", "--ignore-scripts",
      `--registry=${REGISTRY}`, "--access=public", "--provenance", "--dry-run=false",
      "--workspaces=false", "--fetch-retries=0", "--update-notifier=false",
      "--audit=false", "--fund=false"], options);
    return JSON.parse(stdout);
  };
}

function receiptError() {
  return new NpmDistributionError("RECEIPT_NOT_RETAINED", "receipt",
    "cannot retain the outcome at the create-only receipt path; inspect the returned outcome before any new request");
}

async function reserveReceipt(receiptPath, manifestPath) {
  try {
    requireValue(typeof receiptPath === "string" && receiptPath.length > 0, "receipt", "select a create-only receipt path");
    const root = await realpath(path.dirname(path.resolve(manifestPath)));
    const requested = path.resolve(receiptPath);
    const directory = await realpath(path.dirname(requested));
    const filename = path.join(directory, path.basename(requested));
    requireValue(!inside(root, filename), "receipt", "the receipt must be outside the input bundle");
    return { filename, handle: await open(filename, "wx", 0o600) };
  } catch { throw receiptError(); }
}

async function storeReceipt(storage, receipt) {
  try {
    const owned = await storage.handle.stat({ bigint: true });
    const current = await lstat(storage.filename, { bigint: true });
    if (!current.isFile() || current.dev !== owned.dev || current.ino !== owned.ino || owned.nlink !== 1n) throw receiptError();
    const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesWritten } = await storage.handle.write(bytes, offset, bytes.length - offset, offset);
      if (!bytesWritten) throw receiptError();
      offset += bytesWritten;
    }
    await storage.handle.truncate(bytes.length);
    await storage.handle.sync();
    const retained = await lstat(storage.filename, { bigint: true });
    if (!retained.isFile() || retained.dev !== owned.dev || retained.ino !== owned.ino ||
        retained.size !== BigInt(bytes.length)) throw receiptError();
  } catch { throw receiptError(); }
}

export async function publishNpm(options, { publishArchive } = {}) {
  const receipt = { schemaVersion: 1, request: null, approval: null, run: null,
    candidate: null, evidenceIndex: null, sourceRevision: null, purpose: null,
    startedAt: new Date().toISOString(), npm: { status: "refused", sha256: null } };
  let selected;
  let selectionError;
  try {
    const request = validateReleaseRequest(options.request);
    receipt.request = request;
    receipt.candidate = request.candidate;
    receipt.evidenceIndex = request.evidenceIndex;
    const run = validateRun(options.run);
    receipt.run = run;
    const approval = validateApproval(options.approval, request, run);
    receipt.approval = approval;
    requireValue(typeof options.sourceRevision === "string" && REVISION.test(options.sourceRevision), "sourceRevision");
    receipt.sourceRevision = options.sourceRevision;
    selected = { request, approval, run, sourceRevision: options.sourceRevision,
      manifestPath: options.manifestPath, signal: options.signal };
  } catch (error) { selectionError = safeError(error); }
  let storage;
  let snapshot;
  let failure;
  let attempted = false;
  let receiptRetained = false;
  try {
    storage = await reserveReceipt(options?.receiptPath, options?.manifestPath);
    if (selectionError) throw selectionError;
    selected.signal?.throwIfAborted();
    requireValue(publishArchive === undefined || typeof publishArchive === "function", "npm.provider");
    const bundle = await validatedBundle(selected);
    Object.assign(receipt, { purpose: bundle.result.purpose });
    receipt.npm.sha256 = bundle.result.npmSha256;
    requireValue(publishArchive !== undefined || bundle.result.purpose === "release", "purpose",
      "public fixtures cannot authorize production publication");
    snapshot = await mkdtemp(path.join(tmpdir(), "obscr-npm-"));
    await chmod(snapshot, 0o700);
    const sandbox = path.join(snapshot, "npm");
    await mkdir(sandbox, { mode: 0o700 });
    const archive = await snapshotArchive(bundle.archivePath, bundle.result.npmSha256, snapshot, selected.signal);
    const metadata = await packageMetadata(archive.archivePath, sandbox, selected.signal);
    const provider = publishArchive ?? await productionBoundary(sandbox, selected, selected.signal);
    // Retain an unknown checkpoint before attempting the external operation. A killed
    // runner must never leave a receipt which falsely asserts no publication occurred.
    receipt.npm.status = "unknown";
    await storeReceipt(storage, receipt);
    const rechecked = await validatedBundle(selected);
    requireValue(JSON.stringify(rechecked.result) === JSON.stringify(bundle.result), "candidate",
      "candidate changed before publication");
    unchangedSelection(options, selected);
    selected.signal?.throwIfAborted();
    attempted = true;
    const result = await provider(Object.freeze({ archivePath: archive.archivePath, sha256: archive.sha256,
      purpose: bundle.result.purpose, sourceRevision: selected.sourceRevision }));
    Object.assign(receipt.npm, checkedProviderResult(result, metadata, archive), { status: "published" });
  } catch (error) {
    if (attempted) {
      receipt.npm.status = "unknown";
      failure = new NpmDistributionError("NPM_UNKNOWN", "npm",
        "publication was attempted without confirmed success; inspect npm before any new request");
    } else {
      receipt.npm.status = "refused";
      failure = safeError(error);
    }
  } finally {
    if (snapshot) {
      try {
        // Only this invocation's private directory is removed.
        await chmod(path.join(snapshot, "archive"), 0o700).catch(error => {
          if (error.code !== "ENOENT") throw error;
        });
        await rm(snapshot, { recursive: true, force: true });
      } catch {
        failure = new NpmDistributionError("NPM_CLEANUP_FAILED", "npm.snapshot",
          "cannot remove the private archive snapshot; the receipt still states the observed publication outcome");
      }
    }
  }
  receipt.finishedAt = new Date().toISOString();
  if (failure) receipt.error = { code: failure.code, field: failure.field };
  if (storage) {
    try {
      await storeReceipt(storage, receipt);
      receiptRetained = true;
    } catch { failure = receiptError(); }
    try { await storage.handle.close(); }
    catch { failure = receiptError(); receiptRetained = false; }
  }
  if (failure) {
    failure.receipt = receipt;
    failure.receiptPath = storage?.filename ?? (typeof options?.receiptPath === "string" ? path.resolve(options.receiptPath) : null);
    failure.receiptRetained = receiptRetained;
    throw failure;
  }
  return receipt;
}

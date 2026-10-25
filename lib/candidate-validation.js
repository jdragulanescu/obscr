import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open, lstat, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateEvidence } from "./evidence-record.js";

const exec = promisify(execFile);
const HASH = /^[a-f0-9]{64}$/;
const JSON_LIMIT = 16 * 1024 * 1024;

export class CandidateRefusal extends Error {
  constructor(field, reason) {
    super(`${field}: ${reason}`);
    this.name = "CandidateRefusal";
    this.field = field;
  }
}

function requireValue(condition, field, reason = "invalid or missing value") {
  if (!condition) throw new CandidateRefusal(field, reason);
}

function version(value, field) {
  requireValue(value && typeof value === "object" && !Array.isArray(value) && value.schemaVersion === 1,
    field, "expected schemaVersion 1");
}

function relativeName(value, field) {
  requireValue(typeof value === "string" && value.length > 0 && !path.isAbsolute(value) &&
    !/[\\\x00-\x1f\x7f]/u.test(value) && value.split("/").every(part => part && part !== "." && part !== ".."),
  field, "use a relative path inside the candidate bundle");
  return value;
}

// All file access is read-only; reject links and special files before opening.
// Descriptors are closed even when cancellation or a later read fails.
async function bundleReader(root, signal) {
  const directories = new Map();
  const observed = new Map();
  const resolve = async (name, field, directory = false) => {
    relativeName(name, field);
    let current = root;
    const parts = name.split("/");
    for (let i = 0; i < parts.length; i++) {
      signal?.throwIfAborted();
      current = path.join(current, parts[i]);
      const stat = await lstat(current);
      requireValue(!stat.isSymbolicLink() && (i < parts.length - 1 || directory ? stat.isDirectory() : stat.isFile()),
        field, "expected a regular file or directory, without symbolic links");
    }
    const resolved = await realpath(current);
    requireValue(resolved.startsWith(root + path.sep), field, "path leaves the candidate bundle");
    return resolved;
  };
  const file = async (name, field, { json = false, algorithm = "sha256", gitBlob = false } = {}) => {
    let handle;
    try {
      const fullPath = await resolve(name, field);
      handle = await open(fullPath, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
      const before = await handle.stat({ bigint: true });
      requireValue(before.isFile(), field, "expected a regular file");
      requireValue(!json || before.size <= BigInt(JSON_LIMIT), field, "JSON exceeds the 16 MiB limit");
      const hash = createHash(algorithm);
      if (gitBlob) hash.update(`blob ${before.size}\0`);
      const chunks = [];
      const buffer = Buffer.allocUnsafe(64 * 1024);
      let total = 0;
      while (true) {
        signal?.throwIfAborted();
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
        if (!bytesRead) break;
        total += bytesRead;
        requireValue(!json || total <= JSON_LIMIT, field, "JSON exceeds the 16 MiB limit");
        const bytes = buffer.subarray(0, bytesRead);
        hash.update(bytes);
        if (json) chunks.push(Buffer.from(bytes));
      }
      const after = await handle.stat({ bigint: true });
      requireValue(before.size === after.size && before.mtimeNs === after.mtimeNs && before.ctimeNs === after.ctimeNs,
        field, "input changed during validation; select a stable retained bundle");
      observed.set(fullPath, { stat: after, field });
      let value;
      if (json) {
        try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))); }
        catch { throw new CandidateRefusal(field, "expected valid UTF-8 JSON"); }
      }
      return { value, sha256: hash.digest("hex") };
    } catch (error) {
      if (signal?.aborted) signal.throwIfAborted();
      if (error instanceof CandidateRefusal) throw error;
      throw new CandidateRefusal(field, "cannot read input; check that it exists and is readable");
    } finally { await handle?.close(); }
  };
  const reference = async (ref, field, json = false) => {
    requireValue(ref && typeof ref === "object" && HASH.test(ref.sha256), field, "expected a path and SHA-256 digest");
    const result = await file(ref.path, field, { json });
    requireValue(result.sha256 === ref.sha256, field, "hash mismatch; retain the matching original file");
    return result.value;
  };
  const inventory = async (name, field, skipGit = false) => {
    let directory;
    try { directory = await resolve(name, field, true); }
    catch (error) {
      if (error instanceof CandidateRefusal) throw error;
      throw new CandidateRefusal(field, "cannot read directory; check its location and permissions");
    }
    const files = [];
    const walk = async (dir, prefix = "") => {
      signal?.throwIfAborted();
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (skipGit && !prefix && entry.name === ".git") continue;
        const child = prefix + entry.name;
        relativeName(child, field);
        if (entry.isDirectory()) await walk(path.join(dir, entry.name), child + "/");
        else {
          requireValue(entry.isFile(), field, "symbolic links and special files are not candidate assets");
          files.push(child);
        }
      }
    };
    try { await walk(directory); }
    catch (error) {
      if (signal?.aborted) signal.throwIfAborted();
      if (error instanceof CandidateRefusal) throw error;
      throw new CandidateRefusal(field, "cannot list directory; check read permissions");
    }
    files.sort();
    const previous = directories.get(name);
    requireValue(!previous || JSON.stringify(previous.files) === JSON.stringify(files),
      field, "asset inventory changed during validation; select a stable retained bundle");
    directories.set(name, { files, field, skipGit });
    return files;
  };
  const unchanged = async () => {
    for (const [name, { field, skipGit }] of directories) await inventory(name, field, skipGit);
    for (const [name, { stat, field }] of observed) {
      signal?.throwIfAborted();
      let current;
      try { current = await lstat(name, { bigint: true }); }
      catch { throw new CandidateRefusal(field, "input disappeared during validation"); }
      requireValue(current.isFile() && current.dev === stat.dev && current.ino === stat.ino &&
        current.size === stat.size && current.mtimeNs === stat.mtimeNs && current.ctimeNs === stat.ctimeNs,
      field, "input changed during validation; select a stable retained bundle");
    }
  };
  return { file, reference, inventory, resolve, unchanged };
}

async function verifySource(reader, source, revision, signal) {
  requireValue(typeof revision === "string" && /^[a-f0-9]{40}$/.test(revision), "identity.sourceRevision");
  const directory = await reader.resolve(source, "manifest.source", true);
  const git = async (...args) => {
    try {
      const { stdout } = await exec("git", ["--no-optional-locks", "--no-replace-objects", "-C", directory, ...args], {
        signal, maxBuffer: 16 * 1024 * 1024, encoding: "utf8",
        env: { PATH: process.env.PATH, HOME: directory, GIT_CONFIG_NOSYSTEM: "1",
          GIT_CONFIG_GLOBAL: "/dev/null", GIT_OPTIONAL_LOCKS: "0",
          GIT_NO_LAZY_FETCH: "1", GIT_ALLOW_PROTOCOL: "" },
      });
      return stdout;
    } catch {
      signal?.throwIfAborted();
      throw new CandidateRefusal("identity.sourceRevision", "cannot read source revision; supply the retained Git checkout");
    }
  };
  requireValue((await git("rev-parse", "--show-toplevel")).trim() === directory, "manifest.source", "select the source checkout root");
  requireValue((await git("rev-parse", "HEAD")).trim() === revision, "identity.sourceRevision", "source revision differs from identity");
  const entries = (await git("ls-tree", "-rz", "--full-tree", "HEAD")).split("\0").filter(Boolean);
  const expected = [];
  for (const entry of entries) {
    const match = /^(100644|100755|120000) blob ([a-f0-9]{40})\t(.+)$/s.exec(entry);
    requireValue(match, "manifest.source", "source must contain tracked blobs stored as regular files, not submodules");
    const [, , blob, name] = match;
    expected.push(name);
    const actual = await reader.file(`${source}/${name}`, "identity.sourceRevision", { algorithm: "sha1", gitBlob: true });
    requireValue(actual.sha256 === blob, "identity.sourceRevision", "source files differ from their committed revision");
  }
  const actual = await reader.inventory(source, "manifest.source", true);
  requireValue(JSON.stringify(expected.sort()) === JSON.stringify(actual), "identity.sourceRevision", "source contains missing or untracked files");
}

export async function validateCandidate(manifestPath, { signal, onProgress = () => {} } = {}) {
  signal?.throwIfAborted();
  requireValue(typeof manifestPath === "string" && manifestPath.length > 0, "manifest", "select a manifest with --manifest <path>");
  const fullPath = path.resolve(manifestPath);
  let root;
  try { root = await realpath(path.dirname(fullPath)); }
  catch { throw new CandidateRefusal("manifest", "cannot read bundle directory; select an existing manifest"); }
  const reader = await bundleReader(root, signal);
  onProgress("Reading manifest");
  const { value: manifest } = await reader.file(path.basename(fullPath), "manifest", { json: true });
  version(manifest, "manifest");
  requireValue(["public-fixture", "release"].includes(manifest.purpose), "manifest.purpose");
  const identity = await reader.reference(manifest.identity, "manifest.identity", true);
  version(identity, "identity");
  requireValue(identity.format === 1, "identity.format", "expected fixed format 1");
  requireValue(identity.profile === 1, "identity.profile", "expected fixed profile 1");
  onProgress("Checking source revision");
  await verifySource(reader, manifest.source, identity.sourceRevision, signal);
  requireValue(manifest.lockfile === `${manifest.source}/package-lock.json`, "manifest.lockfile", "use the source checkout's package-lock.json");
  const lock = await reader.file(manifest.lockfile, "identity.lockfileSha256");
  requireValue(lock.sha256 === identity.lockfileSha256, "identity.lockfileSha256", "lockfile hash differs from identity");
  onProgress("Checking npm archive");
  const archive = await reader.file(manifest.npmArchive, "identity.npmSha256");
  requireValue(archive.sha256 === identity.npmSha256, "identity.npmSha256", "npm archive hash differs from identity");
  onProgress("Checking complete PWA asset set");
  requireValue(Array.isArray(identity.pwaAssets) && identity.pwaAssets.length > 0, "identity.pwaAssets", "a complete nonempty asset inventory is required");
  const names = new Set();
  for (const asset of identity.pwaAssets) {
    requireValue(asset && typeof asset === "object", "identity.pwaAssets");
    relativeName(asset.path, "identity.pwaAssets");
    requireValue(!names.has(asset.path), "identity.pwaAssets", "duplicate asset path");
    names.add(asset.path);
    await reader.reference({ path: `${manifest.pwaDirectory}/${asset.path}`, sha256: asset.sha256 }, "identity.pwaAssets");
  }
  const inventory = await reader.inventory(manifest.pwaDirectory, "identity.pwaAssets");
  requireValue(JSON.stringify([...names].sort()) === JSON.stringify(inventory), "identity.pwaAssets", "PWA inventory omits or adds assets");
  onProgress("Checking evidence and retained reports");
  const index = await reader.reference(manifest.evidenceIndex, "manifest.evidenceIndex", true);
  const evidence = await validateEvidence(index, { candidate: manifest.identity.sha256,
    purpose: manifest.purpose, readReference: reader.reference, signal });
  if (manifest.approval !== undefined) {
    const approval = manifest.approval;
    version(approval, "approval");
    requireValue(approval.candidate === manifest.identity.sha256, "approval.candidate", "approval belongs to another candidate; obtain renewed approval");
    requireValue(approval.evidenceIndex === manifest.evidenceIndex.sha256, "approval.evidenceIndex", "evidence changed after approval; obtain renewed approval");
    requireValue(manifest.purpose === "release", "approval.purpose", "public fixtures cannot authorize production");
    requireValue(approval.decision === "approved" && typeof approval.reviewer === "string" && approval.reviewer.trim(),
      "approval", "retain the approving maintainer and explicit decision");
  }
  await reader.unchanged();
  return { candidate: manifest.identity.sha256, evidenceIndex: manifest.evidenceIndex.sha256,
    purpose: manifest.purpose, approvalRequired: true, publicationAuthorized: false, ...evidence };
}

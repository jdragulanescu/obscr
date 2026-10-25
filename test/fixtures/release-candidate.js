import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

export const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const checklistBytes = await readFile(new URL("../../lib/release-checklist.json", import.meta.url));
export const checklist = JSON.parse(checklistBytes);

// These records simulate complete evidence. They prove only validator behavior.
export async function candidateFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "obscr-release-"));
  const put = async (name, bytes) => {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), bytes);
    return { path: name, sha256: digest(bytes) };
  };
  const json = (name, value) => put(name, JSON.stringify(value, null, 2) + "\n");
  await put("source/package-lock.json", '{"lockfileVersion":3}\n');
  await put("source/code.js", 'export const publicFixture = true;\n');
  const git = (...args) => execFileSync("git", args, {
    cwd: path.join(root, "source"), encoding: "utf8",
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_AUTHOR_NAME: "Public fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
      GIT_COMMITTER_NAME: "Public fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid",
      GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z" },
  }).trim();
  git("init", "-q");
  git("add", ".");
  git("-c", "commit.gpgsign=false", "commit", "-qm", "Public validator fixture");
  const archive = await put("package.tgz", "Public fixture archive bytes\n");
  const asset = await put("pwa/index.html", "Public fixture PWA bytes\n");
  const identity = {
    schemaVersion: 1, sourceRevision: git("rev-parse", "HEAD"),
    lockfileSha256: digest(await readFile(path.join(root, "source/package-lock.json"))),
    format: 1, profile: 1, npmSha256: archive.sha256,
    pwaAssets: [{ path: "index.html", sha256: asset.sha256 }],
  };
  const identityRef = await json("identity.json", identity);
  const report = await put("reports/public.txt", "SIMULATED PUBLIC FIXTURE. Not release evidence.\n");
  const fixtureManifest = await put("fixtures/manifest.json", '{"purpose":"public-fixture"}\n');
  const kinds = [...checklist.categories.map(() => "check"), ...checklist.requiredKinds];
  const records = kinds.map((kind, i) => ({
    schemaVersion: 1, purpose: "public-fixture",
    candidate: identityRef.sha256, check: `check-${i}`, run: "public-run-1",
    status: "pass", category: checklist.categories[i % 13], kind,
    fixtureManifest, fixtures: [report], report, observations: [report], exclusions: [],
    environment: { os: "Public fixture OS 1", runtime: { name: "Node", version: "24.13.0" },
      tools: [{ name: "public-validator-fixture", version: "1" }],
      device: { kind: kind.startsWith("physical-") ? "physical" : "fixture", model: "Simulated public model", osVersion: "1", ram: "not measurable in fixture", browser: { name: kind.split("-").at(-1), version: "1" } } },
    actions: ["Simulate the named requirement using public records"],
    expected: "A complete public record validates", actual: "A complete public record validates",
    limits: ["Simulated evidence; not a device measurement or independent review"],
    verifier: { name: "Public fixture reviewer", role: "reviewer", competence: "Simulated cryptographic and application-security reviewer" },
    ...(kind.includes("review") ? { review: {
      issue: kind === "application-review" ? 53 : kind === "tools-review" ? 52 : null,
      includes: kind === "application-review" ? [52] : [],
      scope: ["format", "implementation"], implementationAuthors: ["Public fixture author"], findings: [],
    } } : {}),
  }));
  records.find(record => record.kind === "application-review").review.coveredRecords =
    records.filter(record => record.kind !== "application-review").map(({ check, run }) => ({ check, run }));
  const saveReports = async () => {
    for (const record of records) {
      const { report: previous, ...payload } = record;
      record.report = await json(`reports/${record.check}-${record.run}.json`, payload);
    }
  };
  await saveReports();
  const index = {
    schemaVersion: 1, purpose: "public-fixture", candidate: identityRef.sha256,
    checklistRevision: digest(checklistBytes),
    clauses: checklist.requirements.map(({ id }, i) => ({ id, check: records[i % 13].check, run: records[i % 13].run })),
    records, carryForward: [],
  };
  const manifest = {
    schemaVersion: 1, purpose: "public-fixture", identity: identityRef,
    evidenceIndex: await json("evidence-index.json", index),
    source: "source", lockfile: "source/package-lock.json", npmArchive: "package.tgz", pwaDirectory: "pwa",
  };
  const save = async () => {
    manifest.identity = await json("identity.json", identity);
    manifest.evidenceIndex = await json("evidence-index.json", index);
    await json("manifest.json", manifest);
  };
  await save();
  return { root, identity, index, manifest, save, saveReports, put, json, git,
    manifestPath: path.join(root, "manifest.json"),
    cleanup: () => rm(root, { recursive: true, force: true }) };
}

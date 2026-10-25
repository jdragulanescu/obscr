import { candidateFixture, digest } from "../fixtures/release-candidate.js";
import { prepareNpm, publishNpm, validateReleaseRequest } from "../../lib/npm-distribution.js";
import { chmod, mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

let fixture;
let receipts;
beforeEach(async () => {
  fixture = await candidateFixture();
  receipts = await mkdtemp(path.join(tmpdir(), "obscr-npm-receipts-"));
});
afterEach(async () => {
  await fixture?.cleanup();
  await rm(receipts, { recursive: true, force: true });
});

function request() {
  return { schemaVersion: 1, artifactId: 123, artifactSha256: "a".repeat(64),
    candidate: fixture.manifest.identity.sha256, evidenceIndex: fixture.manifest.evidenceIndex.sha256 };
}
function input() {
  return { manifestPath: fixture.manifestPath, request: request(), sourceRevision: fixture.identity.sourceRevision };
}

test("the saved v1 release request is copied without changing its artifact or bundle identities", () => {
  const supplied = request();
  const selected = validateReleaseRequest(supplied);
  expect(selected).toEqual(supplied);
  supplied.artifactId = 456;
  expect(selected.artifactId).toBe(123);
});

test.each([
  ["schemaVersion", 2], ["artifactId", 0], ["artifactId", "123"],
  ["artifactId", Number.MAX_SAFE_INTEGER + 1], ["artifactSha256", "A".repeat(64)],
  ["candidate", "a".repeat(63)], ["evidenceIndex", null], ["unexpected", true],
])("a request with invalid %s is refused", (field, value) => {
  expect(() => validateReleaseRequest({ ...request(), [field]: value })).toThrow();
});

test("prepare validates the complete bundle without authorizing public fixtures", async () => {
  await expect(prepareNpm(input())).resolves.toEqual({
    candidate: fixture.manifest.identity.sha256, evidenceIndex: fixture.manifest.evidenceIndex.sha256,
    sourceRevision: fixture.identity.sourceRevision, npmSha256: fixture.identity.npmSha256,
    purpose: "public-fixture",
  });
});

test.each(["candidate", "evidenceIndex"])("prepare refuses a saved request for another %s", async field => {
  const selected = input();
  selected.request[field] = "b".repeat(64);
  await expect(prepareNpm(selected)).rejects.toMatchObject({ code: "NPM_REFUSED" });
});

test("prepare refuses a different source revision", async () => {
  await expect(prepareNpm({ ...input(), sourceRevision: "b".repeat(40) }))
    .rejects.toMatchObject({ field: "sourceRevision", code: "NPM_REFUSED" });
});

test.each([
  ["source/code.js", "changed source"], ["source/package-lock.json", "changed dependency lock"],
  ["package.tgz", "changed npm build"], ["pwa/index.html", "changed web build"],
  ["evidence-index.json", "{}"], ["reports/public.txt", "changed retained observation"],
])("prepare refuses changed retained bytes at %s", async (name, bytes) => {
  const selected = input();
  await fixture.put(name, bytes);
  await expect(prepareNpm(selected)).rejects.toMatchObject({ code: "NPM_REFUSED" });
});

test.each(["application-review", "tools-review", "physical-iphone-safari", "independent-review"])(
  "prepare cannot waive missing %s evidence", async kind => {
    fixture.index.records = fixture.index.records.filter(record => record.kind !== kind);
    await fixture.save();
    await expect(prepareNpm(input())).rejects.toMatchObject({ code: "NPM_REFUSED" });
  });

async function npmArchive(packageFields = {}) {
  const staging = path.join(receipts, "staging");
  await mkdir(path.join(staging, "package"), { recursive: true });
  await writeFile(path.join(staging, "package/package.json"), JSON.stringify({
    name: "obscr", version: "1.1.1", publishConfig: { registry: "https://registry.npmjs.org" },
    scripts: { prepublishOnly: "exit 97", publish: "exit 98", postpublish: "exit 99" },
    ...packageFields,
  }));
  execFileSync("tar", ["-czf", path.join(fixture.root, "package.tgz"), "-C", staging, "package"]);
  fixture.identity.npmSha256 = digest(await readFile(path.join(fixture.root, "package.tgz")));
  await fixture.save();
  fixture.index.candidate = fixture.manifest.identity.sha256;
  for (const record of fixture.index.records) record.candidate = fixture.manifest.identity.sha256;
  await fixture.saveReports();
  await fixture.save();
}

function publishInput() {
  const selected = input();
  return { ...selected, approval: { schemaVersion: 1, candidate: selected.request.candidate,
    evidenceIndex: selected.request.evidenceIndex, decision: "approved", reviewer: "maintainer",
    runId: 789, runAttempt: 1 }, run: { id: 789, attempt: 1 },
  receiptPath: path.join(receipts, "receipt.json") };
}

async function providerResult({ archivePath }) {
  const bytes = await readFile(archivePath);
  return { id: "obscr@1.1.1", name: "obscr", version: "1.1.1",
    shasum: createHash("sha1").update(bytes).digest("hex"),
    integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}` };
}

async function retainedReceipt(filename) {
  return JSON.parse(await readFile(filename, "utf8"));
}

test("one publication uses the private checked archive and retains the exact approval and request", async () => {
  await npmArchive();
  const selected = publishInput();
  const original = await readFile(path.join(fixture.root, "package.tgz"));
  let published;
  let attempts = 0;
  const receipt = await publishNpm(selected, { publishArchive: async payload => {
    attempts++;
    published = payload;
    expect(Object.keys(payload).sort()).toEqual(["archivePath", "purpose", "sha256", "sourceRevision"]);
    expect(payload).toMatchObject({ purpose: "public-fixture", sourceRevision: selected.sourceRevision,
      sha256: fixture.identity.npmSha256 });
    expect(payload.archivePath.startsWith(fixture.root + path.sep)).toBe(false);
    expect((await stat(path.dirname(payload.archivePath))).mode & 0o077).toBe(0);
    expect((await stat(payload.archivePath)).mode & 0o222).toBe(0);
    expect(await readFile(payload.archivePath)).toEqual(original);
    return providerResult(payload);
  } });
  expect(attempts).toBe(1);
  expect(receipt).toMatchObject({ schemaVersion: 1, request: selected.request, approval: selected.approval,
    run: selected.run, candidate: selected.request.candidate, evidenceIndex: selected.request.evidenceIndex,
    sourceRevision: selected.sourceRevision, npm: { status: "published", sha256: fixture.identity.npmSha256,
      name: "obscr", version: "1.1.1" } });
  expect(await retainedReceipt(selected.receiptPath)).toEqual(receipt);
  await expect(stat(path.dirname(published.archivePath))).rejects.toMatchObject({ code: "ENOENT" });
});

test("the default production boundary never accepts the public fixture purpose", async () => {
  const selected = publishInput();
  await expect(publishNpm(selected)).rejects.toMatchObject({ code: "NPM_REFUSED",
    field: "purpose", receiptRetained: true, receipt: { npm: { status: "refused" } } });
  expect(await retainedReceipt(selected.receiptPath)).toMatchObject({ npm: { status: "refused" } });
});

test.each([
  ["absent", undefined], ["decision", "rejected"], ["reviewer", ""], ["reviewer", "two words"],
  ["schemaVersion", 2], ["candidate", "b".repeat(64)], ["evidenceIndex", "b".repeat(64)],
  ["runId", 790], ["runAttempt", 2],
])("missing or mismatched approval (%s) stops publication", async (field, value) => {
  const selected = publishInput();
  if (field === "absent") selected.approval = value;
  else selected.approval[field] = value;
  let attempts = 0;
  await expect(publishNpm(selected, { publishArchive: async payload => {
    attempts++;
    return providerResult(payload);
  } })).rejects.toMatchObject({ code: "NPM_REFUSED", receipt: { npm: { status: "refused" } } });
  expect(attempts).toBe(0);
});

test.each([
  ["source/code.js", "changed source"], ["source/package-lock.json", "changed dependency lock"],
  ["package.tgz", "changed npm build"], ["pwa/index.html", "changed web build"],
  ["identity.json", "{}"], ["evidence-index.json", "{}"], ["reports/public.txt", "changed evidence"],
])("publication rechecks %s after preparation", async (name, bytes) => {
  await prepareNpm(input());
  const selected = publishInput();
  await fixture.put(name, bytes);
  let attempts = 0;
  await expect(publishNpm(selected, { publishArchive: async payload => {
    attempts++;
    return providerResult(payload);
  } })).rejects.toMatchObject({ receipt: { npm: { status: "refused" } } });
  expect(attempts).toBe(0);
});

test.each(["approval", "request"])("a mutable %s cannot change while publication prepares", async field => {
  await npmArchive();
  const selected = publishInput();
  let attempts = 0;
  const pending = publishNpm(selected, { publishArchive: async payload => {
    attempts++;
    return providerResult(payload);
  } });
  selected[field].candidate = "b".repeat(64);
  await expect(pending).rejects.toMatchObject({ receipt: { npm: { status: "refused" } } });
  expect(attempts).toBe(0);
});

test("a changed run or source cannot reuse preparation", async () => {
  const selected = publishInput();
  selected.run.attempt = 2;
  await expect(publishNpm(selected, { publishArchive: providerResult }))
    .rejects.toMatchObject({ code: "NPM_REFUSED", field: "approval.runAttempt" });
  await rm(selected.receiptPath);
  selected.run.attempt = 1;
  selected.sourceRevision = "b".repeat(40);
  await expect(publishNpm(selected, { publishArchive: providerResult }))
    .rejects.toMatchObject({ code: "NPM_REFUSED", field: "sourceRevision" });
});

test("invalid npm archive bytes are refused before the provider is called", async () => {
  const selected = publishInput();
  let attempts = 0;
  await expect(publishNpm(selected, { publishArchive: async payload => {
    attempts++;
    return providerResult(payload);
  } })).rejects.toMatchObject({ field: "npm.archive", receipt: { npm: { status: "refused" } } });
  expect(attempts).toBe(0);
});

test.each([
  { name: "another-package" }, { version: "not-semver" }, { private: true },
  { publishConfig: { registry: "https://example.invalid" } },
  { publishConfig: { registry: "https://registry.npmjs.org", _authToken: "not-a-real-secret" } },
  { publishConfig: { "ignore-scripts": false } },
])("unsafe npm package metadata is refused: %j", async packageFields => {
  await npmArchive(packageFields);
  let attempts = 0;
  await expect(publishNpm(publishInput(), { publishArchive: async payload => {
    attempts++;
    return providerResult(payload);
  } })).rejects.toMatchObject({ receipt: { npm: { status: "refused" } } });
  expect(attempts).toBe(0);
});

test("provider failure is unknown, not a claim that no publication happened, and is never retried", async () => {
  await npmArchive();
  const selected = publishInput();
  let snapshot;
  let attempts = 0;
  let failure;
  try {
    await publishNpm(selected, { publishArchive: async ({ archivePath }) => {
      snapshot = archivePath;
      attempts++;
      throw new Error("network ended after upload; token=do-not-retain");
    } });
  } catch (error) { failure = error; }
  expect(attempts).toBe(1);
  expect(failure).toMatchObject({ code: "NPM_UNKNOWN", receiptRetained: true,
    receipt: { npm: { status: "unknown" } } });
  expect(failure.message + JSON.stringify(failure.receipt)).not.toContain("do-not-retain");
  expect(await retainedReceipt(selected.receiptPath)).toEqual(failure.receipt);
  await expect(stat(path.dirname(snapshot))).rejects.toMatchObject({ code: "ENOENT" });
});

test.each([undefined, {}, { status: "published" }, { id: "obscr@1.1.1", name: "obscr", version: "1.1.1",
  shasum: "a".repeat(40), integrity: "sha512-not-the-checked-archive" }])(
  "a provider result without checked npm success remains unknown: %j", async response => {
    await npmArchive();
    await expect(publishNpm(publishInput(), { publishArchive: async () => response }))
      .rejects.toMatchObject({ code: "NPM_UNKNOWN", receipt: { npm: { status: "unknown" } } });
  });

test("mutation of the bundle and caller objects at the boundary cannot replace published bytes or receipt identity", async () => {
  await npmArchive();
  const selected = publishInput();
  const approved = structuredClone(selected);
  const original = await readFile(path.join(fixture.root, "package.tgz"));
  const receipt = await publishNpm(selected, { publishArchive: async payload => {
    await fixture.put("package.tgz", "replacement bytes");
    await fixture.put("identity.json", "{}");
    selected.request.candidate = "b".repeat(64);
    selected.approval.reviewer = "someone-else";
    selected.run.attempt = 2;
    expect(await readFile(payload.archivePath)).toEqual(original);
    return providerResult(payload);
  } });
  expect(receipt).toMatchObject({ request: approved.request, approval: approved.approval,
    run: approved.run, npm: { status: "published", sha256: digest(original) } });
});

test("an existing receipt is preserved and prevents another publication", async () => {
  const selected = publishInput();
  const earlier = '{\"earlier\":\"evidence\"}\\n';
  await writeFile(selected.receiptPath, earlier);
  let attempts = 0;
  await expect(publishNpm(selected, { publishArchive: async payload => {
    attempts++;
    return providerResult(payload);
  } })).rejects.toMatchObject({ code: "RECEIPT_NOT_RETAINED", receipt: { npm: { status: "refused" } } });
  expect(attempts).toBe(0);
  expect(await readFile(selected.receiptPath, "utf8")).toBe(earlier);
});

test.each(["direct", "symlink"])("a receipt cannot be written inside the input bundle through a %s path", async kind => {
  const selected = publishInput();
  if (kind === "symlink") {
    await symlink(fixture.root, path.join(receipts, "linked"));
    selected.receiptPath = path.join(receipts, "linked", "receipt.json");
  } else selected.receiptPath = path.join(fixture.root, "receipt.json");
  await expect(publishNpm(selected, { publishArchive: providerResult }))
    .rejects.toMatchObject({ code: "RECEIPT_NOT_RETAINED", receipt: { npm: { status: "refused" } } });
  await expect(stat(path.join(fixture.root, "receipt.json"))).rejects.toMatchObject({ code: "ENOENT" });
});

test("loss of the receipt after provider success reports publication without claiming retained success", async () => {
  await npmArchive();
  const selected = publishInput();
  let snapshot;
  let failure;
  try {
    await publishNpm(selected, { publishArchive: async payload => {
      snapshot = payload.archivePath;
      const response = await providerResult(payload);
      await rm(selected.receiptPath);
      await writeFile(selected.receiptPath, "replacement evidence must survive\n");
      return response;
    } });
  } catch (error) { failure = error; }
  expect(failure).toMatchObject({ code: "RECEIPT_NOT_RETAINED", receiptRetained: false,
    receipt: { npm: { status: "published" } } });
  expect(await readFile(selected.receiptPath, "utf8")).toBe("replacement evidence must survive\n");
  await expect(stat(path.dirname(snapshot))).rejects.toMatchObject({ code: "ENOENT" });
});

test("cancellation before the provider refuses publication and retains a receipt", async () => {
  const controller = new AbortController();
  controller.abort(new Error("private cancellation detail"));
  await expect(publishNpm({ ...publishInput(), signal: controller.signal }, { publishArchive: providerResult }))
    .rejects.toMatchObject({ code: "NPM_REFUSED", receipt: { npm: { status: "refused" } } });
});

test("a modified private snapshot cannot produce a published receipt for the approved bytes", async () => {
  await npmArchive();
  let snapshot;
  await expect(publishNpm(publishInput(), { publishArchive: async payload => {
    snapshot = payload.archivePath;
    await chmod(payload.archivePath, 0o600);
    await writeFile(payload.archivePath, "provider used different bytes");
    return providerResult(payload);
  } })).rejects.toMatchObject({ code: "NPM_UNKNOWN", receipt: { npm: { status: "unknown" } } });
  await expect(stat(path.dirname(snapshot))).rejects.toMatchObject({ code: "ENOENT" });
});

test("npm publication output keyed by package name is accepted only for the checked archive", async () => {
  await npmArchive();
  await expect(publishNpm(publishInput(), { publishArchive: async payload => ({
    obscr: await providerResult(payload),
  }) })).resolves.toMatchObject({ npm: { status: "published", name: "obscr" } });
});

test("unknown manifest purposes cannot reach even an injected provider", async () => {
  fixture.manifest.purpose = "production-bypass";
  await fixture.save();
  let attempts = 0;
  await expect(publishNpm(publishInput(), { publishArchive: async payload => {
    attempts++;
    return providerResult(payload);
  } })).rejects.toMatchObject({ code: "NPM_REFUSED", receipt: { npm: { status: "refused" } } });
  expect(attempts).toBe(0);
});

test("loss of evidence retention after a provider failure still reports the unknown external outcome", async () => {
  await npmArchive();
  const selected = publishInput();
  await expect(publishNpm(selected, { publishArchive: async () => {
    await rm(selected.receiptPath);
    throw new Error("the request may already have completed");
  } })).rejects.toMatchObject({ code: "RECEIPT_NOT_RETAINED", receiptRetained: false,
    receipt: { npm: { status: "unknown" } } });
});

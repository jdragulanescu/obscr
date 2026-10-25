import { candidateFixture } from "../fixtures/release-candidate.js";
import { validateCandidate } from "../../lib/candidate-validation.js";
import { chmod, readFile, rm, symlink } from "node:fs/promises";
import path from "node:path";
import { writeFileSync } from "node:fs";

let fixture;
beforeEach(async () => { fixture = await candidateFixture(); });
afterEach(async () => { await fixture?.cleanup(); });

test("a complete public candidate returns identity but no release authorization", async () => {
  const result = await validateCandidate(fixture.manifestPath);
  expect(result).toMatchObject({ candidate: fixture.manifest.identity.sha256,
    evidenceIndex: fixture.manifest.evidenceIndex.sha256, purpose: "public-fixture", approvalRequired: true, publicationAuthorized: false });
});

test("a changed npm archive is refused even when version text is unchanged", async () => {
  await fixture.put("package.tgz", "changed archive\n");
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "identity.npmSha256" });
});

test("a category-only index cannot omit a normative clause", async () => {
  fixture.index.clauses.pop();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.clauses" });
});

test.each(["fail", "unmet", "skipped", "not-run"])("a mandatory %s record refuses validation", async (status) => {
  fixture.index.records[0].status = status;
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.records.check-0" });
});

test.each(["fixtureManifest", "fixtures", "environment", "actions", "expected", "actual", "limits", "verifier", "report", "observations", "exclusions"])(
  "a report without %s cannot be mandatory evidence", async (field) => {
    delete fixture.index.records[0][field];
    if (field !== "report") await fixture.saveReports();
    await fixture.save();
    await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.records.check-0" });
  });

test.each(["physical-iphone-safari", "physical-android-chrome", "independent-review", "application-review", "tools-review"])(
  "missing %s evidence refuses the release", async (kind) => {
    fixture.index.records = fixture.index.records.filter(record => record.kind !== kind);
    await fixture.save();
    await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.requiredKinds" });
  });

test("changing an indexed result cannot relabel the retained report", async () => {
  fixture.index.records[0].actual = "A different observation";
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.records.check-0" });
});

test("self review does not count as independent security review", async () => {
  const record = fixture.index.records.find(record => record.kind === "independent-review");
  record.review.implementationAuthors.push(record.verifier.name);
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: `evidence.records.${record.check}` });
});

test("stale evidence cannot silently carry to another candidate", async () => {
  fixture.index.records[0].candidate = "a".repeat(64);
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.records.check-0" });
});

test.each(["candidate", "evidenceIndex"])("approval for a changed %s hash is rejected", async (field) => {
  fixture.manifest.approval = { schemaVersion: 1, candidate: fixture.manifest.identity.sha256,
    evidenceIndex: fixture.manifest.evidenceIndex.sha256, decision: "approved", reviewer: "Maintainer" };
  fixture.manifest.approval[field] = "a".repeat(64);
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: `approval.${field}` });
});

test("a matching approval cannot authorize a public fixture", async () => {
  fixture.manifest.approval = { schemaVersion: 1, candidate: fixture.manifest.identity.sha256,
    evidenceIndex: fixture.manifest.evidenceIndex.sha256, decision: "approved", reviewer: "Maintainer" };
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "approval.purpose" });
});

async function carryForward() {
  const previousCandidate = fixture.manifest.identity.sha256;
  const previousIdentity = await fixture.json("history/identity.json", fixture.identity);
  const previousIndex = await fixture.json("history/index.json", fixture.index);
  fixture.identity.npmSha256 = (await fixture.put("package.tgz", "New public artifact\n")).sha256;
  await fixture.save();
  const candidate = fixture.manifest.identity.sha256;
  fixture.index.candidate = candidate;
  const impact = {
    schemaVersion: 1, fromCandidate: previousCandidate, toCandidate: candidate,
    previousIndex: previousIndex.sha256, checklistRevision: fixture.index.checklistRevision,
    decision: "approved", reason: "Public fixture impact review",
    reviewer: { name: "Independent impact reviewer", role: "reviewer", competence: "Release impact review" },
    affectedChecks: ["check-0", "check-20"],
    unaffectedChecks: fixture.index.records.filter(record => !["check-0", "check-20"].includes(record.check)).map(record => record.check),
    observations: [fixture.index.records[0].observations[0]], exclusions: [],
  };
  const record = fixture.index.records[0];
  record.candidate = candidate;
  record.run = "public-run-2";
  const { report, ...payload } = record;
  record.report = await fixture.json("reports/check-0-public-run-2.json", payload);
  for (const clause of fixture.index.clauses) if (clause.check === "check-0") clause.run = record.run;
  const review = fixture.index.records.find(record => record.kind === "application-review");
  review.candidate = candidate;
  review.run = "public-run-2";
  review.review.coveredRecords = fixture.index.records.filter(record => record !== review).map(({ check, run }) => ({ check, run }));
  const { report: oldReview, ...reviewPayload } = review;
  review.report = await fixture.json("reports/check-20-public-run-2.json", reviewPayload);
  fixture.index.carryForward = [{ identity: previousIdentity, index: previousIndex,
    impact: await fixture.json("history/impact.json", impact) }];
  await fixture.save();
  return impact;
}

test("an explicit reviewed impact permits unchanged evidence and a fresh affected run", async () => {
  await carryForward();
  await expect(validateCandidate(fixture.manifestPath)).resolves.toMatchObject({
    candidate: fixture.manifest.identity.sha256, publicationAuthorized: false,
  });
});

test("an affected check must rerun, not retain the old candidate or run", async () => {
  const impact = await carryForward();
  impact.affectedChecks.push("check-1");
  impact.unaffectedChecks = impact.unaffectedChecks.filter(check => check !== "check-1");
  fixture.index.carryForward[0].impact = await fixture.json("history/impact.json", impact);
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.records.check-1" });
});

test("carry-forward refuses a missing original raw observation after other files pass", async () => {
  await carryForward();
  await fixture.put("reports/public.txt", "changed old raw observation");
  await expect(validateCandidate(fixture.manifestPath)).rejects.toHaveProperty("field");
});

test.each([
  ["schemaVersion", 2, "identity"],
  ["sourceRevision", "a".repeat(40), "identity.sourceRevision"],
  ["lockfileSha256", "a".repeat(64), "identity.lockfileSha256"],
  ["format", 2, "identity.format"],
  ["profile", 2, "identity.profile"],
  ["npmSha256", "a".repeat(64), "identity.npmSha256"],
  ["pwaAssets", [], "identity.pwaAssets"],
])("a mismatched identity %s refuses validation", async (key, value, field) => {
  fixture.identity[key] = value;
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field });
});

test.each([
  ["source/code.js", "identity.sourceRevision"],
  ["source/package-lock.json", "identity.sourceRevision"],
  ["package.tgz", "identity.npmSha256"],
  ["pwa/index.html", "identity.pwaAssets"],
  ["identity.json", "manifest.identity"],
  ["evidence-index.json", "manifest.evidenceIndex"],
])("a missing %s refuses validation", async (name, field) => {
  await rm(path.join(fixture.root, name));
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field });
});

test.each([
  ["source/code.js", "identity.sourceRevision"],
  ["source/package-lock.json", "identity.sourceRevision"],
  ["pwa/index.html", "identity.pwaAssets"],
  ["identity.json", "manifest.identity"],
  ["evidence-index.json", "manifest.evidenceIndex"],
])("changed input %s refuses validation", async (name, field) => {
  await fixture.put(name, "changed content");
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field });
});

test.each(["pwa/extra.js", "pwa/nested/extra.js", "source/untracked.js"])(
  "an unlisted input %s cannot hide outside the inventory", async (name) => {
    await fixture.put(name, "unlisted");
    await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({
      field: name.startsWith("pwa/") ? "identity.pwaAssets" : "identity.sourceRevision",
    });
  });

test.each(["../outside", "/etc/passwd", "pwa/../package.tgz", "pwa\\index.html"])(
  "an unsafe bundle path %s is refused", async (name) => {
    fixture.manifest.npmArchive = name;
    await fixture.save();
    await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "identity.npmSha256" });
  });

test("a symbolic link cannot substitute for a retained archive", async () => {
  await rm(path.join(fixture.root, "package.tgz"));
  await symlink("reports/public.txt", path.join(fixture.root, "package.tgz"));
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "identity.npmSha256" });
});

test("an unreadable archive reports the input field without changing it", async () => {
  const name = path.join(fixture.root, "package.tgz");
  const before = await readFile(name);
  await chmod(name, 0);
  try {
    await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "identity.npmSha256" });
  } finally { await chmod(name, 0o600); }
  expect(await readFile(name)).toEqual(before);
});

test.each([
  ["checklistRevision", "a".repeat(64), "evidence.checklistRevision"],
  ["candidate", "a".repeat(64), "evidence.candidate"],
  ["schemaVersion", 2, "evidence.schemaVersion"],
  ["purpose", "release", "evidence.purpose"],
  ["clauses", [], "evidence.clauses"],
  ["records", [], "evidence.records"],
  ["carryForward", null, "evidence.carryForward"],
])("an invalid index %s refuses validation", async (key, value, field) => {
  fixture.index[key] = value;
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field });
});

test("all A1-A13 categories must be represented", async () => {
  for (const record of fixture.index.records) if (record.category === "A13") record.category = "A1";
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.categories" });
});

test("an emulated phone cannot meet a physical-device record", async () => {
  const record = fixture.index.records.find(record => record.kind === "physical-iphone-safari");
  record.environment.device.kind = "emulated";
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: `evidence.records.${record.check}` });
});

test("application review must include the tools review", async () => {
  const record = fixture.index.records.find(record => record.kind === "application-review");
  record.review.includes = [];
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: `evidence.records.${record.check}` });
});

test("application review must cover all A1-A13 and the actual check runs", async () => {
  const record = fixture.index.records.find(record => record.kind === "application-review");
  record.review.coveredRecords = [];
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: `evidence.records.${record.check}` });
});

test("iphone Safari evidence cannot name a different browser", async () => {
  const record = fixture.index.records.find(record => record.kind === "physical-iphone-safari");
  record.environment.device.browser.name = "Chrome";
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: `evidence.records.${record.check}` });
});

test("unreviewed impact cannot carry forward otherwise matching records", async () => {
  const impact = await carryForward();
  delete impact.reviewer;
  fixture.index.carryForward[0].impact = await fixture.json("history/impact.json", impact);
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.carryForward" });
});

test("a changed index invalidates an approval even when the candidate is identical", async () => {
  fixture.manifest.approval = { schemaVersion: 1, candidate: fixture.manifest.identity.sha256,
    evidenceIndex: fixture.manifest.evidenceIndex.sha256, decision: "approved", reviewer: "Maintainer" };
  fixture.index.retainedNote = "A new retained annotation";
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "approval.evidenceIndex" });
});

test.each(["{", "null", "[]", "{\"schemaVersion\":2}", "\ufffd"])(
  "malformed or unsupported manifest %j refuses safely", async (content) => {
    await fixture.put("manifest.json", content);
    await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "manifest" });
  });

test("JSON larger than the documented bound is refused before parsing", async () => {
  await fixture.put("manifest.json", " ".repeat(16 * 1024 * 1024 + 1));
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "manifest" });
});

test("a duplicate PWA path cannot substitute for a complete inventory", async () => {
  fixture.identity.pwaAssets.push(fixture.identity.pwaAssets[0]);
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "identity.pwaAssets" });
});

test("cancellation before reading files reports cancellation, not validity", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(validateCandidate(fixture.manifestPath, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
});

test("a PWA file added after its first inventory cannot produce a valid result", async () => {
  await expect(validateCandidate(fixture.manifestPath, {
    onProgress(stage) {
      if (stage === "Checking evidence and retained reports") {
        writeFileSync(path.join(fixture.root, "pwa/late.js"), "late asset");
      }
    },
  })).rejects.toMatchObject({ field: "identity.pwaAssets" });
});

test("a source file changed after hashing cannot produce a valid result", async () => {
  await expect(validateCandidate(fixture.manifestPath, {
    onProgress(stage) {
      if (stage === "Checking npm archive") writeFileSync(path.join(fixture.root, "source/code.js"), "late source");
    },
  })).rejects.toMatchObject({ field: "identity.sourceRevision" });
});

test.each([
  ["check", "unsafe\u001b[2J"], ["run", ""], ["schemaVersion", 2], ["purpose", "release"],
  ["kind", "unknown"], ["actions", []], ["expected", ""], ["actual", " "],
  ["limits", []], ["verifier", { name: "Somebody" }], ["environment", {}],
  ["exclusions", [{ reason: "", artifact: {} }]],
])("invalid report field %s cannot count as evidence", async (key, value) => {
  fixture.index.records[0][key] = value;
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toHaveProperty("field");
});

test("duplicate check/run records cannot create ambiguous current results", async () => {
  fixture.index.records.push(fixture.index.records[0]);
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.records.check-0" });
});

test("a clause cannot point at an absent run", async () => {
  fixture.index.clauses[0].run = "missing-run";
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.clauses" });
});

test("hundreds of retained reports validate without dropping later failures", async () => {
  for (let i = 0; i < 200; i++) {
    fixture.index.records.push({ ...fixture.index.records[0], check: `extra-${i}` });
  }
  const review = fixture.index.records.find(record => record.kind === "application-review");
  review.review.coveredRecords = fixture.index.records.filter(record => record !== review).map(({ check, run }) => ({ check, run }));
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).resolves.toMatchObject({ recordCount: 222 });
  fixture.index.records.at(-1).status = "fail";
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.records.extra-199" });
});

test("review findings need resolved evidence and cannot waive mandatory criteria", async () => {
  const record = fixture.index.records.find(record => record.kind === "independent-review");
  const decision = await fixture.json("reports/risk-decision.json", {
    decision: "accepted", reviewer: "Maintainer", reason: "Specific documented residual risk",
    finding: "risk-1", candidate: fixture.manifest.identity.sha256,
  });
  record.review.findings = [{ id: "risk-1", status: "accepted", evidence: record.observations[0],
    humanDecision: decision, mandatoryCriterionChanged: false }];
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).resolves.toHaveProperty("candidate");
  record.review.findings[0].mandatoryCriterionChanged = true;
  await fixture.saveReports();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: `evidence.records.${record.check}` });
});

test("production selection cannot promote public fixture records", async () => {
  fixture.manifest.purpose = "release";
  fixture.index.purpose = "release";
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "evidence.records.check-0" });
});

async function releaseApprovalFixture() {
  fixture.manifest.purpose = "release";
  fixture.index.purpose = "release";
  for (const record of fixture.index.records) record.purpose = "release";
  await fixture.saveReports();
  await fixture.save();
  fixture.manifest.approval = { schemaVersion: 1, candidate: fixture.manifest.identity.sha256,
    evidenceIndex: fixture.manifest.evidenceIndex.sha256, decision: "approved", reviewer: "Maintainer" };
}

test("a matching release approval validates its binding without authorizing publication", async () => {
  await releaseApprovalFixture();
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).resolves.toMatchObject({
    purpose: "release", approvalRequired: true, publicationAuthorized: false,
  });
});

test.each([
  ["reviewer", undefined], ["reviewer", ""], ["reviewer", " "], ["reviewer", null],
  ["decision", "rejected"], ["decision", null], ["schemaVersion", 2],
])("invalid release approval %s refuses validation", async (key, value) => {
  await releaseApprovalFixture();
  fixture.manifest.approval[key] = value;
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "approval" });
});

test("an old unresolved review stays intact when affected reviews rerun", async () => {
  const prior = fixture.index.records.find(record => record.kind === "independent-review");
  prior.status = "fail";
  prior.review.findings = [{ id: "review-failure", status: "open", evidence: prior.observations[0] }];
  await fixture.saveReports();
  await fixture.save();
  const oldReportBytes = await readFile(path.join(fixture.root, prior.report.path));
  const oldReportPath = prior.report.path;
  const impact = await carryForward();
  impact.affectedChecks.push(prior.check);
  impact.unaffectedChecks = impact.unaffectedChecks.filter(check => check !== prior.check);
  prior.candidate = fixture.manifest.identity.sha256;
  prior.run = "public-run-2";
  prior.status = "pass";
  prior.review.findings[0].status = "fixed";
  const { report, ...payload } = prior;
  prior.report = await fixture.json("reports/review-rerun.json", payload);
  const application = fixture.index.records.find(record => record.kind === "application-review");
  application.review.coveredRecords = fixture.index.records.filter(record => record !== application).map(({ check, run }) => ({ check, run }));
  const { report: oldApplication, ...applicationPayload } = application;
  application.report = await fixture.json("reports/application-rerun.json", applicationPayload);
  fixture.index.carryForward[0].impact = await fixture.json("history/impact.json", impact);
  await fixture.save();
  await expect(validateCandidate(fixture.manifestPath)).resolves.toHaveProperty("candidate");
  expect(await readFile(path.join(fixture.root, oldReportPath))).toEqual(oldReportBytes);
});

test("missing Git objects cannot invoke a supplied transport helper", async () => {
  const tree = fixture.git("rev-parse", "HEAD^{tree}");
  const marker = path.join(fixture.root, "transport-executed");
  fixture.git("config", "remote.origin.url", `ext::touch ${marker}`);
  fixture.git("config", "remote.origin.promisor", "true");
  fixture.git("config", "remote.origin.partialclonefilter", "blob:none");
  fixture.git("config", "protocol.ext.allow", "always");
  await rm(path.join(fixture.root, "source/.git/objects", tree.slice(0, 2), tree.slice(2)));
  await expect(validateCandidate(fixture.manifestPath)).rejects.toMatchObject({ field: "identity.sourceRevision" });
  await expect(readFile(marker)).rejects.toMatchObject({ code: "ENOENT" });
});

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const checklistBytes = await readFile(new URL("./release-checklist.json", import.meta.url));
const checklist = JSON.parse(checklistBytes);
const checklistRevision = createHash("sha256").update(checklistBytes).digest("hex");
const requiredClauses = new Set(checklist.requirements.map(({ id }) => id));
const identifier = value => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
const text = value => typeof value === "string" && value.trim().length > 0;
const texts = value => Array.isArray(value) && value.length > 0 && value.every(text);
const namedVersion = value => value && text(value.name) && text(value.version);

function requireEvidence(condition, field, reason = "invalid or missing mandatory evidence") {
  if (!condition) {
    const error = new Error(`${field}: ${reason}`);
    error.name = "EvidenceRefusal";
    error.field = field;
    throw error;
  }
}

function validateEnvironment(record, field) {
  const environment = record.environment;
  requireEvidence(environment && text(environment.os) && namedVersion(environment.runtime) &&
    Array.isArray(environment.tools) && environment.tools.length > 0 && environment.tools.every(namedVersion),
  field, "record OS, runtime and tool versions");
  const device = environment.device;
  requireEvidence(device && text(device.kind) && text(device.model) && text(device.osVersion) && text(device.ram),
    field, "record device model, OS version and RAM or its measurement limit");
  if (record.kind.startsWith("physical-")) {
    requireEvidence(device.kind === "physical" && namedVersion(device.browser), field, "physical-phone evidence is required; emulation is not a substitute");
  }
  if (record.kind.startsWith("desktop-")) {
    requireEvidence(namedVersion(device.browser), field, "record the actual browser and version");
  }
  if (record.kind.startsWith("physical-") || record.kind.startsWith("desktop-")) {
    requireEvidence(device.browser.name.toLowerCase() === record.kind.split("-").at(-1),
      field, "browser does not match the required platform record");
  }
  if (record.kind === "node-lts") {
    requireEvidence(environment.runtime.name.toLowerCase() === "node" && /^24\.\d+\.\d+$/.test(environment.runtime.version),
      field, "record the supported Node 24.x LTS baseline");
  }
}

async function validateFinding(finding, record, field, readReference) {
  requireEvidence(finding && identifier(finding.id) && ["fixed", "accepted"].includes(finding.status),
    field, "every review finding needs a completed disposition");
  await readReference(finding.evidence, field);
  if (finding.status !== "accepted") return;
  requireEvidence(finding.mandatoryCriterionChanged === false, field, "residual-risk acceptance cannot waive a mandatory criterion");
  const decision = await readReference(finding.humanDecision, field, true);
  requireEvidence(decision && decision.decision === "accepted" && text(decision.reviewer) &&
    text(decision.reason) && decision.finding === finding.id && decision.candidate === record.candidate,
  field, "retain the human decision bound to this candidate and finding");
}

async function validateReview(record, field, readReference) {
  const review = record.review;
  requireEvidence(review && Array.isArray(review.scope) && review.scope.includes("format") &&
    review.scope.includes("implementation") && texts(review.implementationAuthors) && Array.isArray(review.findings),
  field, "review must cover the complete format and implementation, with authors and finding dispositions");
  if (record.kind === "independent-review") {
    requireEvidence(!review.implementationAuthors.some(author => author.trim().toLowerCase() === record.verifier.name.trim().toLowerCase()),
      field, "implementation-author self review is not independent review");
  }
  if (record.kind === "application-review") {
    requireEvidence(review.issue === 53 && Array.isArray(review.includes) && review.includes.includes(52),
      field, "the complete application review #53 must include tools review #52");
  }
  if (record.kind === "tools-review") requireEvidence(review.issue === 52, field, "tools review #52 is required");
  for (const finding of review.findings) await validateFinding(finding, record, field, readReference);
}

async function verifyReportIntegrity(record, field, readReference) {
  const retained = await readReference(record.report, field, true);
  const { report, ...payload } = record;
  requireEvidence(isDeepStrictEqual(retained, payload), field, "index differs from the retained report; never relabel old observations");
}

async function verifyHistoricalArtifacts(record, field, readReference) {
  if (record.fixtureManifest !== undefined) await readReference(record.fixtureManifest, field);
  for (const key of ["fixtures", "observations", "exclusions"]) {
    if (record[key] === undefined) continue;
    requireEvidence(Array.isArray(record[key]), field, "historical artifact lists must remain readable");
    for (const item of record[key]) {
      const ref = key === "exclusions" ? item?.artifact : item;
      await readReference(ref, field);
    }
  }
  if (record.report !== undefined) await verifyReportIntegrity(record, field, readReference);
}

async function validateHistoricalRecord(record, purpose, readReference) {
  const field = `evidence.records.${record.check}`;
  requireEvidence(record.schemaVersion === 1 && record.purpose === purpose, field, "historical report schema or purpose differs");
  await verifyHistoricalArtifacts(record, field, readReference);
  if (record.review?.findings === undefined) return;
  requireEvidence(Array.isArray(record.review.findings), field, "historical finding list must remain readable");
  for (const finding of record.review.findings) {
    requireEvidence(finding && typeof finding === "object", field, "historical finding must remain readable");
    if (finding.evidence !== undefined) await readReference(finding.evidence, field);
    if (finding.humanDecision !== undefined) await readReference(finding.humanDecision, field);
  }
}

async function validateRecord(record, purpose, readReference) {
  const field = `evidence.records.${record.check}`;
  requireEvidence(record.schemaVersion === 1 && record.purpose === purpose, field, "report schema or fixture/release purpose differs");
  requireEvidence(checklist.categories.includes(record.category), field, "name an A1–A13 category");
  requireEvidence(record.kind === "check" || checklist.requiredKinds.includes(record.kind), field, "unknown evidence kind");
  requireEvidence(texts(record.actions) && text(record.expected) && text(record.actual) &&
    texts(record.limits), field, "record actions, expected/actual results and explicit limits");
  requireEvidence(record.verifier && text(record.verifier.name) && text(record.verifier.role) &&
    text(record.verifier.competence), field, "name the verifier, role and competence");
  validateEnvironment(record, field);
  requireEvidence(Array.isArray(record.fixtures) && record.fixtures.length > 0 &&
    Array.isArray(record.observations) && record.observations.length > 0 && Array.isArray(record.exclusions),
  field, "retain fixture hashes, raw observations and explicit exclusions");
  await readReference(record.fixtureManifest, field);
  for (const ref of [...record.fixtures, ...record.observations]) await readReference(ref, field);
  for (const exclusion of record.exclusions) {
    requireEvidence(exclusion && text(exclusion.reason), field, "an exclusion needs a recorded reason and original observation");
    await readReference(exclusion.artifact, field);
  }
  if (record.kind.endsWith("review")) await validateReview(record, field, readReference);
  await verifyReportIntegrity(record, field, readReference);
}

async function validateCarryForward(index, candidate, purpose, readReference, signal) {
  const field = "evidence.carryForward";
  requireEvidence(Array.isArray(index.carryForward), field, "declare carryForward explicitly, even when empty");
  const allowed = new Map();
  for (const carry of index.carryForward) {
    signal?.throwIfAborted();
    requireEvidence(carry && typeof carry === "object", field);
    const identity = await readReference(carry.identity, field, true);
    const previous = await readReference(carry.index, field, true);
    const impact = await readReference(carry.impact, field, true);
    requireEvidence(identity?.schemaVersion === 1 && identity.format === 1 && identity.profile === 1 &&
      previous?.schemaVersion === 1 && previous.candidate === carry.identity.sha256 &&
      previous.purpose === purpose && previous.checklistRevision === checklistRevision && Array.isArray(previous.records),
    field, "retain the original candidate and evidence index with the same checklist and purpose");
    requireEvidence(impact?.schemaVersion === 1 && impact.fromCandidate === previous.candidate &&
      impact.toCandidate === candidate && impact.fromCandidate !== candidate &&
      impact.previousIndex === carry.index.sha256 && impact.checklistRevision === checklistRevision &&
      impact.decision === "approved" && text(impact.reason) && text(impact.reviewer?.name) &&
      text(impact.reviewer?.role) && text(impact.reviewer?.competence),
    field, "retain an explicit reviewed impact record bound to both candidates and the old index");
    requireEvidence(!allowed.has(previous.candidate), field, "duplicate prior candidate");
    requireEvidence(Array.isArray(impact.affectedChecks) && Array.isArray(impact.unaffectedChecks) &&
      [...impact.affectedChecks, ...impact.unaffectedChecks].every(identifier),
    field, "classify every old and new check as affected or unaffected");
    const classified = [...impact.affectedChecks, ...impact.unaffectedChecks];
    const allChecks = new Set([...previous.records, ...index.records].map(record => record?.check));
    requireEvidence(new Set(classified).size === classified.length && classified.length === allChecks.size &&
      classified.every(check => allChecks.has(check)), field, "impact classification is missing, duplicated or contradictory");
    requireEvidence(Array.isArray(impact.observations) && impact.observations.length > 0 && Array.isArray(impact.exclusions),
      field, "retain impact observations and exclusions");
    for (const ref of impact.observations) await readReference(ref, field);
    for (const exclusion of impact.exclusions) {
      requireEvidence(text(exclusion?.reason), field, "record why an observation was excluded");
      await readReference(exclusion.artifact, field);
    }
    const oldRecords = new Map();
    for (const record of previous.records) {
      requireEvidence(record && identifier(record.check) && identifier(record.run), field, "invalid historical check/run");
      // Preserve historical failures too; only passing unaffected records can be reused below.
      await validateHistoricalRecord(record, purpose, readReference);
      const key = `${record.check}/${record.run}`;
      requireEvidence(!oldRecords.has(key), field, "duplicate historical check/run");
      oldRecords.set(key, record);
    }
    for (const check of impact.affectedChecks) {
      const reruns = index.records.filter(record => record.check === check);
      requireEvidence(reruns.length > 0 && reruns.every(record => record.candidate === candidate &&
        !oldRecords.has(`${record.check}/${record.run}`)), `evidence.records.${check}`,
      "affected checks must rerun for the current candidate with new run identifiers");
    }
    allowed.set(previous.candidate, { oldRecords, unaffected: new Set(impact.unaffectedChecks) });
  }
  return allowed;
}

/** Validate the retained index at R-GATE; this never grants publishing authority. */
export async function validateEvidence(index, { candidate, purpose, readReference, signal }) {
  requireEvidence(index && index.schemaVersion === 1, "evidence.schemaVersion", "expected schemaVersion 1");
  requireEvidence(index.candidate === candidate, "evidence.candidate", "stale candidate identity");
  requireEvidence(index.purpose === purpose, "evidence.purpose", "fixture and release records cannot be mixed");
  requireEvidence(index.checklistRevision === checklistRevision, "evidence.checklistRevision", "use the checklist revision shipped with this checker");
  requireEvidence(Array.isArray(index.records) && index.records.length > 0, "evidence.records");
  const kinds = new Set(index.records.map(record => record?.kind));
  requireEvidence(checklist.requiredKinds.every(kind => kinds.has(kind)), "evidence.requiredKinds",
    "complete the physical-device, desktop/Node and independent/application/tools review records");
  const categories = new Set(index.records.map(record => record?.category));
  requireEvidence(checklist.categories.every(category => categories.has(category)), "evidence.categories", "all A1–A13 categories are required");
  const carryForward = await validateCarryForward(index, candidate, purpose, readReference, signal);
  const records = new Map();
  for (const record of index.records) {
    signal?.throwIfAborted();
    requireEvidence(record && identifier(record.check) && identifier(record.run), "evidence.records", "each record needs a check and run identifier");
    const field = `evidence.records.${record.check}`;
    requireEvidence(record.status === "pass", field, "mandatory result is not pass; complete or rerun this check");
    if (record.candidate !== candidate) {
      const carry = carryForward.get(record.candidate);
      requireEvidence(carry?.unaffected.has(record.check) &&
        isDeepStrictEqual(carry.oldRecords.get(`${record.check}/${record.run}`), record),
      field, "stale evidence; rerun or retain an explicit reviewed impact record without changing the old report");
    }
    await validateRecord(record, purpose, readReference);
    const key = `${record.check}/${record.run}`;
    requireEvidence(!records.has(key), field, "duplicate check/run record");
    records.set(key, record);
  }
  requireEvidence(Array.isArray(index.clauses), "evidence.clauses");
  const covered = new Set();
  for (const mapping of index.clauses) {
    requireEvidence(mapping && requiredClauses.has(mapping.id) && !covered.has(mapping.id), "evidence.clauses", "unknown or duplicate normative clause");
    requireEvidence(records.has(`${mapping.check}/${mapping.run}`), "evidence.clauses", "clause maps to a missing check/run");
    covered.add(mapping.id);
  }
  requireEvidence(covered.size === requiredClauses.size, "evidence.clauses", "map every normative clause in the shipped checklist");
  for (const record of records.values()) {
    if (record.kind !== "application-review") continue;
    const field = `evidence.records.${record.check}`;
    requireEvidence(Array.isArray(record.review.coveredRecords), field,
      "application review must link the complete category, device and tools-review check runs");
    const reviewed = new Set(record.review.coveredRecords.map(ref => ref && `${ref.check}/${ref.run}`));
    requireEvidence(reviewed.size === record.review.coveredRecords.length &&
      [...reviewed].every(key => records.has(key)) &&
      [...records.keys()].every(key => key === `${record.check}/${record.run}` || reviewed.has(key)),
    field, "application review is incomplete or refers to stale check runs");
  }
  return { recordCount: records.size, clauseCount: covered.size };
}

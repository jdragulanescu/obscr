#!/usr/bin/env node
import { parseArgs, promisify } from "node:util";
import { execFile } from "node:child_process";
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGithubApi, resolveRequest, selectArtifact } from "../lib/release-github.js";
import { prepareNpm, publishNpm, validateReleaseRequest } from "../lib/npm-distribution.js";

const exec = promisify(execFile);
const controller = new AbortController();
const cancel = () => controller.abort();
process.on("SIGINT", cancel);
process.on("SIGTERM", cancel);
const safe = value => String(value).replace(/[^\x20-\x7e\n]/gu, char => `\\u{${char.codePointAt(0).toString(16)}}`);
let temporary, output, request, observedReceipt;
const save = (name, value) => writeFile(path.join(output, name), JSON.stringify(value, null, 2) + "\n", { flag: "wx" });

async function main() {
  const { values } = parseArgs({ options: {
    phase: { type: "string" }, output: { type: "string" }, help: { type: "boolean", short: "h" },
  }, strict: true, allowPositionals: false });
  if (values.help) {
    console.log("GitHub protected npm release\n--phase prepare|publish --output <new-directory>\nSelect retained candidate inputs through publish.yml. Local publication is refused.\nProduction approval is required; public fixtures cannot publish. Ctrl-C cancels.\nAn uncertain npm result needs inspection, not a retry.");
    return;
  }
  const env = process.env;
  if (!["prepare", "publish"].includes(values.phase) || !values.output || env.GITHUB_ACTIONS !== "true" ||
      env.GITHUB_REPOSITORY !== "jdragulanescu/obscr" || !env.GITHUB_EVENT_PATH || !env.GITHUB_TOKEN) {
    throw new Error("Use publish.yml with an intentional release request and a new output directory.");
  }
  const context = { repository: env.GITHUB_REPOSITORY, sourceRevision: env.GITHUB_SHA,
    runId: Number(env.GITHUB_RUN_ID), runAttempt: Number(env.GITHUB_RUN_ATTEMPT) };
  await mkdir(values.output);
  output = path.resolve(values.output);
  const api = createGithubApi(env.GITHUB_TOKEN, { signal: controller.signal });
  const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, "utf8"));
  request = validateReleaseRequest(await resolveRequest(env.GITHUB_EVENT_NAME, event, api));
  if (values.phase === "publish") {
    const approvedRequest = validateReleaseRequest(JSON.parse(env.RELEASE_REQUEST || "null"));
    if (JSON.stringify(request) !== JSON.stringify(approvedRequest)) {
      throw new Error("The request changed after approval. Start a new release request.");
    }
  }
  await save("request.json", request);
  process.stderr.write("Checking the retained candidate and evidence.\n");
  await selectArtifact(request, context, api);
  temporary = await mkdtemp(path.join(tmpdir(), "obscr-release-download-"));
  const archive = path.join(temporary, "artifact.zip");
  await api.download(request, archive);
  const bundle = path.join(temporary, "bundle");
  try {
    await exec("python3", [fileURLToPath(new URL("../.github/scripts/extract-candidate.py", import.meta.url)), archive, bundle],
      { signal: controller.signal, maxBuffer: 1024 * 1024 });
  } catch { throw new Error("Candidate archive extraction refused."); }
  const options = { manifestPath: path.join(bundle, "manifest.json"), request,
    sourceRevision: context.sourceRevision, signal: controller.signal };
  const checked = await prepareNpm(options);
  if (checked.purpose !== "release") throw new Error("Public fixtures cannot request production approval.");
  const summary = `Candidate SHA-256: ${request.candidate}\nEvidence-index SHA-256: ${request.evidenceIndex}\nArtifact: https://github.com/${context.repository}/actions/artifacts/${request.artifactId}\n`;
  await save("checked.json", checked);
  if (values.phase === "prepare") {
    if (!env.GITHUB_OUTPUT || !env.GITHUB_STEP_SUMMARY) throw new Error("Missing workflow output files.");
    await appendFile(env.GITHUB_OUTPUT, `request=${JSON.stringify(request)}\ncandidate=${request.candidate}\nevidence_index=${request.evidenceIndex}\n`);
    await appendFile(env.GITHUB_STEP_SUMMARY, `## Approval still required\n\n${summary}\nNo publication performed.\n`);
    console.log(summary + "Approval still required. No publication performed.");
    return;
  }
  // GitHub's Production environment grants authority; retain its observed reviewer,
  // rather than implementing another approval service or trusting a manifest assertion.
  const history = await api.reviews(context.runId);
  await save("github-approvals.json", history);
  const approvals = Array.isArray(history) ? history.filter(review => review.state === "approved" &&
    review.environments?.some(environment => environment.name === "Production")) : [];
  if (approvals.length !== 1 || !approvals[0].user?.login) throw new Error("Cannot identify the Production approval; publication refused.");
  const approval = { schemaVersion: 1, candidate: request.candidate, evidenceIndex: request.evidenceIndex,
    decision: "approved", reviewer: approvals[0].user.login, runId: context.runId, runAttempt: context.runAttempt };
  const receipt = await publishNpm({ ...options, approval, run: { id: context.runId, attempt: context.runAttempt },
    receiptPath: path.join(output, "npm-receipt.json") });
  observedReceipt = receipt;
  await appendFile(env.GITHUB_STEP_SUMMARY, `## npm: ${receipt.npm.status}\n\n${summary}\nOnly the checked archive was published. PWA publication is separate.\n`);
  console.log(`npm: ${receipt.npm.status}\n${summary}`);
}

try { await main(); }
catch (error) {
  const receipt = error.receipt || observedReceipt;
  const status = receipt?.npm?.status || "refused";
  let detail = "Check the workflow inputs and retained evidence.";
  if (error.field) detail = `Check ${safe(error.field)} and the retained evidence.`;
  else if (error.code === "RELEASE_REFUSED") detail = safe(error.message);
  if (output) {
    await save("release-result.json", { request: request || null, npm: status, reason: detail,
      receiptRetained: error.receiptRetained ?? Boolean(observedReceipt), cancelled: controller.signal.aborted }).catch(() => {});
  }
  process.stderr.write(`Release request refused or incomplete. npm: ${status}. ${detail}\n`);
  if (status !== "refused") process.stderr.write("Inspect npm before any new request; publication may already have occurred.\n");
  process.exitCode = controller.signal.aborted ? 130 : 1;
} finally {
  if (temporary) await rm(temporary, { recursive: true, force: true });
  process.removeListener("SIGINT", cancel);
  process.removeListener("SIGTERM", cancel);
}

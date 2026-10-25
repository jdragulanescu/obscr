#!/usr/bin/env node

import { parseArgs } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { buildCandidate, selectRequest } from "../lib/release-workflow.js";
import { validateCandidate } from "../lib/candidate-validation.js";

const controller = new AbortController();
const cancel = () => controller.abort();
process.on("SIGINT", cancel);
process.on("SIGTERM", cancel);
const safe = value => String(value).replace(/[^\x20-\x7e\n]/gu,
  character => `\\u{${character.codePointAt(0).toString(16)}}`);
const print = (stream, message) => stream.write(safe(message) + "\n");
process.stdout.on("error", cancel);
process.stderr.on("error", cancel);

async function main() {
  let values;
  try {
    ({ values } = parseArgs({ options: {
      source: { type: "string", default: process.cwd() }, output: { type: "string" },
      run: { type: "string" }, request: { type: "string" },
      event: { type: "string" }, "event-name": { type: "string" },
      help: { type: "boolean", short: "h" },
    }, strict: true, allowPositionals: false }));
  } catch { throw new Error("arguments"); }
  if (values.help) {
    print(process.stdout, [
      "Candidate checks - build retained npm/PWA files without publishing.",
      "Usage: npm run release:candidate -- --request check --output <new-directory> --run <id>",
      "--source <checkout> selects committed HEAD; uncommitted files are not built.",
      "--request check runs safe baseline checks. It does not approve a release.",
      "--request release intentionally requests release validation after the same checks.",
      "Incomplete evidence refuses the release request. Approval is still required after validation.",
      "Workflow input: --event <JSON-file> --event-name <GitHub-event>, instead of --request.",
      "Draft PR events skip all build work. Push events are refused.",
      "Output must not exist. Raw logs remain on failure; existing bundles are never overwritten.",
      "Ctrl-C cancels subprocesses (exit 130). No prompts, credentials or publication.",
      "Progress uses stderr. Only a completed check has a result on stdout.",
    ].join("\n"));
    return;
  }
  let request;
  if (values.event && values["event-name"] && !values.request) {
    request = selectRequest(values["event-name"], JSON.parse(await readFile(values.event, "utf8")));
  } else if (!values.event && !values["event-name"] && values.request) {
    request = selectRequest("workflow_dispatch", { inputs: { request: values.request } });
  } else throw new Error("arguments");
  if (request === "skip") {
    print(process.stderr, "Draft PR: no candidate checks or builds. No publication.");
    return;
  }
  if (!values.output || !values.run) throw new Error("arguments");
  print(process.stderr, `Retained stage detail: ${pathToFileURL(path.resolve(values.output, "stages.txt")).href}`);
  print(process.stderr, "Candidate checks - no publication credentials or publication.");
  const result = await buildCandidate({
    source: values.source, output: values.output, run: values.run,
    signal: controller.signal, onProgress: stage => print(process.stderr, `Stage: ${stage}`),
  });
  let refusal;
  try {
    await validateCandidate(result.manifestPath, { signal: controller.signal,
      onProgress: stage => print(process.stderr, stage) });
  } catch (error) {
    if (controller.signal.aborted || !error.field) throw error;
    refusal = `${error.message}\nComplete or correct the retained evidence before requesting approval.`;
    await writeFile(path.join(values.output, "release-refusal.txt"), safe(refusal) + "\n", { flag: "wx" });
    if (!error.field.startsWith("evidence.")) throw error;
    print(process.stderr, refusal);
  }
  if (request === "release" && refusal) throw new Error("release refused");
  controller.signal.throwIfAborted();
  print(process.stdout, [
    "Baseline checks complete. Approval still required.",
    ...(refusal ? ["Release evidence is incomplete. This is not a passing release candidate."] : []),
    "Candidate SHA-256:", result.candidate, "Evidence index SHA-256:", result.evidenceIndex,
    "Retained manifest and reports:", pathToFileURL(result.manifestPath).href,
    "No publication performed.",
  ].join("\n"));
}

function failureMessage(error) {
  if (error.code === "EEXIST") return "Output already exists. Select a new --output directory; existing evidence was not overwritten. No publication.";
  if (error.code === "ENOENT") return "Cannot find the source or output parent. Check --source and --output. No publication.";
  if (error.message === "arguments") return "Select --request check|release, --output <new-directory>, and --run <id>; see --help. No publication.";
  if (error.field || error.message.startsWith("Candidate stage ")) return `${error.message} No publication.`;
  return "Candidate request refused. Check arguments (--help) and retained stage logs. No publication.";
}

try { await main(); }
catch (error) {
  print(process.stderr, controller.signal.aborted
    ? "Cancelled. No complete result. Raw observations remain. No publication."
    : failureMessage(error));
  process.exitCode = controller.signal.aborted ? 130 : 1;
} finally {
  process.removeListener("SIGINT", cancel);
  process.removeListener("SIGTERM", cancel);
}

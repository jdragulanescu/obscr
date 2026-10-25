#!/usr/bin/env node

import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import path from "node:path";

const controller = new AbortController();
const cancel = () => controller.abort();
process.on("SIGINT", cancel);

// Display only printable ASCII. Control codes, bidi overrides and non-ASCII
// filenames remain visible as escapes, never terminal instructions.
const safe = value => String(value).replace(/[^\x20-\x7e]/gu,
  character => `\\u{${character.codePointAt(0).toString(16)}}`);
const lines = (value, stream) => {
  const width = Math.max(20, Math.min(stream.columns || 80, 120) - 2);
  return String(value).split("\n").map(line => {
    const clean = safe(line);
    if (!stream.isTTY || clean.startsWith("file://")) return clean;
    const result = [];
    let current = "";
    for (const word of clean.split(" ")) {
      if (current && current.length + word.length + 1 > width) {
        result.push(current);
        current = "";
      }
      current += (current ? " " : "") + word;
    }
    result.push(current);
    return result.join("\n");
  }).join("\n") + "\n";
};

async function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: { manifest: { type: "string" }, help: { type: "boolean", short: "h" } },
      allowPositionals: false, strict: true,
    }));
  } catch {
    throw new Error("Use --manifest <path> or --help; unknown flags and missing flag values are refused.");
  }
  if (values.help) {
    process.stdout.write(lines([
      "Release check - validate a candidate and its retained evidence.",
      "Usage: npm run release:check -- --manifest <path>",
      "Flags: --manifest <path> selects the bundle manifest; --help (-h) shows help.",
      "Keys: Ctrl-C cancels validation (exit 130). No prompts or input waits.",
      "This read-only command does not publish, change files or grant approval.",
      "Exit 0: validation complete; approval still required.",
      "Exit 1: refused or incomplete. Fix the named field/check, then run again.",
      "Progress and refusals use stderr; only a completed result uses stdout.",
      "Public fixtures prove validator behavior only; they cannot authorize production.",
      "Paths are displayed with control/non-ASCII characters escaped.",
      "Contract and bundle instructions: docs/release-check.md",
    ].join("\n"), process.stdout));
    return;
  }
  if (!values.manifest) throw new Error("Select a manifest with --manifest <path>; use --help for instructions.");
  process.stderr.write(lines(`Release check - read-only candidate validation\nManifest: ${values.manifest}`, process.stderr));
  const { validateCandidate } = await import("../lib/candidate-validation.js");
  const result = await validateCandidate(values.manifest, {
    signal: controller.signal,
    onProgress: stage => process.stderr.write(lines(stage, process.stderr)),
  });
  controller.signal.throwIfAborted();
  const detail = pathToFileURL(path.resolve(values.manifest)).href;
  process.stdout.write(lines([
    "Validation complete. Approval still required.",
    ...(result.purpose === "public-fixture" ? ["PUBLIC FIXTURE - not authorization for production."] : []),
    "Candidate SHA-256:", result.candidate,
    "Evidence index SHA-256:", result.evidenceIndex,
    `${result.recordCount} records; ${result.clauseCount} normative clauses checked.`,
    "Retained detail (manifest links the index and reports):", detail,
    "No files changed. No publication performed.",
  ].join("\n"), process.stdout));
}

// Broken result pipes are failures, not an unhandled stack trace or a retry.
process.stdout.on("error", () => { controller.abort(); process.exitCode = 1; });
process.stderr.on("error", () => { controller.abort(); process.exitCode = 1; });
try {
  await main();
} catch (error) {
  if (controller.signal.aborted) {
    process.stderr.write("Cancelled. No result published. No files changed.\n");
    process.exitCode = 130;
  } else {
    const message = error?.field || error?.message?.startsWith("Select a manifest") ||
      error?.message?.startsWith("Use --manifest")
      ? error.message : "Cannot validate this bundle. Check input files and read permissions; see --help.";
    process.stderr.write(lines(`Release check refused: ${message}\nCorrect the named input or complete its evidence, then run again.`, process.stderr));
    process.exitCode = 1;
  }
} finally {
  process.removeListener("SIGINT", cancel);
}

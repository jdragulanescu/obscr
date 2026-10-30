import { admitPNG } from "../../../lib/png.js";
import { comparePNGs } from "../../../lib/png-diff.js";
import { readImageBytes } from "./readImageBytes.js";
const operations = new Set(["admit", "diff"]);
let busy = false;


async function run(operation, args, progress) {
  progress("Checking PNG input…");
  if (operation === "diff") {
    const original = await readImageBytes(args.file);
    const comparison = await readImageBytes(args.secondFile);
    progress("Creating visual comparison…");
    const { bytes, ...statistics } = comparePNGs(original, comparison);
    return { ok: true, ...statistics, diffBlob: new Blob([bytes], { type: "image/png" }) };
  }
  const png = admitPNG(await readImageBytes(args.file));
  return { ok: true, width: png.width, height: png.height };
}

self.onmessage = async ({ data }) => {
  const { id, operation, args } = data || {};
  if (busy || !Number.isSafeInteger(id) || id < 1 || !operations.has(operation) || !args || typeof args !== "object") {
    self.postMessage({ id, result: { ok: false, code: busy ? "BUSY" : "INPUT_INVALID", error: busy ? "Another image operation is active." : "Invalid image operation request." } });
    return;
  }
  busy = true;
  try {
    const result = await run(operation, args, (progress) => self.postMessage({ id, progress }));
    self.postMessage({ id, result });
  } catch (error) {
    const publicError = typeof error.code === "string" && /^(PNG_|INPUT_|READ_FAILED|DIMENSIONS)/.test(error.code);
    self.postMessage({ id, result: { ok: false, code: publicError ? error.code : "WORKER_FAILED", error: publicError ? error.message : "Image processing failed. Try again or choose another PNG." } });
  } finally {
    busy = false;
  }
};

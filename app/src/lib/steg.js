import { acquireImageOperation, releaseImageOperation } from "../../../lib/image-operation.js";

// The worker owns input bytes, admitted samples and all expensive image work.
// Only small results and completed output blobs cross back to this tab.
let active = null;
let revision = 0;
const cancelled = () => ({ ok: false, code: "CANCELLED", error: "Operation cancelled. Your image and message are kept." });

function run(operation, args, { signal, onProgress } = {}) {
  if (signal?.aborted) return Promise.resolve(cancelled());
  if (active) return Promise.resolve({ ok: false, code: "BUSY", error: "Another image operation is active. Cancel it or wait for it to finish." });
  const id = ++revision;
  const lease = {};
  if (!acquireImageOperation(lease)) return Promise.resolve({ ok: false, code: "BUSY", error: "Another image operation is active. Cancel it or wait for it to finish." });
  return new Promise((resolve) => {
    let worker;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", abort);
      worker?.terminate();
      if (active?.id === id) active = null;
      releaseImageOperation(lease);
      resolve(result);
    };
    const abort = () => finish(cancelled());
    const failed = () => finish({ ok: false, code: "WORKER_FAILED", error: "Image processing stopped. Select the image again and retry." });
    try {
      worker = new Worker(new URL("./png-worker.js", import.meta.url), { type: "module" });
      active = { id };
      signal?.addEventListener("abort", abort, { once: true });
      worker.onmessage = ({ data }) => {
        if (settled || active?.id !== id || data?.id !== id) return;
        if (typeof data.progress === "string") onProgress?.(data.progress);
        if (data.result) finish(data.result);
      };
      worker.onerror = (event) => {
        event.preventDefault();
        failed();
      };
      worker.onmessageerror = failed;
      worker.postMessage({ id, operation, args });
    } catch {
      failed();
    }
  });
}

export function admitImage(file, options = {}) {
  return run("admit", { file }, options);
}

export function embedMessage(file, message, password, options = {}) {
  const { compress = false, obfuscate = true } = options;
  return run("embed", { file, message, password, compress, obfuscate }, options);
}

export function extractMessage(file, password, options = {}) {
  return run("extract", { file, password }, options);
}

export function estimateCapacity(file, message, compress = false, options = {}) {
  return run("capacity", { file, message, compress }, options);
}

export async function generateImageDiff(originalFile, encodedFile, options = {}) {
  const result = await run("diff", { file: originalFile, secondFile: encodedFile }, options);
  if (!result.ok) return result;
  if (options.signal?.aborted) return cancelled();
  const urls = [];
  try {
    for (const blob of [originalFile, encodedFile, result.diffBlob]) urls.push(URL.createObjectURL(blob));
    return {
      ok: true, original: urls[0], encoded: urls[1], diff: urls[2],
      averageDifference: result.averageDifference,
      changedPixels: result.changedPixels, totalPixels: result.totalPixels,
    };
  } catch {
    urls.forEach((url) => URL.revokeObjectURL(url));
    return { ok: false, code: "PREVIEW_FAILED", error: "Could not show the visual comparison. Try again." };
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  let a;
  try {
    a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
  } finally {
    a?.remove();
    URL.revokeObjectURL(url);
  }
}

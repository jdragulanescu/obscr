import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Worker } from "node:worker_threads";
import { MAX_SOURCE_BYTES } from "./png.js";
import { calculateImageCapacity } from "./steg-core.js";

let activeOperation = null;
let nextRequestId = 0;
const READ_CHUNK_BYTES = 64 * 1024;
const error = (code, message) => Object.assign(new Error(message), { code });
const cancelled = () => error("CANCELLED", "Operation cancelled. No result was saved.");

function checkCancelled(signal) {
  if (signal?.aborted) throw cancelled();
}

// Keep the source size fixed after stat: a growing file cannot increase this allocation.
async function readSource(imagePath, signal) {
  let handle;
  try {
    handle = await fs.promises.open(imagePath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
    checkCancelled(signal);
    const before = await handle.stat();
    if (!before.isFile()) throw error("INPUT_READ", "Choose a readable PNG file, not a directory or device.");
    if (before.size > MAX_SOURCE_BYTES) throw error("PNG_LIMIT", "PNG source exceeds 16 MiB. Choose a smaller PNG.");
    checkCancelled(signal);
    // Unlike a pooled Buffer, this has one exact transferable backing allocation.
    const bytes = Buffer.allocUnsafeSlow(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      checkCancelled(signal);
      const { bytesRead } = await handle.read(bytes, offset, Math.min(READ_CHUNK_BYTES, bytes.length - offset), offset);
      checkCancelled(signal);
      if (bytesRead === 0) throw error("INPUT_CHANGED", "The image changed while reading. Select it again.");
      offset += bytesRead;
    }
    const probe = new Uint8Array(1);
    const { bytesRead } = await handle.read(probe, 0, 1, offset);
    const after = await handle.stat();
    checkCancelled(signal);
    if (after.size > MAX_SOURCE_BYTES) throw error("PNG_LIMIT", "PNG source exceeds 16 MiB. Choose a smaller PNG.");
    if (bytesRead !== 0 || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) {
      throw error("INPUT_CHANGED", "The image changed while reading. Select it again.");
    }
    return bytes;
  } catch (failure) {
    checkCancelled(signal);
    if (["PNG_LIMIT", "INPUT_CHANGED", "INPUT_READ"].includes(failure.code)) throw failure;
    throw error("INPUT_READ", failure.code === "ENOENT"
      ? "Image file not found. Check the input path."
      : "Could not read the image. Check the path and file permissions.");
  } finally {
    if (handle) {
      try { await handle.close(); }
      catch {
        checkCancelled(signal);
        throw error("INPUT_READ", "Could not finish reading the image. Check file access and try again.");
      }
    }
  }
}

function notify(onProgress, stage) {
  // A presentation callback must not leave a worker or an output file behind.
  try { onProgress?.(stage); } catch { /* Presentation does not control the operation. */ }
}

function runWorker(request, bytes, signal, onProgress) {
  return new Promise((resolve, reject) => {
    let worker;
    let settled = false;
    const finish = async (failure, result) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", abort);
      if (worker) await worker.terminate();
      if (signal?.aborted) reject(cancelled());
      else if (failure) reject(failure);
      else resolve(result);
    };
    const abort = () => { void finish(cancelled()); };
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    try {
      worker = new Worker(new URL("./steg-worker.js", import.meta.url));
      worker.on("message", (reply) => {
        if (settled || reply?.id !== request.id) return;
        if (reply.type === "progress") {
          if (["admitting", "processing"].includes(reply.stage)) notify(onProgress, reply.stage);
          return;
        }
        if (reply.type !== "result" || typeof reply.result?.success !== "boolean") {
          void finish(error("WORKER_FAILED", "Image processing stopped. Try again."));
          return;
        }
        void finish(null, reply.result);
      });
      worker.on("error", () => { void finish(error("WORKER_FAILED", "Image processing stopped. Try again.")); });
      worker.on("exit", () => {
        if (!settled) void finish(error("WORKER_FAILED", "Image processing stopped before completion. Try again."));
      });
      worker.postMessage({ ...request, bytes }, [bytes.buffer]);
    } catch {
      void finish(error("WORKER_FAILED", "Could not start image processing. Try again."));
    }
  });
}

async function publish(outputPath, bytes, signal, onProgress) {
  let temporaryFile;
  let created = false;
  let committed = false;
  try {
    notify(onProgress, "saving");
    checkCancelled(signal);
    const target = path.resolve(outputPath);
    temporaryFile = path.join(path.dirname(target), `.obscr-${randomUUID()}`);
    const handle = await fs.promises.open(temporaryFile, "wx", 0o600);
    created = true;
    try {
      checkCancelled(signal);
      await handle.writeFile(bytes, { signal });
    } finally {
      await handle.close();
    }
    checkCancelled(signal);
    // The final check and atomic commit share one turn: cancellation cannot publish
    // half a file or report failure after a successful asynchronous rename.
    fs.renameSync(temporaryFile, target);
    committed = true;
  } catch (failure) {
    checkCancelled(signal);
    if (failure.code === "CANCELLED") throw failure;
    throw error("OUTPUT_WRITE", "Could not save the result. Check the output directory and permissions.");
  } finally {
    if (created && !committed) {
      try { await fs.promises.unlink(temporaryFile); }
      catch (failure) {
        if (failure.code !== "ENOENT") throw error("OUTPUT_WRITE", "Could not remove an incomplete temporary result. Check output directory permissions.");
      }
    }
  }
}

async function operate(action, imagePath, fields, outputPath, options = {}) {
  if (activeOperation) return { success: false, code: "BUSY", error: "Another image operation is running. Cancel it or wait for it to finish." };
  const operation = {};
  activeOperation = operation;
  try {
    const { signal, onProgress } = options;
    if (typeof imagePath !== "string" || !imagePath || (outputPath !== undefined && (typeof outputPath !== "string" || !outputPath))) {
      throw error("REQUEST_INVALID", "Choose an input file and a valid output path.");
    }
    checkCancelled(signal);
    notify(onProgress, "reading");
    checkCancelled(signal);
    const bytes = await readSource(imagePath, signal);
    checkCancelled(signal);
    const result = await runWorker({ id: ++nextRequestId, action, ...fields }, bytes, signal, onProgress);
    checkCancelled(signal);
    if (!result.success) return result;
    if (outputPath !== undefined) {
      await publish(outputPath, result.bytes ?? result.data, signal, onProgress);
      return { success: true, outputPath, ...(result.capacity ? { capacity: result.capacity } : {}) };
    }
    return result;
  } catch (failure) {
    return { success: false, code: failure.code || "OPERATION_FAILED", error: failure.code ? failure.message : "Image processing failed. Check the inputs and try again." };
  } finally {
    if (activeOperation === operation) activeOperation = null;
  }
}

/** Extract the existing carrier data. Cancellation options are operation-local. */
const extractMessageFromImage = (imagePath, encryptionKey, options = {}) =>
  operate("extract", imagePath, { key: encryptionKey }, undefined, options);

/** Encode existing carrier data and atomically publish only a complete result. */
const encodeMessageToImage = (imagePath, message, encryptionKey, outputPath = "encoded.png", obfuscate = true, options = {}) =>
  operate("encode", imagePath, { message, key: encryptionKey, obfuscate }, outputPath, options);

/** CLI encryption, PNG admission and carrier work all run in the same worker. */
const encryptMessageToImage = (imagePath, message, password, outputPath = "encoded.png", options = {}) =>
  operate("encrypt", imagePath, { message, password, compress: options.compress ?? false, obfuscate: options.obfuscate ?? true }, outputPath, options);

/** Return authenticated text, or atomically save it when outputPath is supplied. */
const decryptMessageFromImage = (imagePath, password, options = {}) =>
  operate("decrypt", imagePath, { password }, options.outputPath, options);

export {
  extractMessageFromImage,
  encodeMessageToImage,
  encryptMessageToImage,
  decryptMessageFromImage,
  calculateImageCapacity,
};

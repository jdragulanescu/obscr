import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MAX_SOURCE_BYTES } from "./png.js";
import { prepareEncode, encode, decode, discard } from "./protected-node.js";
import { acquireImageOperation, releaseImageOperation } from "./image-operation.js";

let activeOperation = null;
let currentPreparation = null;
let metadataNotice;
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


async function publish(outputPath, bytes, signal, onProgress) {
  const lease = {};
  if (!acquireImageOperation(lease)) throw error("BUSY", "Image resources are in use. Try saving again after active work finishes.");
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
    releaseImageOperation(lease);
    if (created && !committed) {
      try { await fs.promises.unlink(temporaryFile); }
      catch (failure) {
        if (failure.code !== "ENOENT") throw error("OUTPUT_WRITE", "Could not remove an incomplete temporary result. Check output directory permissions.");
      }
    }
  }
}

const busy = () => ({ ok: false, code: "BUSY", error: "Another image operation is running. Cancel it or wait for it to finish." });

async function releasePreparation() {
  const preparation = currentPreparation;
  currentPreparation = null;
  metadataNotice = undefined;
  if (preparation) await discard(preparation);
}

async function operate(run, control = {}) {
  if (activeOperation) return busy();
  const operation = {};
  activeOperation = operation;
  try {
    checkCancelled(control.signal);
    return await run(control);
  } catch (failure) {
    await releasePreparation();
    return { ok: false, code: failure.code || "OPERATION_FAILED", error: failure.code ? failure.message : "Image processing failed. Check the inputs and try again." };
  } finally {
    activeOperation = null;
  }
}

async function inputBytes(imagePath, { signal, onProgress }) {
  if (typeof imagePath !== "string" || !imagePath) throw error("INPUT_INVALID", "Choose a readable PNG input path.");
  const lease = {};
  if (!acquireImageOperation(lease)) throw error("BUSY", "Image resources are in use. Finish or discard the current operation.");
  try {
    notify(onProgress, "reading");
    checkCancelled(signal);
    return await readSource(imagePath, signal);
  } finally {
    releaseImageOperation(lease);
  }
}

function validateOutput(outputPath) {
  if (typeof outputPath !== "string" || !outputPath) throw error("INPUT_INVALID", "Choose a valid output path.");
}

/** Prepare once from bounded source bytes; retain only the opaque worker handle. */
export function prepareImage({ imagePath, message, compress = false }, control) {
  return operate(async options => {
    await releasePreparation();
    const pngBytes = await inputBytes(imagePath, options);
    checkCancelled(options.signal);
    const result = await prepareEncode({ pngBytes, message, compress }, options);
    if (result.ok) {
      currentPreparation = result.preparation;
      metadataNotice = result.metadataNotice;
    }
    checkCancelled(options.signal);
    return result;
  }, control);
}

/** Consume the preparation and atomically publish only complete protected PNG bytes. */
export function encodeImage({ preparation, password, outputPath = "encoded.png" }, control) {
  return operate(async options => {
    try {
      validateOutput(outputPath);
      const result = await encode({ preparation, password }, options);
      password = null;
      checkCancelled(options.signal);
      if (!result.ok) return result;
      await publish(outputPath, result.pngBytes, options.signal, options.onProgress);
      return { ok: true, outputPath, metadataNotice };
    } finally {
      password = null;
      await releasePreparation();
    }
  }, control);
}

/** Recover authenticated text; optionally publish its exact UTF-8 bytes atomically. */
export function decodeImage({ imagePath, password, outputPath }, control) {
  return operate(async options => {
    try {
      await releasePreparation();
      if (outputPath !== undefined) validateOutput(outputPath);
      const pngBytes = await inputBytes(imagePath, options);
      checkCancelled(options.signal);
      const result = await decode({ pngBytes, password }, options);
      password = null;
      checkCancelled(options.signal);
      if (!result.ok || outputPath === undefined) return result;
      await publish(outputPath, result.message, options.signal, options.onProgress);
      return { ok: true, outputPath };
    } finally {
      password = null;
    }
  }, control);
}

/** Release an unused preparation, including after a refused guided action. */
export async function discardPreparation(preparation) {
  if (activeOperation) return busy();
  if (currentPreparation === preparation) {
    currentPreparation = null;
    metadataNotice = undefined;
  }
  return discard(preparation);
}

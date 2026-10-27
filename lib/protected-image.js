import { admitPNG, MAX_SOURCE_BYTES } from "./png.js";
import deflate from "pako/lib/deflate.js";
import { recover } from "./protected-recovery.js";
import { encodePrepared } from "./protected-encoding.js";

const MAX_TEXT_BYTES = 1048576;
const METADATA_NOTICE = "Personal metadata is removed on export; only supported rendering metadata is kept. This does not make the image undetectable.";
const fail = (code, message) => Object.assign(new Error(message), { code });

function utf8CodeUnitWidth(c) {
  if (c < 128) return 1;
  if (c < 2048) return 2;
  return 3;
}

function textBytes(message, maximum = MAX_TEXT_BYTES) {
  if (typeof message !== "string") throw fail("INPUT_INVALID", "Enter valid Unicode text.");
  let length = 0;
  for (let i = 0; i < message.length; i++) {
    const c = message.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = message.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw fail("INPUT_INVALID", "Text contains an unpaired surrogate.");
      length += 4;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      throw fail("INPUT_INVALID", "Text contains an unpaired surrogate.");
    } else {
      length += utf8CodeUnitWidth(c);
    }
    if (length > maximum) throw fail("INPUT_LIMIT", `Text must be at most ${maximum} UTF-8 bytes.`);
  }
  return new TextEncoder().encode(message);
}

function compressedBytes(original, createCompressor) {
  const bound = Math.min(512, original.length);
  const output = new Uint8Array(bound);
  const tooLarge = {};
  let length = 0;
  try {
    const compressor = createCompressor({ gzip: true, level: 6, chunkSize: bound + 1, header: { time: 0, os: 255 } });
    compressor.onData = (chunk) => {
      if (length + chunk.length > bound) throw tooLarge;
      output.set(chunk, length);
      length += chunk.length;
    };
    if (!compressor.push(original, true) || compressor.err) throw new Error("compression");
    return length < original.length ? output.subarray(0, length) : null;
  } catch (error) {
    if (error === tooLarge) return null;
    throw fail("COMPRESSION_FAILED", "Text compression is unavailable or failed. Try again or turn compression off.");
  }
}

function pixelScore(data, width, height, x, y, p) {
  let score = 0;
  const degree = (x > 0) + (x + 1 < width) + (y > 0) + (y + 1 < height);
  for (let c = 0; c < 3; c++) {
    let neighbors = 0;
    if (x > 0) neighbors += data[(p - 1) * 4 + c] & 254;
    if (x + 1 < width) neighbors += data[(p + 1) * 4 + c] & 254;
    if (y > 0) neighbors += data[(p - width) * 4 + c] & 254;
    if (y + 1 < height) neighbors += data[(p + width) * 4 + c] & 254;
    score += Math.abs(degree * (data[p * 4 + c] & 254) - neighbors);
  }
  return score;
}

function scorePixels({ width, height, data }, scores, histogram) {
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x;
    const score = pixelScore(data, width, height, x, y, p);
    scores[p] = score;
    histogram[score]++;
  }
}

function selectionThreshold(histogram, selected) {
  let threshold = 3048;
  let ties = selected;
  while (threshold > 0 && ties > histogram[threshold]) ties -= histogram[threshold--];
  return { threshold, ties };
}

function advanceSaltPosition(salt, pixels, q) {
  while (salt < 128 && Math.floor(salt * 3 * pixels / 128) < q) salt++;
  return salt;
}

function canonicalPositions(scores, selected, threshold, ties) {
  const pixels = scores.length;
  const eligible = new Uint32Array(selected * 3);
  let count = 0;
  let salt = 0;
  for (let p = 0; p < pixels; p++) {
    if (scores[p] === 0 || scores[p] < threshold) continue;
    if (scores[p] === threshold && ties-- <= 0) continue;
    for (let c = 0; c < 3; c++) {
      const q = 3 * p + c;
      salt = advanceSaltPosition(salt, pixels, q);
      if (salt < 128 && Math.floor(salt * 3 * pixels / 128) === q) continue;
      eligible[count++] = q;
    }
  }
  return eligible.subarray(0, count);
}

// Keep the full canonical domain. The budget caps work, not eligible positions.
function eligiblePositions(image) {
  const pixels = image.width * image.height;
  const scores = new Uint16Array(pixels);
  const histogram = new Uint32Array(3049);
  scorePixels(image, scores, histogram);
  const selected = Math.min(Math.floor(pixels / 4), pixels - histogram[0]);
  const { threshold, ties } = selectionThreshold(histogram, selected);
  return canonicalPositions(scores, selected, threshold, ties);
}

function capacity(eligibleCount) {
  const budget = Math.min(eligibleCount, 262144);
  let maximum = -1;
  for (let stored = 0; stored <= 512; stored++) {
    const body = stored + 16;
    const repaired = body + 16 * Math.ceil(body / 239);
    const groups = 128 + Math.ceil(8 * repaired / 3);
    if (3 * groups > Math.floor(budget / 50) || 7 * groups > budget) break;
    maximum = stored;
  }
  return { maxStoredBytes: Math.max(0, maximum), hasFrameCapacity: maximum >= 0 };
}

function validateRequest(id, requestedGeneration, generation) {
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(requestedGeneration) || requestedGeneration < 1 ||
      (generation !== null && generation !== requestedGeneration)) {
    throw fail("INPUT_INVALID", "Invalid protected-image request.");
  }
}

function validatePreparationInput(pngBytes, compress) {
  if (!(pngBytes instanceof Uint8Array) || !(pngBytes.buffer instanceof ArrayBuffer) ||
      pngBytes.byteOffset !== 0 || pngBytes.byteLength !== pngBytes.buffer.byteLength || typeof compress !== "boolean") {
    throw fail("INPUT_INVALID", "Use owned PNG bytes and valid preparation options.");
  }
  if (pngBytes.byteLength > MAX_SOURCE_BYTES) throw fail("PNG_LIMIT", "PNG input must be at most 16 MiB.");
}

function preparationFailure(error) {
  const allowed = ["PNG_INVALID", "PNG_UNSUPPORTED", "PNG_LIMIT", "INPUT_INVALID", "INPUT_LIMIT", "COMPRESSION_FAILED", "CAPACITY", "PREPARATION_INVALID"];
  return allowed.includes(error?.code)
    ? { ok: false, code: error.code, error: error.message }
    : { ok: false, code: "RESOURCE_FAILED", error: "This runtime could not prepare the image. Try a supported browser or the local CLI." };
}

async function decodeRequest(request, nativeCrypto, repairCodeword, progress) {
  const allowed = ["action", "id", "generation", "pngBytes", "password"];
  if (Object.keys(request).some(key => !allowed.includes(key))) {
    throw fail("INPUT_INVALID", "Invalid protected-image recovery options.");
  }
  validatePreparationInput(request.pngBytes, false);
  if (typeof request.password !== "string" || request.password.length === 0) {
    throw fail("INPUT_INVALID", "Enter a nonempty Unicode password.");
  }
  let password;
  try {
    password = textBytes(request.password, 1024);
    request.password = null;
    progress("checking inputs");
    const image = admitPNG(request.pngBytes);
    const eligible = eligiblePositions(image);
    const limits = capacity(eligible.length);
    if (!limits.hasFrameCapacity) throw fail("CAPACITY", "This image has no protected-message frame capacity.");
    return await recover(image, eligible, limits.maxStoredBytes, password, nativeCrypto, progress, repairCodeword);
  } finally {
    request.password = null;
    password?.fill(0);
  }
}

async function encodeRequest(request, prepared, nativeCrypto, progress, serialize) {
  let password;
  try {
    const allowed = ["action", "id", "generation", "preparation", "password"];
    if (Object.keys(request).some(key => !allowed.includes(key))) {
      throw fail("INPUT_INVALID", "Invalid protected-image encoding options.");
    }
    if (!prepared.summary.fits) {
      throw fail("CAPACITY", "The prepared text does not fit this image. Choose a detailed PNG or shorter text.");
    }
    if (typeof request.password !== "string" || request.password.length === 0) {
      throw fail("INPUT_INVALID", "Enter a nonempty Unicode password.");
    }
    password = textBytes(request.password, 1024);
    request.password = null;
    progress("checking inputs");
    return await encodePrepared(prepared, password, nativeCrypto, progress, serialize);
  } finally {
    request.password = null;
    password?.fill(0);
    prepared.bytes.fill(0);
  }
}

/** Private worker owner. Platform entry points supply transport, not format policy. */
export function createProtectedImage({ createCompressor = options => new deflate.Deflate(options), nativeCrypto, repairCodeword, serialize } = {}) {
  let prepared = null;
  let generation = null;
  let revision = 0;
  let busy = false;
  return async function execute(request, progress = () => {}) {
    const { action, id, generation: requestedGeneration } = request || {};
    if (busy) return { ok: false, code: "BUSY", error: "Another image operation is active." };
    busy = true;
    try {
      validateRequest(id, requestedGeneration, generation);
      generation = requestedGeneration;
      if (action === "discard") {
        const handle = request.preparation;
        const matches = prepared !== null && handle?.generation === generation && handle?.revision === revision;
        if (matches) prepared = null;
        return { ok: true, discarded: matches };
      }
      if (action === "encode") {
        const handle = request.preparation;
        if (!prepared || handle?.generation !== generation || handle?.revision !== revision ||
            Object.keys(handle).some(key => key !== "generation" && key !== "revision")) {
          throw fail("PREPARATION_INVALID", "Prepare this image and text again before encoding.");
        }
        const consumed = prepared;
        prepared = null;
        return await encodeRequest(request, consumed, nativeCrypto, progress, serialize);
      }
      if (action === "decode") {
        prepared = null;
        revision++;
        return await decodeRequest(request, nativeCrypto, repairCodeword, progress);
      }
      if (action !== "prepareEncode") throw fail("INPUT_INVALID", "Invalid protected-image operation.");
      prepared = null;
      revision++;
      const { pngBytes, message, compress } = request;
      validatePreparationInput(pngBytes, compress);
      progress("checking inputs");
      const original = textBytes(message);
      const image = admitPNG(pngBytes);
      progress("preparing text/capacity");
      const eligible = eligiblePositions(image);
      const limits = capacity(eligible.length);
      const compressed = compress ? compressedBytes(original, createCompressor) : null;
      if (compress && !compressed && (!limits.hasFrameCapacity || original.length > limits.maxStoredBytes)) {
        throw fail("CAPACITY", "Neither compressed nor raw text fits. Choose a detailed PNG or shorter text.");
      }
      const stored = compressed || original;
      const summary = { originalBytes: original.length, storedBytes: stored.length, compressionUsed: compressed !== null,
        ...limits, metadataNotice: METADATA_NOTICE };
      summary.fits = summary.hasFrameCapacity && summary.storedBytes <= summary.maxStoredBytes;
      prepared = { image, eligible, bytes: stored, summary };
      return { ok: true, preparation: { generation, revision }, ...summary };
    } catch (error) {
      prepared = null;
      return preparationFailure(error);
    } finally {
      if (action === "decode" || action === "encode") request.password = null;
      busy = false;
    }
  };
}

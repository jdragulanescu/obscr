import { admitPNG, serializePNG, MAX_SOURCE_BYTES } from "../../../lib/png.js";
import { encrypt, decrypt } from "./webCrypto.js";
import {
  prepare_write_data, prepare_read_data, get_bits_lsb, write_lsb,
  calculateImageCapacity, str_to_bits, bits_to_str,
} from "../../../lib/steg-core.js";

const SECRET_KEY = "S3cReTK3Y";
const operations = new Set(["admit", "capacity", "embed", "extract", "diff"]);
const failure = (code, message) => Object.assign(new Error(message), { code });
let busy = false;

async function readImage(file) {
  if (!(file instanceof Blob)) throw failure("INPUT_INVALID", "Select a supported PNG file.");
  if (file.size > MAX_SOURCE_BYTES) throw failure("PNG_LIMIT", "PNG input must be at most 16 MiB. Choose a smaller PNG.");
  let bytes;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw failure("READ_FAILED", "Could not read the image. Select it again.");
  }
  return admitPNG(bytes);
}

function validateText(value, label, allowEmpty = false) {
  if (typeof value !== "string" || (!allowEmpty && !value.length)) {
    throw failure("INPUT_INVALID", `Enter ${label}.`);
  }
  // Check before encoding or allocating carrier bit arrays.
  if (value.length > 1048576 || new TextEncoder().encode(value).length > 1048576) {
    throw failure("INPUT_LIMIT", `${label} must be at most 1 MiB of UTF-8 text.`);
  }
}

function compare(original, encoded) {
  const { width, height, data } = original;
  if (width !== encoded.width || height !== encoded.height) {
    throw failure("DIMENSIONS", "Images must have matching dimensions. Select another PNG.");
  }
  let totalDiff = 0;
  const changedPixels = [];
  for (let i = 0; i < data.length; i += 4) {
    const diff = Math.abs(data[i] - encoded.data[i]) +
      Math.abs(data[i + 1] - encoded.data[i + 1]) +
      Math.abs(data[i + 2] - encoded.data[i + 2]);
    totalDiff += diff;
    if (diff) changedPixels.push(i / 4);
  }
  if (changedPixels.length / (width * height) > 0.1) {
    for (let i = 0; i < data.length; i += 4) {
      const diff = Math.abs(data[i] - encoded.data[i]) +
        Math.abs(data[i + 1] - encoded.data[i + 1]) +
        Math.abs(data[i + 2] - encoded.data[i + 2]);
      const amplified = Math.min(255, diff * 50);
      data[i] = Math.round(amplified * 0.3);
      data[i + 1] = amplified;
      data[i + 2] = Math.round(amplified * 0.4);
    }
  } else {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 10;
      data[i + 1] = 14;
      data[i + 2] = 15;
    }
    const markerSize = Math.max(1, Math.floor(Math.max(width, height) / 800));
    for (const position of changedPixels) {
      const x = position % width;
      const y = Math.floor(position / width);
      for (let dy = -markerSize; dy <= markerSize; dy++) {
        for (let dx = -markerSize; dx <= markerSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            data[i] = 0;
            data[i + 1] = 255;
            data[i + 2] = 0;
          }
        }
      }
    }
  }
  return {
    ok: true,
    diffBlob: new Blob([serializePNG(original)], { type: "image/png" }),
    averageDifference: (totalDiff / (width * height * 3)).toFixed(4),
  };
}

async function run(operation, args, progress) {
  progress("Checking PNG input…");
  const png = await readImage(args.file);
  if (operation === "admit") return { ok: true, width: png.width, height: png.height };
  if (operation === "diff") {
    const second = await readImage(args.secondFile);
    progress("Creating visual comparison…");
    return compare(png, second);
  }
  const totalBits = calculateImageCapacity(png);
  if (operation === "extract") {
    validateText(args.password, "a password");
    progress("Recovering message…");
    try {
      const bits = prepare_read_data(get_bits_lsb(png), args.password + SECRET_KEY);
      const message = await decrypt(bits_to_str(bits, 1), args.password);
      return { ok: true, message };
    } catch {
      throw failure("RECOVERY_FAILED", "Could not recover an authenticated message. The password may be wrong, or the image may be damaged or changed.");
    }
  }
  validateText(args.message, "a message", operation === "capacity");
  if (typeof args.compress !== "boolean" || (operation === "embed" && typeof args.obfuscate !== "boolean")) {
    throw failure("INPUT_INVALID", "Invalid image operation options.");
  }
  if (operation === "embed") validateText(args.password, "a password");
  progress(operation === "capacity" ? "Checking message capacity…" : "Protecting message…");
  const encrypted = await encrypt(args.message, operation === "capacity" ? "dummy-password" : args.password, args.compress);
  // The unchanged carrier receives ASCII base64 fields plus its 24-bit terminator.
  const estimatedBits = encrypted.length * 8 + 24;
  const utilization = `${((estimatedBits / totalBits) * 100).toFixed(2)}%`;
  if (operation === "capacity") return { ok: true, totalBits, estimatedBits, utilization };
  if (estimatedBits > totalBits) throw failure("CAPACITY", "Message is too large for this image. Choose a larger PNG or enable compression.");
  write_lsb(png, prepare_write_data(str_to_bits(encrypted, 1), args.password + SECRET_KEY, totalBits, args.obfuscate));
  progress("Preparing PNG output…");
  return {
    ok: true,
    blob: new Blob([serializePNG(png)], { type: "image/png" }),
    capacity: { totalBits, usedBits: estimatedBits, utilization },
  };
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
    const publicError = typeof error.code === "string" && /^(PNG_|INPUT_|READ_FAILED|CAPACITY|DIMENSIONS|RECOVERY_FAILED)/.test(error.code);
    self.postMessage({ id, result: { ok: false, code: publicError ? error.code : "WORKER_FAILED", error: publicError ? error.message : "Image processing failed. Try again or choose another PNG." } });
  } finally {
    busy = false;
  }
};

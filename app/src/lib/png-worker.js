import { admitPNG, serializePNG, MAX_SOURCE_BYTES } from "../../../lib/png.js";
import { comparePNGs } from "../../../lib/png-diff.js";
import { encrypt, decrypt } from "./webCrypto.js";
import {
  prepare_write_data, prepare_read_data, get_bits_lsb, write_lsb,
  calculateImageCapacity, str_to_bits, bits_to_str,
} from "../../../lib/steg-core.js";

const SECRET_KEY = "S3cReTK3Y";
const operations = new Set(["admit", "capacity", "embed", "extract", "diff"]);
const failure = (code, message) => Object.assign(new Error(message), { code });
let busy = false;

async function readBytes(file) {
  if (!(file instanceof Blob)) throw failure("INPUT_INVALID", "Select a supported PNG file.");
  if (file.size > MAX_SOURCE_BYTES) throw failure("PNG_LIMIT", "PNG input must be at most 16 MiB. Choose a smaller PNG.");
  let bytes;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw failure("READ_FAILED", "Could not read the image. Select it again.");
  }
  return bytes;
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


async function run(operation, args, progress) {
  progress("Checking PNG input…");
  if (operation === "diff") {
    const original = await readBytes(args.file);
    const comparison = await readBytes(args.secondFile);
    progress("Creating visual comparison…");
    const { bytes, ...statistics } = comparePNGs(original, comparison);
    return { ok: true, ...statistics, diffBlob: new Blob([bytes], { type: "image/png" }) };
  }
  const png = admitPNG(await readBytes(args.file));
  if (operation === "admit") return { ok: true, width: png.width, height: png.height };
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

import { parentPort } from "node:worker_threads";
import { admitPNG, serializePNG, MAX_SOURCE_BYTES } from "./png.js";
import { encrypt, decrypt } from "./crypto.js";
import {
  calculateImageCapacity,
  str_to_bits,
  bits_to_str,
  prepare_write_data,
  prepare_read_data,
  get_bits_lsb,
  write_lsb,
} from "./steg-core.js";

// Existing placement suffix: this does not change the protected-image format.
const SECRET_KEY = "S3cReTK3Y";
const RECOVERY_ERROR = "Could not recover an authenticated message. The password may be wrong, or the image may be damaged or changed.";
const fail = (code, message) => Object.assign(new Error(message), { code });
const MAX_TEXT_BYTES = 1024 * 1024;

function validate(request) {
  if (!request || !Number.isSafeInteger(request.id) || request.id < 1 ||
      !["encode", "extract", "encrypt", "decrypt"].includes(request.action) ||
      !(request.bytes instanceof Uint8Array) ||
      !(request.bytes.buffer instanceof ArrayBuffer) ||
      request.bytes.byteOffset !== 0 || request.bytes.byteLength !== request.bytes.buffer.byteLength) {
    throw fail("REQUEST_INVALID", "Invalid image operation. Check the inputs and try again.");
  }
  if (request.bytes.byteLength > MAX_SOURCE_BYTES) throw fail("PNG_LIMIT", "PNG source exceeds 16 MiB. Choose a smaller PNG.");
  const protectedOperation = request.action === "encrypt" || request.action === "decrypt";
  if (protectedOperation ? typeof request.password !== "string" || !request.password : typeof request.key !== "string") {
    throw fail("REQUEST_INVALID", "Enter a password before starting the operation.");
  }
  if (request.action === "encode" || request.action === "encrypt") {
    if (typeof request.message !== "string" || typeof request.obfuscate !== "boolean" ||
        (request.action === "encrypt" && typeof request.compress !== "boolean")) {
      throw fail("REQUEST_INVALID", "Invalid message or encoding options.");
    }
    if (request.message.length > MAX_TEXT_BYTES || Buffer.byteLength(request.message, "utf8") > MAX_TEXT_BYTES) {
      throw fail("MESSAGE_LIMIT", "Message exceeds 1 MiB. Use a shorter message.");
    }
  }
}

async function execute(request) {
  validate(request);
  const progress = (stage) => parentPort.postMessage({ id: request.id, type: "progress", stage });
  progress("admitting");
  const image = admitPNG(request.bytes);
  progress("processing");
  const key = request.action === "encrypt" || request.action === "decrypt" ? request.password + SECRET_KEY : request.key;

  if (request.action === "extract" || request.action === "decrypt") {
    // Only hidden-carrier and cryptographic failures use the common failure.
    // Public PNG failures above remain specific and actionable.
    try {
      const message = bits_to_str(prepare_read_data(get_bits_lsb(image), key), 1);
      if (message == null) throw fail("RECOVERY_FAILED", RECOVERY_ERROR);
      return { success: true, data: request.action === "decrypt" ? await decrypt(message, request.password) : message };
    } catch {
      throw fail("RECOVERY_FAILED", RECOVERY_ERROR);
    }
  }

  let message = request.message;
  if (request.action === "encrypt") {
    try { message = await encrypt(message, request.password, request.compress); }
    catch { throw fail("CRYPTO_FAILED", "Could not encrypt the message. Try again."); }
  }
  const totalBits = calculateImageCapacity(image);
  const usedBits = Buffer.byteLength(message, "utf8") * 8 + 24;
  // Check capacity before allocating the existing carrier's bit arrays.
  if (usedBits > totalBits) throw fail("CAPACITY", "Message is too large for this image. Use a larger supported PNG, a shorter message, or compression.");
  const bitStream = str_to_bits(message, 1);
  write_lsb(image, prepare_write_data(bitStream, key, totalBits, request.obfuscate));
  const bytes = serializePNG(image);
  return {
    success: true,
    bytes,
    capacity: { totalBits, usedBits: bitStream.length, utilization: ((bitStream.length / totalBits) * 100).toFixed(2) + "%" },
  };
}

// One request per fresh worker. Never retain a raster for a subsequent selection.
parentPort.once("message", async (request) => {
  let result;
  try {
    result = await execute(request);
  } catch (failure) {
    const publicCodes = ["REQUEST_INVALID", "PNG_INVALID", "PNG_UNSUPPORTED", "PNG_LIMIT", "MESSAGE_LIMIT", "RECOVERY_FAILED", "CAPACITY", "CRYPTO_FAILED"];
    result = publicCodes.includes(failure.code)
      ? { success: false, code: failure.code, error: failure.message }
      : { success: false, code: "OPERATION_FAILED", error: "Image processing failed. Check the inputs and try again." };
  }
  parentPort.postMessage({ id: request?.id, type: "result", result }, result.bytes ? [result.bytes.buffer] : []);
  parentPort.close();
});

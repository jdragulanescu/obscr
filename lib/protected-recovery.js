import inflater from "pako/lib/zlib/inflate.js";
import ZStream from "pako/lib/zlib/zstream.js";
import { deriveKeys, createPositionSource } from "./protected-keys.js";
import { repair } from "./protected-repair.js";

const HIDDEN = "Could not recover an authenticated message. The password may be wrong, or the image may be damaged or changed.";
const requireFrame = condition => { if (!condition) throw new Error("Invalid protected frame"); };

function saltFrom(image) {
  const salt = new Uint8Array(16);
  const scalars = image.width * image.height * 3;
  for (let i = 0; i < 128; i++) {
    const q = Math.floor(i * scalars / 128);
    salt[i >>> 3] |= (image.data[Math.floor(q / 3) * 4 + q % 3] & 1) << (7 - i % 8);
  }
  return salt;
}

async function extract(image, positions, length) {
  const output = new Uint8Array(length);
  let bit = 0;
  const bits = length * 8;
  while (bit < bits) {
    let symbol = 0;
    for (let column = 1; column <= 7; column++) {
      const q = await positions.next();
      if (image.data[Math.floor(q / 3) * 4 + q % 3] & 1) symbol ^= column;
    }
    for (let shift = 2; shift >= 0; shift--, bit++) {
      const value = (symbol >>> shift) & 1;
      if (bit < bits) output[bit >>> 3] |= value << (7 - bit % 8);
      else requireFrame(value === 0);
    }
  }
  return output;
}

function frameShape(header, maxStoredBytes) {
  requireFrame(header.length === 32);
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  const stored = view.getUint32(12);
  const original = view.getUint32(16);
  const compression = header[22];
  requireFrame(stored <= maxStoredBytes && stored <= 512 && original <= 1048576);
  requireFrame(header[20] === 16 && header[21] === 1 && header[23] === 1 &&
    header[24] === 1 && header[25] === 1 && header[26] === 1);
  requireFrame(header.subarray(27).every(value => value === 0));
  requireFrame((compression === 0 && original === stored) ||
    (compression === 1 && stored > 0 && stored < original));
  const ciphertext = stored + 16;
  const blocks = Math.ceil(ciphertext / 239);
  const repaired = ciphertext + 16 * blocks;
  const positions = 7 * (128 + Math.ceil(8 * repaired / 3));
  return { stored, original, compression, ciphertext, blocks, repaired, positions };
}

function repairBody(bytes, shape) {
  const blocks = [];
  let remaining = shape.ciphertext;
  for (let i = 0; i < shape.blocks; i++) {
    const size = Math.min(239, remaining);
    blocks.push(new Uint8Array(size + 16));
    remaining -= size;
  }
  let offset = 0;
  for (let column = 0; column < 255; column++) {
    for (const block of blocks) if (column < block.length) block[column] = bytes[offset++];
  }
  requireFrame(offset === bytes.length);
  const body = new Uint8Array(shape.ciphertext);
  offset = 0;
  for (const block of blocks) {
    const data = repair(block);
    requireFrame(data.length === block.length - 16);
    body.set(data, offset);
    offset += data.length;
  }
  return body;
}

function boundedGzip(bytes, length) {
  const fixed = [31, 139, 8, 0, 0, 0, 0, 0, 0, 255];
  requireFrame(bytes.length >= 18 && fixed.every((value, i) => bytes[i] === value));
  const output = new Uint8Array(length);
  const overflow = new Uint8Array(1);
  const stream = new ZStream();
  requireFrame(inflater.inflateInit2(stream, 31) === 0);
  stream.input = bytes; stream.next_in = 0; stream.avail_in = bytes.length;
  stream.output = output; stream.next_out = 0; stream.avail_out = length;
  try {
    while (true) {
      if (stream.total_out === length) { stream.output = overflow; stream.next_out = 0; stream.avail_out = 1; }
      const beforeIn = stream.avail_in;
      const beforeOut = stream.total_out;
      const status = inflater.inflate(stream, 0);
      requireFrame(stream.total_out <= length);
      if (status === 1) {
        requireFrame(stream.avail_in === 0 && stream.total_out === length);
        return output;
      }
      requireFrame(status === 0 || status === -5);
      requireFrame(beforeIn !== stream.avail_in || beforeOut !== stream.total_out);
    }
  } catch (error) {
    output.fill(0);
    throw error;
  } finally {
    inflater.inflateEnd(stream);
  }
}

function additionalData(salt, header, image) {
  const aad = new Uint8Array(56);
  aad.set(salt); aad.set(header, 16);
  const view = new DataView(aad.buffer);
  view.setUint32(48, image.width); view.setUint32(52, image.height);
  return aad;
}

/** Private complete recovery path. No repaired or unauthenticated bytes leave it. */
export async function recover(image, eligible, maxStoredBytes, password, crypto, progress) {
  let keys;
  let positions;
  let plaintext;
  let expanded;
  try {
    if (!crypto?.hkdf || !crypto?.ctr || !crypto?.decrypt) {
      throw Object.assign(new Error("Native crypto unavailable"), { code: "RESOURCE_FAILED" });
    }
    const salt = saltFrom(image);
    progress("deriving keys");
    keys = await deriveKeys(password, salt, crypto);
    password.fill(0);
    positions = await createPositionSource(eligible, keys.placement, crypto);
    progress("recovering");
    const header = repair(await extract(image, positions, 48));
    const shape = frameShape(header, maxStoredBytes);
    positions.setLimit(shape.positions);
    const body = repairBody(await extract(image, positions, shape.repaired), shape);
    plaintext = await crypto.decrypt(keys.encryption, header.subarray(0, 12), body, additionalData(salt, header, image));
    requireFrame(plaintext.length === shape.stored);
    expanded = shape.compression ? boundedGzip(plaintext, shape.original) : plaintext;
    requireFrame(expanded.length === shape.original);
    const message = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(expanded);
    progress("preparing result");
    return { ok: true, message };
  } catch (error) {
    if (error?.code === "RESOURCE_FAILED" || error instanceof RangeError) {
      return { ok: false, code: "RESOURCE_FAILED", error: "This runtime could not recover the image. Use a supported browser or the local CLI." };
    }
    return { ok: false, code: "RECOVERY_FAILED", error: HIDDEN };
  } finally {
    password.fill(0);
    keys?.encryption.fill(0); keys?.placement.fill(0);
    positions?.clear();
    plaintext?.fill(0); expanded?.fill(0);
  }
}

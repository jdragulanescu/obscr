import { deriveKeys, createPositionSource } from "./protected-keys.js";
import { encodeRepair } from "./protected-repair.js";
import { serializePNG } from "./png.js";

function sampleOffset(scalar) {
  return Math.floor(scalar / 3) * 4 + scalar % 3;
}

function writeSalt(image, salt) {
  const scalars = image.width * image.height * 3;
  for (let bit = 0; bit < 128; bit++) {
    const offset = sampleOffset(Math.floor(bit * scalars / 128));
    image.data[offset] = (image.data[offset] & 254) | ((salt[bit >>> 3] >>> (7 - bit % 8)) & 1);
  }
}

async function writeMatrix(image, positions, bytes, group) {
  const bits = bytes.length * 8;
  for (let bit = 0; bit < bits; bit += 3) {
    let target = 0;
    for (let shift = 0; shift < 3; shift++) {
      const index = bit + shift;
      target = (target << 1) | (index < bits ? (bytes[index >>> 3] >>> (7 - index % 8)) & 1 : 0);
    }
    let current = 0;
    for (let column = 1; column <= 7; column++) {
      const offset = sampleOffset(await positions.next());
      group[column - 1] = offset;
      if (image.data[offset] & 1) current ^= column;
    }
    const difference = current ^ target;
    if (difference) image.data[group[difference - 1]] ^= 1;
  }
}

function interleave(body) {
  const blocks = [];
  const wire = new Uint8Array(body.length + 16 * Math.ceil(body.length / 239));
  try {
    for (let offset = 0; offset < body.length; offset += 239) {
      blocks.push(encodeRepair(body.subarray(offset, offset + 239)));
    }
    let offset = 0;
    for (let column = 0; column < 255; column++) {
      for (const block of blocks) if (column < block.length) wire[offset++] = block[column];
    }
    return wire;
  } finally {
    for (const block of blocks) block.fill(0);
  }
}

/** Private writer: the operation has validated and consumed this preparation. */
export async function encodePrepared(prepared, passwordBytes, nativeCrypto, progress, serialize = serializePNG) {
  let keys;
  let positions;
  let body;
  let wire;
  let repairedHeader;
  let salt;
  let nonce;
  let header;
  let aad;
  let group;
  try {
    header = new Uint8Array(32);
    aad = new Uint8Array(56);
    group = new Uint32Array(7);
    if (!["randomBytes", "hkdf", "ctr", "encrypt"].every(name => typeof nativeCrypto?.[name] === "function")) {
      throw new Error("Native cryptography unavailable");
    }
    salt = await nativeCrypto.randomBytes(16);
    nonce = await nativeCrypto.randomBytes(12);
    if (!(salt instanceof Uint8Array) || salt.length !== 16 ||
        !(nonce instanceof Uint8Array) || nonce.length !== 12) throw new Error("Randomness unavailable");
    const { image, eligible, bytes, summary } = prepared;
    header.set(nonce);
    const fields = new DataView(header.buffer);
    fields.setUint32(12, bytes.length);
    fields.setUint32(16, summary.originalBytes);
    header.set([16, 1, summary.compressionUsed ? 1 : 0, 1, 1, 1, 1], 20);
    aad.set(salt);
    aad.set(header, 16);
    const dimensions = new DataView(aad.buffer);
    dimensions.setUint32(48, image.width);
    dimensions.setUint32(52, image.height);
    progress("deriving keys");
    keys = await deriveKeys(passwordBytes, salt, nativeCrypto);
    passwordBytes.fill(0);
    progress("encoding");
    body = await nativeCrypto.encrypt(keys.encryption, nonce, bytes, aad);
    if (!(body instanceof Uint8Array) || body.length !== bytes.length + 16) throw new Error("Invalid encrypted body");
    repairedHeader = encodeRepair(header);
    wire = interleave(body);
    positions = await createPositionSource(eligible, keys.placement, nativeCrypto);
    writeSalt(image, salt);
    await writeMatrix(image, positions, repairedHeader, group);
    positions.setLimit(7 * (128 + Math.ceil(wire.length * 8 / 3)));
    await writeMatrix(image, positions, wire, group);
    progress("preparing result");
    const pngBytes = await serialize(image);
    if (!(pngBytes instanceof Uint8Array)) throw new Error("PNG serialization unavailable");
    return { ok: true, pngBytes };
  } catch {
    return { ok: false, code: "RESOURCE_FAILED", error: "This runtime could not encode the image. Use a supported browser or the local CLI." };
  } finally {
    passwordBytes.fill(0);
    keys?.encryption.fill(0);
    keys?.placement.fill(0);
    positions?.clear();
    body?.fill?.(0);
    wire?.fill(0);
    repairedHeader?.fill(0);
    salt?.fill?.(0);
    nonce?.fill?.(0);
    header?.fill(0);
    aad?.fill(0);
    group?.fill(0);
  }
}

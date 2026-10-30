import { createCipheriv, hkdfSync } from "node:crypto";
import { deflateRawSync, deflateSync } from "node:zlib";
import sodium from "libsodium-wrappers-sumo";

/**
 * PUBLIC TEST DATA ONLY. Never use this password, salt or nonce for real data.
 *
 * Independent encoder written from the accepted format, not from the decoder:
 * https://github.com/jdragulanescu/obscr/issues/19#issuecomment-6387228703
 * https://github.com/jdragulanescu/obscr/issues/17#issuecomment-6386604139
 * https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6374176664
 *
 * This module imports no application code. Its full-sort ranking, polynomial
 * division RS encoder, Node crypto, PNG writer and matrix writer are separate
 * reference implementations. Argon2id uses the specified pinned Sodium package.
 * Generate PNG bytes in Node and supply those bytes to either operation adapter;
 * this module itself is not intended for a browser bundle.
 */
export const PASSWORD = "public reference password / not a secret";
export const TEXT = "\uFEFFProtected image — Καλημέρα 世界\r\n  exact whitespace \t\n";
const SALT = Uint8Array.from({ length: 16 }, (_, i) => i);
const NONCE = Uint8Array.from({ length: 12 }, (_, i) => 0xa0 + i);
const encoder = new TextEncoder();
const MAX_POSITIONS = 11648;
let defaultKeys;
let cachedCover;
let cachedPositions;

function integer(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`Reference fixture: invalid ${label}`);
  }
  return value;
}

function bytes(value, length, label) {
  if (!(value instanceof Uint8Array) || value.length !== length) {
    throw new TypeError(`Reference fixture: invalid ${label}`);
  }
  return Uint8Array.from(value);
}

function exactUTF8(text) {
  if (typeof text !== "string") throw new TypeError("Reference fixture: text must be a string");
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new TypeError("Reference fixture: unpaired surrogate");
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new TypeError("Reference fixture: unpaired surrogate");
    }
  }
  return encoder.encode(text);
}

function concat(parts) {
  const result = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function u32(value) {
  const result = new Uint8Array(4);
  new DataView(result.buffer).setUint32(0, value, false);
  return result;
}

const crcTable = Uint32Array.from({ length: 256 }, (_, byte) => {
  let value = byte;
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});

function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = (value >>> 8) ^ crcTable[(value ^ byte) & 255];
  return (value ^ 0xffffffff) >>> 0;
}

/** Fixed-header, single-member gzip. Useful for constructing malformed inputs. */
export function referenceGzip(input) {
  if (!(input instanceof Uint8Array) || input.length > 1048576) {
    throw new RangeError("Reference fixture: gzip input exceeds bound");
  }
  const trailer = new Uint8Array(8);
  const view = new DataView(trailer.buffer);
  view.setUint32(0, crc32(input), true);
  view.setUint32(4, input.length, true);
  return concat([
    Uint8Array.of(0x1f, 0x8b, 8, 0, 0, 0, 0, 0, 0, 0xff),
    deflateRawSync(input, { level: 9 }),
    trailer,
  ]);
}

function chunk(type, data) {
  const payload = concat([encoder.encode(type), data]);
  return concat([u32(data.length), payload, u32(crc32(payload))]);
}

function png(rgb, width, height, colorType) {
  const channels = colorType === 2 ? 3 : 4;
  const stride = width * channels + 1;
  const raster = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = 3 * (y * width + x);
      const target = y * stride + 1 + x * channels;
      raster[target] = rgb[source];
      raster[target + 1] = rgb[source + 1];
      raster[target + 2] = rgb[source + 2];
      if (channels === 4) raster[target + 3] = 255;
    }
  }
  const header = concat([u32(width), u32(height), Uint8Array.of(8, colorType, 0, 0, 0)]);
  return concat([
    Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raster)),
    chunk("IEND", new Uint8Array()),
  ]);
}

function coverRGB(width, height) {
  const rgb = new Uint8Array(width * height * 3);
  // Salt samples cross the high-detail strip; checkerboard ties test the cutoff.
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const odd = (x + y) & 1;
    const value = x < Math.ceil(width / 8) ? odd * 254 : 124 + odd * 2;
    rgb.fill(value, 3 * (y * width + x), 3 * (y * width + x + 1));
  }
  return rgb;
}

function referenceScore(rgb, width, height, p) {
  const x = p % width;
  const y = Math.floor(p / width);
  const neighbors = [];
  if (x > 0) neighbors.push(p - 1);
  if (x + 1 < width) neighbors.push(p + 1);
  if (y > 0) neighbors.push(p - width);
  if (y + 1 < height) neighbors.push(p + width);
  let score = 0;
  for (let c = 0; c < 3; c++) {
    let sum = 0;
    for (const q of neighbors) sum += rgb[3 * q + c] & 254;
    score += Math.abs(neighbors.length * (rgb[3 * p + c] & 254) - sum);
  }
  return score;
}

function referenceCover(width, height) {
  if (cachedCover?.width === width && cachedCover.height === height) return cachedCover;
  const pixels = width * height;
  const rgb = coverRGB(width, height);
  const scores = new Uint16Array(pixels);
  const ranked = [];
  for (let p = 0; p < pixels; p++) {
    scores[p] = referenceScore(rgb, width, height, p);
    if (scores[p] > 0) ranked.push(p);
  }
  ranked.sort((a, b) => scores[b] - scores[a] || a - b);
  ranked.length = Math.min(ranked.length, Math.floor(pixels / 4));
  ranked.sort((a, b) => a - b);
  const saltPositions = Uint32Array.from({ length: 128 }, (_, i) => Math.floor(i * 3 * pixels / 128));
  const reserved = new Set(saltPositions);
  const eligible = [];
  for (const p of ranked) for (let c = 0; c < 3; c++) {
    const scalar = p * 3 + c;
    if (!reserved.has(scalar)) eligible.push(scalar);
  }
  cachedCover = { width, height, rgb, saltPositions, eligible: Uint32Array.from(eligible) };
  return cachedCover;
}

async function derive(password, salt) {
  const passwordBytes = exactUTF8(password);
  integer(passwordBytes.length, 1, 1024, "password length");
  const useDefault = password === PASSWORD && salt.every((byte, i) => byte === SALT[i]);
  if (useDefault && defaultKeys) return defaultKeys;
  const work = (async () => {
    await sodium.ready;
    const root = sodium.crypto_pwhash(32, passwordBytes, salt, 3, 67108864, sodium.crypto_pwhash_ALG_ARGON2ID13);
    try {
      const child = (label) => new Uint8Array(hkdfSync("sha256", root, new Uint8Array(32), encoder.encode(label), 32));
      return { encryption: child("obscr/keys/1/encryption"), placement: child("obscr/keys/1/placement") };
    } finally {
      root.fill(0);
      passwordBytes.fill(0);
    }
  })();
  if (useDefault) defaultKeys = work;
  return work;
}

function referenceDrawSource(cipher, total) {
  let stream = new Uint8Array();
  let cursor = 0;
  let draws = 0;
  return (index) => {
    const budget = index < 896 ? 2816 : 2 * total + 1024;
    if (++draws > budget) {
      throw new Error("Reference fixture: sampler draw ceiling");
    }
    if (cursor === stream.length) {
      stream = cipher.update(new Uint8Array(4096));
      cursor = 0;
    }
    const draw = new DataView(stream.buffer, stream.byteOffset + cursor, 4).getUint32(0, true);
    cursor += 4;
    return draw;
  };
}

function positions(cover, key) {
  const keyID = Buffer.from(key).toString("hex");
  if (cachedPositions?.cover === cover && cachedPositions.keyID === keyID) return cachedPositions.result;
  const cipher = createCipheriv("aes-256-ctr", key, new Uint8Array(16));
  const swaps = new Map();
  const result = new Uint32Array(Math.min(MAX_POSITIONS, cover.eligible.length));
  const nextDraw = referenceDrawSource(cipher, result.length);
  for (let i = 0; i < result.length; i++) {
    const remaining = cover.eligible.length - i;
    const ceiling = Math.floor(0x100000000 / remaining) * remaining;
    let draw;
    do {
      draw = nextDraw(i);
    } while (draw >= ceiling);
    const selected = draw % remaining;
    const index = swaps.get(selected) ?? selected;
    const last = remaining - 1;
    if (selected !== last) swaps.set(selected, swaps.get(last) ?? last);
    swaps.delete(last);
    result[i] = cover.eligible[index];
  }
  cipher.final();
  cachedPositions = { cover, keyID, result };
  return result;
}

// Polynomial arithmetic, highest coefficient first. This encoder deliberately
// does not share a finite-field table or correction implementation with repair.
function multiply(a, b) {
  let product = 0;
  while (b !== 0) {
    if (b & 1) product ^= a;
    b >>>= 1;
    a <<= 1;
    if (a & 0x100) a ^= 0x11d;
  }
  return product;
}

const generator = (() => {
  let polynomial = Uint8Array.of(1);
  let root = 1;
  for (let i = 0; i < 16; i++) {
    const next = new Uint8Array(polynomial.length + 1);
    for (let j = 0; j < polynomial.length; j++) {
      next[j] ^= polynomial[j];
      next[j + 1] ^= multiply(polynomial[j], root);
    }
    polynomial = next;
    root = multiply(root, 2);
  }
  return polynomial;
})();

function encodeRS(data) {
  integer(data.length, 1, 239, "RS data length");
  const divided = new Uint8Array(data.length + 16);
  divided.set(data);
  for (let i = 0; i < data.length; i++) {
    const coefficient = divided[i];
    for (let j = 0; j < generator.length; j++) divided[i + j] ^= multiply(coefficient, generator[j]);
  }
  return concat([data, divided.subarray(data.length)]);
}

function applyOverrides(data, overrides = {}) {
  for (const [offset, value] of Object.entries(overrides)) {
    data[integer(Number(offset), 0, data.length - 1, "override offset")] = integer(value, 0, 255, "override byte");
  }
}

function xorBytes(data, mutations = []) {
  for (const { offset, xor = 1 } of mutations) {
    data[integer(offset, 0, data.length - 1, "damage offset")] ^= integer(xor, 1, 255, "damage XOR");
  }
}

function matrixWrite(rgb, selected, start, data, badPadding = false) {
  const groups = Math.ceil(data.length * 8 / 3);
  if (badPadding && data.length * 8 % 3 === 0) {
    throw new RangeError("Reference fixture: this body has no padding to damage");
  }
  for (let group = 0; group < groups; group++) {
    let target = 0;
    for (let bit = 0; bit < 3; bit++) {
      const index = group * 3 + bit;
      target = (target << 1) | (index < data.length * 8 ? (data[index >>> 3] >>> (7 - (index & 7))) & 1 : 0);
    }
    if (badPadding && group === groups - 1) target |= 1;
    let current = 0;
    for (let column = 1; column <= 7; column++) {
      if (rgb[selected[start + group * 7 + column - 1]] & 1) current ^= column;
    }
    const difference = current ^ target;
    if (difference) rgb[selected[start + group * 7 + difference - 1]] ^= 1;
  }
}

function storedText(options) {
  const raw = exactUTF8(options.text ?? TEXT);
  integer(raw.length, 0, 1048576, "original text length");
  let compression = integer(options.compression ?? 0, 0, 1, "compression");
  let stored;
  if (options.storedBytes !== undefined) {
    if (!(options.storedBytes instanceof Uint8Array)) throw new TypeError("Reference fixture: storedBytes must be Uint8Array");
    integer(options.storedBytes.length, 0, 512, "stored length");
    stored = Uint8Array.from(options.storedBytes);
  } else {
    stored = compression === 1 ? referenceGzip(raw) : raw;
    if (compression === 1 && stored.length >= raw.length) {
      compression = 0;
      stored = raw;
    }
  }
  integer(stored.length, 0, 512, "stored length");
  const defaultLength = compression === 0 ? stored.length : raw.length;
  const originalLength = integer(options.originalLength ?? defaultLength, 0, 0xffffffff, "original length");
  return { stored, compression, originalLength };
}

function referenceHeader(nonce, text, overrides) {
  const header = new Uint8Array(32);
  header.set(nonce);
  header.set(u32(text.stored.length), 12);
  header.set(u32(text.originalLength), 16);
  header.set([16, 1, text.compression, 1, 1, 1, 1], 20);
  applyOverrides(header, overrides);
  return header;
}

function referenceBody(stored, key, header, aad, damage) {
  const cipher = createCipheriv("aes-256-gcm", key, header.subarray(0, 12), { authTagLength: 16 });
  cipher.setAAD(aad);
  const ciphertext = concat([cipher.update(stored), cipher.final()]);
  const tag = Uint8Array.from(cipher.getAuthTag());
  xorBytes(tag, damage.tagBytes);
  const tagLength = integer(damage.tagLength ?? 16, 0, 16, "tag length");
  const body = concat([ciphertext, tag.subarray(0, tagLength)]);
  const codewords = [];
  for (let offset = 0; offset < body.length; offset += 239) codewords.push(encodeRS(body.subarray(offset, offset + 239)));
  for (const mutation of damage.bodyBytes ?? []) {
    const block = integer(mutation.block, 0, codewords.length - 1, "body block");
    xorBytes(codewords[block], [mutation]);
  }
  return codewords;
}

function interleavedBody(codewords, bodyLength, order) {
  const ordered = order === "reverse-blocks" ? [...codewords].reverse() : codewords;
  if (order === "concatenate") return concat(ordered);
  if (order !== undefined && order !== "reverse-blocks") throw new RangeError("Reference fixture: unknown body order");
  const wire = new Uint8Array(bodyLength);
  let cursor = 0;
  for (let column = 0; column < 255; column++) for (const codeword of ordered) {
    if (column < codeword.length) wire[cursor++] = codeword[column];
  }
  return wire;
}

function writeCarrier(cover, selected, salt, repairedHeader, wire, groups, damage) {
  const rgb = Uint8Array.from(cover.rgb);
  for (let bit = 0; bit < 128; bit++) {
    const scalar = cover.saltPositions[bit];
    rgb[scalar] = (rgb[scalar] & 254) | ((salt[bit >>> 3] >>> (7 - (bit & 7))) & 1);
  }
  matrixWrite(rgb, selected, 0, repairedHeader);
  matrixWrite(rgb, selected, 896, wire, damage.padding === true);
  for (const bit of damage.saltBits ?? []) rgb[cover.saltPositions[integer(bit, 0, 127, "salt bit")]] ^= 1;
  for (const index of damage.positions ?? []) rgb[selected[integer(index, 0, 7 * groups - 1, "position index")]] ^= 1;
  for (const { scalar, xor = 1 } of damage.rgb ?? []) rgb[integer(scalar, 0, rgb.length - 1, "RGB scalar")] ^= integer(xor, 1, 255, "RGB XOR");
  return rgb;
}

/**
 * Return a complete deterministic PNG, with no production encoder/parser calls.
 *
 * Defaults: PASSWORD, TEXT, raw encoding, 1024 x 1024, RGB (colorType: 2).
 * colorType: 6 writes the SAME RGB samples with opaque alpha. Width/height are
 * integers in 1..1024 and must provide enough carrier capacity for the body.
 * Salt (16 bytes) and nonce (12 bytes) may be replaced with public test values.
 *
 * text preserves BOM, CRLF and whitespace. compression: 1 requests fixed gzip,
 * using raw when gzip is not smaller. storedBytes bypasses UTF-8/compression and
 * is encrypted verbatim (0..512 bytes); with this option compression is the exact
 * header flag. originalLength overrides L (default: stored length for raw, UTF-8
 * text length for gzip). These options construct invalid
 * authenticated UTF-8, gzip, expansion lengths, extra members and trailing data.
 * headerOverrides is an offset:value object, applied BEFORE authentication.
 *
 * damage is optional and all offsets are zero-based:
 * - headerAfterAuth: offset:value header overrides AFTER authentication, before RS.
 * - tagBytes: [{offset, xor=1}], offsets 0..15, changed before body RS encoding.
 * - tagLength: 0..16 physically retains this many tag bytes BEFORE body RS and
 *   interleaving; the header still declares the canonical full-tag format. This
 *   constructs a malformed complete image, not merely altered authentication.
 * - headerBytes: [{offset, xor=1}], changed AFTER header RS (offsets 0..47).
 * - bodyBytes: [{block, offset, xor=1}], changed AFTER body RS; block is 0..2.
 * - wireBytes: [{offset, xor=1}], changed after interleaving.
 * - bodyOrder: 'concatenate' or 'reverse-blocks', instead of correct interleave.
 * - padding: true sets the final padding bit to 1 (throws if no padding exists).
 * - saltBits: [0..127], flip raw salt carrier bits AFTER all embedding.
 * - positions: [keyed position index], flip sample LSB AFTER embedding.
 * - rgb: [{scalar, xor=1}], flip an arbitrary RGB scalar AFTER embedding.
 *
 * Byte damage defaults to XOR 1, so distinct edits model symbol errors. Use
 * eight/nine DISTINCT offsets in one codeword for correction-radius cases.
 * headerAfterAuth/tagBytes yield unrepairable authentication changes rather than
 * errors that RS can undo. Invalid headers still use the actual stored body size
 * to keep fixture work bounded. No assertion of decoder acceptance is made here.
 *
 * Only the fixed public default KDF is cached. One cover and one maximum-length
 * position trace are cached at a time; no unbounded fixture/key cache is retained.
 */
export async function referencePNG(options = {}) {
  const width = integer(options.width ?? 1024, 1, 1024, "width");
  const height = integer(options.height ?? 1024, 1, 1024, "height");
  const colorType = options.colorType ?? 2;
  if (colorType !== 2 && colorType !== 6) throw new RangeError("Reference fixture: colorType must be 2 or 6");
  const salt = bytes(options.salt ?? SALT, 16, "salt");
  const nonce = bytes(options.nonce ?? NONCE, 12, "nonce");
  const text = storedText(options);
  const header = referenceHeader(nonce, text, options.headerOverrides);
  const damage = options.damage ?? {};
  const cover = referenceCover(width, height);
  const ciphertextLength = text.stored.length + integer(damage.tagLength ?? 16, 0, 16, "tag length");
  const bodyLength = ciphertextLength + 16 * Math.ceil(ciphertextLength / 239);
  const groups = 128 + Math.ceil(bodyLength * 8 / 3);
  const budget = Math.min(cover.eligible.length, 262144);
  if (width * height * 3 < 128 || 3 * groups > Math.floor(budget / 50) || 7 * groups > budget) {
    throw new RangeError("Reference fixture: insufficient cover capacity");
  }
  const keys = await derive(options.password ?? PASSWORD, salt);
  const selected = positions(cover, keys.placement);
  const aad = concat([salt, header, u32(width), u32(height)]);
  const codewords = referenceBody(text.stored, keys.encryption, header, aad, damage);
  const wire = interleavedBody(codewords, bodyLength, damage.bodyOrder);
  xorBytes(wire, damage.wireBytes);
  applyOverrides(header, damage.headerAfterAuth);
  const repairedHeader = encodeRS(header);
  xorBytes(repairedHeader, damage.headerBytes);
  const rgb = writeCarrier(cover, selected, salt, repairedHeader, wire, groups, damage);
  return png(rgb, width, height, colorType);
}

/** Plain public cover for independent operation-level encoder comparisons. */
export function referenceCoverPNG({ width = 1024, height = 1024, colorType = 2 } = {}) {
  integer(width, 1, 1024, "width");
  integer(height, 1, 1024, "height");
  if (colorType !== 2 && colorType !== 6) throw new RangeError("Reference fixture: colorType must be 2 or 6");
  return png(coverRGB(width, height), width, height, colorType);
}

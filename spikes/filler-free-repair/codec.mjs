// Throwaway experiment for https://github.com/jdragulanescu/obscr/issues/28.
// Compare repair profiles and placement; the public salt code is a presence risk.
import { rsEncode, rsDecode } from './rs.mjs';

export const PASSWORD = 'synthetic-filler-free-repair-password';
export const profiles = Object.freeze([16, 32, 64].flatMap(parity =>
  ['grouped', 'scattered'].map(mapping => Object.freeze({ name: `${mapping}-p${parity}`, parity, mapping }))));
const MAX_PLAIN = 1024 * 1024;
const SALT_BYTES = 80;
const META_BYTES = 100;
const encoder = new TextEncoder();

function geometry(width, height, rgb) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 1024 || height > 1024)
    throw new Error('Image dimensions must be integers from 1 to 1024');
  const slots = width * height * 3;
  if (rgb !== undefined && (!(rgb instanceof Uint8Array) || rgb.length !== slots))
    throw new Error('Expected packed RGB Uint8Array');
  return Math.floor(slots / 8);
}
function selected(profile) {
  const p = profiles.find(p => typeof profile === 'string' ? p.name === profile : p.parity === profile?.parity && p.mapping === profile?.mapping);
  if (!p) throw new Error('Unknown repair profile');
  return p;
}
function codedLength(length, parity) {
  return length + Math.ceil(length / (255 - parity)) * parity;
}
export function capacity(width, height, profile) {
  const groups = geometry(width, height);
  const { parity } = selected(profile);
  const available = groups - SALT_BYTES - META_BYTES;
  if (available < codedLength(16, parity)) return -1;
  const k = 255 - parity;
  // Invert full blocks and the final shortened block, then remove the GCM tag.
  const data = Math.floor(available / 255) * k + Math.max(0, available % 255 - parity);
  return data - 16;
}
function bootstrap(groups) {
  if (groups < SALT_BYTES) throw new Error('Image too small for salt record');
  const ids = new Uint32Array(SALT_BYTES);
  for (let i = 0; i < ids.length; i++) ids[i] = Math.floor(i * groups / SALT_BYTES);
  return ids;
}
function groupedPositions(ids) {
  const flat = new Uint32Array(ids.length * 8);
  for (let i = 0; i < ids.length; i++) for (let b = 0; b < 8; b++) flat[i * 8 + b] = ids[i] * 8 + b;
  return byteViews(flat);
}
function byteViews(flat) {
  return Array.from({ length: flat.length / 8 }, (_, i) => flat.subarray(i * 8, i * 8 + 8));
}
function extract(rgb, positions) {
  const result = new Uint8Array(positions.length);
  for (let i = 0; i < result.length; i++) for (let b = 0; b < 8; b++) result[i] = (result[i] << 1) | (rgb[positions[i][b]] & 1);
  return result;
}
function insert(rgb, bytes, positions) {
  for (let i = 0; i < bytes.length; i++) for (let b = 0; b < 8; b++) {
    const index = positions[i][b];
    rgb[index] = (rgb[index] & 254) | ((bytes[i] >>> (7 - b)) & 1);
  }
}
export function readSaltCode(rgb, width, height) {
  return extract(rgb, groupedPositions(bootstrap(geometry(width, height, rgb))));
}
function concat(...parts) {
  const bytes = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  return bytes;
}
async function keys(salt, password) {
  if (typeof password !== 'string' || password.length === 0 || !password.isWellFormed())
    throw new Error('Password must be nonempty, well-formed Unicode');
  const passwordBytes = encoder.encode(password);
  if (passwordBytes.length > 1024) throw new Error('Password exceeds 1024 UTF-8 bytes');
  const material = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveBits']);
  const root = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, material, 256);
  const hkdf = await crypto.subtle.importKey('raw', root, 'HKDF', false, ['deriveKey']);
  const derive = (label, name, usages) => crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: encoder.encode(label) }, hkdf, { name, length: 256 }, false, usages);
  return {
    encryption: await derive('obscr/keys/1/encryption', 'AES-GCM', ['encrypt', 'decrypt']),
    placement: await derive('obscr/keys/1/placement', 'AES-CTR', ['encrypt'])
  };
}
async function synthetic(seed, label) {
  if (typeof seed !== 'string' || seed.length > 4096) throw new Error('Synthetic seed must be a string of at most 4096 characters');
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(['obscr-repair-experiment', label, seed]))));
}
function aad(salt, metadata, width, height) {
  const dimensions = new Uint8Array(8);
  const view = new DataView(dimensions.buffer);
  view.setUint32(0, width); view.setUint32(4, height);
  return concat(salt, metadata, dimensions);
}
async function placement(groups, profile, key) {
  const reserved = bootstrap(groups);
  const grouped = profile.mapping === 'grouped';
  const pool = new Uint32Array((groups - SALT_BYTES) * (grouped ? 1 : 8));
  let cursor = 0, r = 0;
  for (let g = 0; g < groups; g++) {
    if (r < reserved.length && g === reserved[r]) { r++; continue; }
    if (grouped) pool[cursor++] = g;
    else for (let b = 0; b < 8; b++) pool[cursor++] = g * 8 + b;
  }
  let remaining = pool.length, words = null, wordIndex = 0, counterBlocks = 0, draws = 0;
  const maxDraws = pool.length * 2 + 4096;
  async function randomWord() {
    if (++draws > maxDraws) throw new Error('Placement draw bound exceeded');
    if (!words || wordIndex === words.byteLength / 4) {
      const counter = new Uint8Array(16);
      new DataView(counter.buffer).setUint32(12, counterBlocks);
      const stream = await crypto.subtle.encrypt({ name: 'AES-CTR', counter, length: 128 }, key, new Uint8Array(65536));
      counterBlocks += 4096;
      words = new DataView(stream); wordIndex = 0;
    }
    return words.getUint32(wordIndex++ * 4, true);
  }
  async function draw() {
    if (!remaining) throw new Error('Placement capacity exceeded');
    const limit = Math.floor(4294967296 / remaining) * remaining;
    let value;
    do { value = await randomWord(); } while (value >= limit);
    const index = value % remaining;
    const result = pool[index];
    pool[index] = pool[--remaining];
    return result;
  }
  return async count => {
    const flat = new Uint32Array(count * 8);
    if (grouped) {
      for (let i = 0; i < count; i++) {
        const group = await draw();
        for (let b = 0; b < 8; b++) flat[i * 8 + b] = group * 8 + b;
      }
    } else for (let i = 0; i < flat.length; i++) flat[i] = await draw();
    return byteViews(flat);
  };
}
async function transform(bytes, mode, limit) {
  const stream = new Blob([bytes]).stream().pipeThrough(mode === 'compress' ? new CompressionStream('gzip') : new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error(`${mode} output exceeds bound`);
      chunks.push(value);
    }
    const result = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return result;
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
}
function protect(bytes, parity) {
  const blocks = [];
  const k = 255 - parity;
  for (let offset = 0; offset < bytes.length; offset += k) blocks.push(rsEncode(bytes.subarray(offset, offset + k), parity));
  return blocks;
}
function repair(bytes, parity, length) {
  const out = new Uint8Array(length);
  let at = 0;
  for (let offset = 0; offset < bytes.length; offset += 255) {
    const decoded = rsDecode(bytes.subarray(offset, offset + 255), parity);
    out.set(decoded, at); at += decoded.length;
  }
  if (at !== length) throw new Error('Incorrect repaired length');
  return out;
}
export async function encode(rgb, width, height, message, profile, { compressed = false, seed = 'repair-experiment' } = {}) {
  const groups = geometry(width, height, rgb);
  const p = selected(profile);
  if (!(message instanceof Uint8Array) || message.length > MAX_PLAIN) throw new Error('Plaintext must be Uint8Array, at most 1 MiB');
  if (typeof compressed !== 'boolean') throw new Error('compressed must be boolean');
  const maximum = capacity(width, height, p);
  if (maximum < 0) throw new Error('Image too small for envelope');
  const stored = compressed ? await transform(message, 'compress', maximum) : message;
  if (stored.length > maximum) throw new Error('Stored message exceeds exact capacity');
  const salt = (await synthetic(seed, 'salt')).slice(0, 16);
  const nonce = (await synthetic(seed, 'nonce')).slice(0, 12);
  const metadata = new Uint8Array(36);
  metadata.set(nonce);
  const view = new DataView(metadata.buffer);
  view.setUint32(12, stored.length); view.setUint32(16, message.length);
  metadata[20] = p.parity; metadata[21] = p.mapping === 'grouped' ? 0 : 1; metadata[22] = Number(compressed);
  metadata.set((await synthetic(seed, 'reserved')).subarray(0, 13), 23);
  const derived = await keys(salt, PASSWORD);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: aad(salt, metadata, width, height), tagLength: 128 }, derived.encryption, stored));
  const saltCodeword = rsEncode(salt, 64);
  const metadataCodeword = rsEncode(metadata, 64);
  const codewords = protect(ciphertext, p.parity);
  const payloadCode = concat(...codewords);
  const saltPositions = groupedPositions(bootstrap(groups));
  const next = await placement(groups, p, derived.placement);
  const metadataPositions = await next(META_BYTES);
  const payloadPositions = await next(payloadCode.length);
  const result = rgb.slice();
  insert(result, saltCodeword, saltPositions); insert(result, metadataCodeword, metadataPositions); insert(result, payloadCode, payloadPositions);
  return {
    rgb: result, profile: p, storedBytes: stored.length, plainBytes: message.length,
    codedBytes: payloadCode.length, totalCodedBytes: SALT_BYTES + META_BYTES + payloadCode.length,
    saltPositions, metadataPositions, initialPositions: [...saltPositions, ...metadataPositions], payloadPositions,
    saltCodeword, metadataCodeword, codewords, ciphertext, compressed
  };
}
export async function decode(rgb, width, height, profile, password = PASSWORD) {
  try {
    const groups = geometry(width, height, rgb);
    if (typeof password !== 'string' || password.length > 1024) throw new Error('Invalid password input bound');
    const candidates = profile === undefined ? profiles : [selected(profile)];
    const salt = rsDecode(readSaltCode(rgb, width, height), 64);
    const derived = await keys(salt, password);
    for (const p of candidates) {
      try {
        const maximum = capacity(width, height, p);
        if (maximum < 0) throw new Error('Image too small for envelope');
        const next = await placement(groups, p, derived.placement);
        const metadataPositions = await next(META_BYTES);
        const metadata = rsDecode(extract(rgb, metadataPositions), 64);
        const view = new DataView(metadata.buffer, metadata.byteOffset, metadata.byteLength);
        const storedLength = view.getUint32(12), plainLength = view.getUint32(16);
        if (metadata[20] !== p.parity || metadata[21] !== (p.mapping === 'grouped' ? 0 : 1) || metadata[22] > 1 || storedLength > maximum || plainLength > MAX_PLAIN || (!metadata[22] && storedLength !== plainLength))
          throw new Error('Invalid protected metadata');
        const payloadPositions = await next(codedLength(storedLength + 16, p.parity));
        const ciphertext = repair(extract(rgb, payloadPositions), p.parity, storedLength + 16);
        const stored = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: metadata.subarray(0, 12), additionalData: aad(salt, metadata, width, height), tagLength: 128 }, derived.encryption, ciphertext));
        const message = metadata[22] ? await transform(stored, 'decompress', plainLength) : stored;
        if (message.length !== plainLength) throw new Error('Incorrect plaintext length');
        return { outcome: 'exact-ready', message, profile: p, storedBytes: storedLength, plainBytes: plainLength, compressed: Boolean(metadata[22]) };
      } catch { /* No plaintext escapes a failed candidate. Fixed profile attempts only. */ }
    }
    return { outcome: 'safe-failure', reason: 'Repair, metadata, authentication, or bounded decompression failed' };
  } catch {
    return { outcome: 'safe-failure', reason: 'Input, salt repair, or key derivation failed' };
  }
}

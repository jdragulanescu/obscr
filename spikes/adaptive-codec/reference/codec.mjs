// Disposable experiment for https://github.com/jdragulanescu/obscr/issues/31.
// Explicit grouped profiles only. Public salt has no repair or recognition record.
import { rsEncode, rsDecode } from './rs.mjs';
import { deriveKeys, createPlacement, MAX_POSITIONS, MAX_PIXELS } from './key-chain.mjs';

export const PASSWORD = 'synthetic-unprotected-salt-password';
export const profiles = Object.freeze([
  Object.freeze({ name: 'no-repair', parity: 0, mapping: 'grouped' }),
  Object.freeze({ name: 'grouped-p32', parity: 32, mapping: 'grouped' })
]);
const MAX_PLAIN = 1024 * 1024;
const SALT_BYTES = 16;
const encoder = new TextEncoder();
const FAILURE = 'Input, key derivation, metadata, repair, authentication, or bounded decompression failed';

function geometry(width, height, rgb) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096 || width * height > MAX_PIXELS)
    throw new Error('Image dimensions or pixel count exceed bounds');
  const slots = width * height * 3;
  if (rgb !== undefined && (!(rgb instanceof Uint8Array) || rgb.length !== slots))
    throw new Error('Expected exact packed RGB Uint8Array');
  return Math.floor(slots / 8);
}
function selected(profile) {
  const p = profiles.find(p => typeof profile === 'string' ? p.name === profile : p.name === profile?.name && p.parity === profile?.parity && p.mapping === profile?.mapping);
  if (!p) throw new Error('Known explicit profile required');
  return p;
}
function headerLength(profile) { return profile.parity ? 100 : 36; }
function codedLength(length, parity) {
  return length + (parity ? Math.ceil(length / (255 - parity)) * parity : 0);
}
export function capacity(width, height, profile) {
  const groups = geometry(width, height);
  const p = selected(profile);
  const available = Math.min(groups - SALT_BYTES, MAX_POSITIONS) - headerLength(p);
  if (available < codedLength(16, p.parity)) return -1;
  const data = p.parity
    ? Math.floor(available / 255) * 223 + Math.max(0, available % 255 - 32)
    : available;
  return Math.min(MAX_PLAIN, data - 16);
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
function fresh(length) { return crypto.getRandomValues(new Uint8Array(length)); }
async function synthetic(seed, label) {
  if (typeof seed !== 'string' || seed.length > 4096) throw new Error('Synthetic seed must be a string of at most 4096 characters');
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(['obscr-unprotected-salt-experiment', label, seed]))));
}
function aad(salt, metadata, width, height) {
  const dimensions = new Uint8Array(8);
  const view = new DataView(dimensions.buffer);
  view.setUint32(0, width); view.setUint32(4, height);
  return concat(salt, metadata, dimensions);
}
function placement(groups, key) {
  const sampler = createPlacement(groups, key);
  return {
    next: async count => groupedPositions(await sampler.take(count)),
    diagnostics: sampler.diagnostics
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
  if (!parity) return [bytes];
  const blocks = [];
  const k = 255 - parity;
  for (let offset = 0; offset < bytes.length; offset += k) blocks.push(rsEncode(bytes.subarray(offset, offset + k), parity));
  return blocks;
}
function repair(bytes, parity, length) {
  if (bytes.length !== codedLength(length, parity)) throw new Error('Incorrect encoded length');
  if (!parity) return bytes;
  const out = new Uint8Array(length);
  let at = 0;
  for (let offset = 0; offset < bytes.length; offset += 255) {
    const decoded = rsDecode(bytes.subarray(offset, offset + 255), parity);
    out.set(decoded, at); at += decoded.length;
  }
  if (at !== length) throw new Error('Incorrect repaired length');
  return out;
}
export async function encode(rgb, width, height, message, profile, { compressed = false, seed, password = PASSWORD } = {}) {
  const groups = geometry(width, height, rgb);
  const p = selected(profile);
  if (!(message instanceof Uint8Array) || message.length > MAX_PLAIN) throw new Error('Plaintext must be Uint8Array, at most 1 MiB');
  if (typeof compressed !== 'boolean') throw new Error('compressed must be boolean');
  const maximum = capacity(width, height, p);
  if (maximum < 0) throw new Error('Image too small for envelope');
  const stored = compressed ? await transform(message, 'compress', maximum) : message;
  if (stored.length > maximum) throw new Error('Stored message exceeds exact capacity');
  // Explicit fixture seeds are unsafe for real messages: they repeat salt and nonce.
  const salt = seed === undefined ? fresh(16) : (await synthetic(seed, 'salt')).slice(0, 16);
  const nonce = seed === undefined ? fresh(12) : (await synthetic(seed, 'nonce')).slice(0, 12);
  const metadata = new Uint8Array(36);
  metadata.set(nonce);
  const view = new DataView(metadata.buffer);
  view.setUint32(12, stored.length, false); view.setUint32(16, message.length, false);
  metadata[20] = p.parity; metadata[21] = 0; metadata[22] = Number(compressed);
  const derived = await deriveKeys(salt, password);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: aad(salt, metadata, width, height), tagLength: 128 }, derived.encryption, stored));
  const saltCodeword = salt;
  const metadataCodeword = p.parity ? rsEncode(metadata, 64) : metadata;
  const codewords = protect(ciphertext, p.parity);
  const payloadCode = concat(...codewords);
  const saltPositions = groupedPositions(bootstrap(groups));
  const locations = placement(groups, derived.placement);
  const metadataPositions = await locations.next(headerLength(p));
  const payloadPositions = await locations.next(payloadCode.length);
  const result = rgb.slice();
  insert(result, saltCodeword, saltPositions); insert(result, metadataCodeword, metadataPositions); insert(result, payloadCode, payloadPositions);
  const overhead = {
    salt: 16, metadataData: 36, metadataParity: p.parity ? 64 : 0,
    authenticationTag: 16, payloadParity: payloadCode.length - ciphertext.length,
    padding: 0, stored: stored.length,
    total: 16 + metadataCodeword.length + payloadCode.length,
    nonPayload: 16 + metadataCodeword.length + 16 + payloadCode.length - ciphertext.length,
    keyedGroups: metadataCodeword.length + payloadCode.length
  };
  return {
    rgb: result, profile: p, storedBytes: stored.length, plainBytes: message.length,
    codedBytes: payloadCode.length, totalCodedBytes: overhead.total,
    saltPositions, metadataPositions, initialPositions: [...saltPositions, ...metadataPositions], payloadPositions,
    saltCodeword, metadataCodeword, codewords, ciphertext, compressed, overhead, placement: locations.diagnostics()
  };
}
export async function decode(rgb, width, height, profile, password = PASSWORD) {
  try {
    const groups = geometry(width, height, rgb);
    const p = selected(profile);
    const maximum = capacity(width, height, p);
    if (maximum < 0) throw new Error('Image too small for envelope');
    const salt = readSaltCode(rgb, width, height);
    // Every header extraction, repair, and validation follows the password root.
    const derived = await deriveKeys(salt, password);
    const locations = placement(groups, derived.placement);
    const metadataPositions = await locations.next(headerLength(p));
    const headerCode = extract(rgb, metadataPositions);
    const metadata = p.parity ? rsDecode(headerCode, 64) : headerCode;
    if (metadata.length !== 36) throw new Error('Incorrect header size');
    const view = new DataView(metadata.buffer, metadata.byteOffset, metadata.byteLength);
    const storedLength = view.getUint32(12, false), plainLength = view.getUint32(16, false);
    if (metadata[20] !== p.parity || metadata[21] !== 0 || metadata[22] > 1 || metadata.subarray(23).some(byte => byte !== 0) || storedLength > maximum || plainLength > MAX_PLAIN || (!metadata[22] && storedLength !== plainLength))
      throw new Error('Invalid protected metadata');
    const payloadPositions = await locations.next(codedLength(storedLength + 16, p.parity));
    const ciphertext = repair(extract(rgb, payloadPositions), p.parity, storedLength + 16);
    const stored = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: metadata.subarray(0, 12), additionalData: aad(salt, metadata, width, height), tagLength: 128 }, derived.encryption, ciphertext));
    // No decompressor sees data before full-tag authentication succeeds.
    const message = metadata[22] ? await transform(stored, 'decompress', plainLength) : stored;
    if (message.length !== plainLength) throw new Error('Incorrect plaintext length');
    return { outcome: 'exact-ready', message, profile: p, storedBytes: storedLength, plainBytes: plainLength, compressed: Boolean(metadata[22]), placement: locations.diagnostics() };
  } catch {
    return { outcome: 'safe-failure', reason: FAILURE };
  }
}

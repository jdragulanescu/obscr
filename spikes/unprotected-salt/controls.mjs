// Disposable controls for https://github.com/jdragulanescu/obscr/issues/31.
// Uses the unchanged production crypto/carrier; synthetic deterministic filler only.
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import { encrypt, decrypt } from '../../lib/crypto.js';
import { prepare_write_data, prepare_read_data, get_bits_lsb, write_lsb, str_to_bits, bits_to_str } from '../../lib/steg-core.js';
export function random(seed) {
  let x = seed >>> 0;
  return n => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return Math.floor(x / 4294967296 * n); };
}
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function message(size) {
  const next = random(2800 + size);
  return Uint8Array.from({ length: size }, () => 32 + next(95));
}
export function rgba(rgb, width, height) {
  const data = Buffer.alloc(width * height * 4, 255);
  for (let i = 0; i < width * height; i++) data.set(rgb.subarray(i * 3, i * 3 + 3), i * 4);
  return { data, width, height };
}
export function fromRgba(image) {
  const rgb = new Uint8Array(image.width * image.height * 3);
  for (let i = 0; i < image.width * image.height; i++) rgb.set(image.data.subarray(i * 4, i * 4 + 3), i * 3);
  return { rgb, width: image.width, height: image.height };
}
export const png = (rgb, width, height) => PNG.sync.write(rgba(rgb, width, height));
export function parsePng(bytes) {
  if (bytes.length > 16 * 1024 * 1024 || bytes.length < 24) throw Error('container bound');
  const w = bytes.readUInt32BE(16), h = bytes.readUInt32BE(20);
  if (!w || !h || w > 1024 || h > 1024) throw Error('geometry bound');
  const image = PNG.sync.read(bytes, { checkCRC: true });
  for (let i = 3; i < image.data.length; i += 4)
    if (image.data[i] !== 255) throw Error('Only opaque experiment covers are supported');
  return fromRgba(image);
}
export const controls = [
  { name: 'legacy-filler-on', copies: 1, filler: true },
  { name: 'legacy-filler-off', copies: 1, filler: false },
];
export async function controlEncode(cover, msg, profile, password, compressed = false) {
  const text = await encrypt(new TextDecoder('utf-8', { fatal: true }).decode(msg), password, compressed);
  const bits = str_to_bits(text, profile.copies);
  if (bits.length > cover.rgb.length) throw Error('capacity');
  const data = prepare_write_data(bits, password, cover.rgb.length, profile.filler);
  const oldRandom = Math.random, next = random(28028);
  let result;
  // Production call is synchronous; restore even on failure, before awaiting anything.
  try { Math.random = () => next(0x100000000) / 0x100000000; result = write_lsb(rgba(cover.rgb, cover.width, cover.height), data); }
  finally { Math.random = oldRandom; }
  const fields = text.split(':'), storedBytes = Buffer.from(fields[2], 'base64').length;
  const binaryBytes = 32 + 12 + storedBytes + 16;
  const base64Bytes = fields.slice(0, 4).reduce((n, field) => n + field.length, 0);
  return { rgb: fromRgba(result).rgb, codedBytes: bits.length / 8, storedBytes,
    overhead: { salt: 32, nonce: 12, tag: 16, separators: 3, compressionFlag: compressed ? 2 : 0,
      base64Expansion: base64Bytes - binaryBytes, endMarker: 3, repair: 0, finalBlockPadding: 0,
      totalOverhead: bits.length / 8 - storedBytes, fillerBits: profile.filler ? cover.rgb.length - bits.length : 0 } };
}
export async function controlDecode(rgb, width, height, profile, password) {
  try {
    const bits = prepare_read_data(get_bits_lsb(rgba(rgb, width, height)), password);
    const text = await decrypt(bits_to_str(bits, profile.copies), password);
    return { outcome: 'exact-ready', message: new TextEncoder().encode(text) };
  } catch { return { outcome: 'safe-failure', reason: 'legacy extraction/authentication' }; }
}
export function damage(rgb, width, height, kind, seed) {
  const out = rgb.slice(), next = random(seed), pixels = width * height;
  const selected = [], pool = new Map();
  if (kind === 'one-channel-1pct' || kind === 'rgb-replace-1pct') {
    for (let left = pixels, i = 0; i < Math.floor(pixels * .01); i++, left--) {
      const j = next(left), p = pool.get(j) ?? j;
      pool.set(j, pool.get(left - 1) ?? left - 1); pool.delete(left - 1); selected.push(p);
    }
  } else if (kind === 'patch') {
    const side = Math.max(1, Math.floor(Math.sqrt(pixels * .01)));
    for (let y = Math.floor((height-side)/2); y < Math.floor((height-side)/2)+side; y++)
      for (let x = Math.floor((width-side)/2); x < Math.floor((width-side)/2)+side; x++) selected.push(y*width+x);
  } else if (kind === 'stripe') {
    for (let y = 0; y < height; y++) for (let x = 0; x < Math.max(1,Math.floor(width*.01)); x++) selected.push(y*width+Math.floor(width/2)+x);
  }
  for (const p of selected) {
    if (kind === 'one-channel-1pct') { const i = p * 3 + next(3); out[i] = Math.max(0,Math.min(255,out[i]+(next(2)?1:-1))); }
    else for (let c = 0; c < 3; c++) out[p*3+c] = next(256);
  }
  return { rgb: out, selectedPixels: selected.length };
}
export function visual(before, after) {
  let changed = 0, squared = 0;
  for (let i = 0; i < before.length; i++) { const d = before[i] - after[i]; changed += d !== 0; squared += d*d; }
  return { changedSamples: changed, changedRate: changed/before.length, mse: squared/before.length, psnr: squared ? 10*Math.log10(255*255*before.length/squared) : null };
}
export function extractedByteErrors(encoded, damaged) {
  if (!encoded.payloadPositions) return null;
  let start = 0;
  return encoded.codewords.map(word => {
    let errors = 0;
    for (let b = 0; b < word.length; b++) {
      const positions = encoded.payloadPositions[start+b];
      let actual = 0;
      for (let bit = 0; bit < 8; bit++) actual = actual*2+(damaged[positions[bit]]&1);
      errors += actual !== word[b];
    }
    start += word.length;
    return errors;
  });
}

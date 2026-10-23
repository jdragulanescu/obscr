// Question: what can a complete authenticated image record survive?
// Ticket: https://github.com/jdragulanescu/obscr/issues/16
// Controls: run.mjs selects the public profile, damage, message and fixture seed.
// THROWAWAY: fixed public profiles and deterministic fixture secrets are not a product format.
import { createHash, createHmac, pbkdf2Sync, hkdfSync, createCipheriv, createDecipheriv } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import sharp from 'sharp';

export const SIDE = 512;
export const HEADER = 48;
export const PASSWORD = 'public fixture password — not a user secret';
export const profiles = [
  { name: 'lsb-1', id: 1, repeats: 1, carrier: 'lsb' },
  { name: 'lsb-5', id: 2, repeats: 5, carrier: 'lsb' },
  { name: 'qim-32', id: 3, repeats: 3, carrier: 'qim', step: 32 },
  { name: 'qim-64', id: 4, repeats: 3, carrier: 'qim', step: 64 },
];
export const digest = value => createHash('sha256').update(value).digest('hex');
export const bytes = (label, size) => {
  const out = Buffer.alloc(size);
  for (let offset = 0, counter = 0; offset < size; counter++) {
    const block = createHash('sha256').update(`${label}:${counter}`).digest();
    block.copy(out, offset, 0, Math.min(block.length, size - offset));
    offset += block.length;
  }
  return out;
};
function random(seed) {
  let block = Buffer.alloc(0), offset = 0, counter = 0;
  return limit => {
    const bound = Math.floor(0x100000000 / limit) * limit;
    let value;
    do {
      if (offset === block.length) {
        block = createHmac('sha256', seed).update(String(counter++)).digest();
        offset = 0;
      }
      value = block.readUInt32LE(offset); offset += 4;
    } while (value >= bound);
    return value % limit;
  };
}
export function shuffle(values, seed, count = values.length) {
  const next = random(seed);
  for (let i = 0; i < count; i++) {
    const j = i + next(values.length - i), value = values[i]; values[i] = values[j]; values[j] = value;
  }
  return values;
}
export const slots = p => p.carrier === 'lsb' ? SIDE * SIDE * 3 : (SIDE / 8) ** 2;
export const capacity = p => Math.floor(slots(p) / (8 * p.repeats)) - HEADER - 16;
const publicOrders = new Map();
function publicOrder(p) {
  if (!publicOrders.has(p.name)) publicOrders.set(p.name,
    shuffle(Uint32Array.from({ length: slots(p) }, (_, i) => i), Buffer.from(`image-survival/${p.name}/bootstrap`)));
  return publicOrders.get(p.name);
}
function keys(password, salt) {
  // Fixed experimental cost, not a selected password policy or cracking benchmark.
  const root = pbkdf2Sync(password, salt, 65535, 32, 'sha256');
  return {
    encryption: Buffer.from(hkdfSync('sha256', root, salt, 'image-survival/encryption', 32)),
    placement: Buffer.from(hkdfSync('sha256', root, salt, 'image-survival/placement', 32)),
  };
}
const basis = Float64Array.from({ length: 64 }, (_, i) =>
  0.25 * Math.cos((2 * (i % 8) + 1) * Math.PI / 16) * Math.cos((2 * Math.floor(i / 8) + 1) * 2 * Math.PI / 16));
function offset(block, i) {
  return ((Math.floor(block / 64) * 8 + Math.floor(i / 8)) * SIDE + (block % 64) * 8 + i % 8) * 3;
}
function coefficient(rgb, block) {
  let value = 0;
  for (let i = 0; i < 64; i++) {
    const j = offset(block, i);
    value += basis[i] * (0.299 * rgb[j] + 0.587 * rgb[j + 1] + 0.114 * rgb[j + 2]);
  }
  return value;
}
function put(rgb, slot, bit, p) {
  if (p.carrier === 'lsb') { rgb[slot] = (rgb[slot] & 254) | bit; return; }
  const current = coefficient(rgb, slot);
  const target = (2 * Math.round((current / p.step - bit) / 2) + bit) * p.step;
  const delta = target - current;
  for (let i = 0; i < 64; i++) {
    const j = offset(slot, i);
    for (let c = 0; c < 3; c++) rgb[j + c] = Math.max(0, Math.min(255, Math.round(rgb[j + c] + delta * basis[i])));
  }
}
export function carrierBits(rgb, p) {
  if (p.carrier === 'lsb') return Uint8Array.from(rgb, x => x & 1);
  return Uint8Array.from({ length: slots(p) }, (_, i) => ((Math.round(coefficient(rgb, i) / p.step) % 2) + 2) % 2);
}
function embed(rgb, data, order, p) {
  const bitCount = data.length * 8;
  for (let bit = 0; bit < bitCount; bit++) {
    const value = (data[bit >> 3] >> (7 - (bit % 8))) & 1;
    // Copies occupy separate stretches of a shuffled order, not adjacent pixels.
    for (let copy = 0; copy < p.repeats; copy++) put(rgb, order[copy * bitCount + bit], value, p);
  }
}
function extract(bits, length, order, p) {
  const data = Buffer.alloc(length), count = length * 8;
  let disagreements = 0;
  for (let bit = 0; bit < count; bit++) {
    let ones = 0;
    for (let copy = 0; copy < p.repeats; copy++) ones += bits[order[copy * count + bit]];
    if (ones !== 0 && ones !== p.repeats) disagreements++;
    if (ones > p.repeats / 2) data[bit >> 3] |= 1 << (7 - bit % 8);
  }
  return { data, disagreements };
}
export const toPng = rgb => sharp(rgb, { raw: { width: SIDE, height: SIDE, channels: 3 } }).png().toBuffer();
export async function pixels(file, p) {
  const image = sharp(file, { failOn: 'warning', limitInputPixels: 4 * SIDE * SIDE });
  const meta = await image.metadata();
  if (p.carrier === 'lsb' && (meta.width !== SIDE || meta.height !== SIDE)) throw new Error('geometry');
  // A fixed public 512x512 profile, not dimensions obtained from the sender or an oracle.
  return image.resize(SIDE, SIDE, { fit: 'fill', kernel: 'lanczos3' }).removeAlpha().toColourspace('srgb').raw().toBuffer();
}
export async function encode(cover, message, compressed, p, fixture) {
  const stored = compressed ? gzipSync(message, { level: 9, mtime: 0 }) : message;
  if (stored.length > capacity(p)) return { outcome: 'capacity', storedBytes: stored.length };
  const header = Buffer.alloc(HEADER);
  header.write('IS16'); header[4] = 1; header[5] = p.id; header[6] = Number(compressed);
  header.writeUInt32BE(stored.length, 8); header.writeUInt32BE(message.length, 12);
  bytes(`${fixture}/salt`, 16).copy(header, 16); bytes(`${fixture}/nonce`, 12).copy(header, 32);
  header.writeUInt16BE(SIDE, 44); header.writeUInt16BE(SIDE, 46);
  const key = keys(PASSWORD, header.subarray(16, 32));
  const cipher = createCipheriv('aes-256-gcm', key.encryption, header.subarray(32, 44));
  cipher.setAAD(header);
  const payload = Buffer.concat([cipher.update(stored), cipher.final(), cipher.getAuthTag()]);
  const order = publicOrder(p), headerSlots = HEADER * 8 * p.repeats;
  const payloadOrder = shuffle(order.slice(headerSlots), key.placement, payload.length * 8 * p.repeats);
  const rgb = Buffer.from(cover);
  embed(rgb, header, order, p); embed(rgb, payload, payloadOrder, p);
  return { outcome: 'encoded', rgb, png: await toPng(rgb), header, payload, order, payloadOrder,
    storedBytes: stored.length, codedBits: (HEADER + payload.length) * 8 * p.repeats };
}
export async function decode(file, p, password = PASSWORD) {
  const times = {}, start = performance.now();
  let rgb;
  try { rgb = await pixels(file, p); } catch (error) {
    return { outcome: error.message === 'geometry' ? 'geometry' : 'image-parse', times };
  }
  times.imageMs = performance.now() - start;
  const extractionStart = performance.now(), bits = carrierBits(rgb, p), order = publicOrder(p);
  const bootstrap = extract(bits, HEADER, order, p), h = bootstrap.data;
  if (h.subarray(0, 4).toString() !== 'IS16' || h[4] !== 1 || h[5] !== p.id || h[6] > 1 || h[7] !== 0 ||
      h.readUInt16BE(44) !== SIDE || h.readUInt16BE(46) !== SIDE || h.readUInt32BE(8) > capacity(p) || h.readUInt32BE(12) > 1048576) {
    return { outcome: 'bootstrap', disagreements: bootstrap.disagreements, times };
  }
  times.bootstrapMs = performance.now() - extractionStart;
  const keyStart = performance.now(), key = keys(password, h.subarray(16, 32));
  times.kdfMs = performance.now() - keyStart;
  const payloadStart = performance.now();
  const payloadOrder = shuffle(order.slice(HEADER * 8 * p.repeats), key.placement, (h.readUInt32BE(8) + 16) * 8 * p.repeats);
  const payload = extract(bits, h.readUInt32BE(8) + 16, payloadOrder, p);
  times.payloadMs = performance.now() - payloadStart;
  const authStart = performance.now();
  let message;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key.encryption, h.subarray(32, 44), { authTagLength: 16 });
    decipher.setAAD(h); decipher.setAuthTag(payload.data.subarray(-16));
    message = Buffer.concat([decipher.update(payload.data.subarray(0, -16)), decipher.final()]);
  } catch { return { outcome: 'authentication', times }; }
  times.authenticationMs = performance.now() - authStart;
  const decompressStart = performance.now();
  try { if (h[6]) message = gunzipSync(message, { maxOutputLength: 1048576 }); }
  catch { return { outcome: 'decompression', times }; }
  if (message.length !== h.readUInt32BE(12)) return { outcome: 'length', times };
  times.decompressionMs = performance.now() - decompressStart;
  return { outcome: 'authenticated', message, times, disagreements: bootstrap.disagreements + payload.disagreements };
}
export function targetedDamage(encoded, p, section, copies) {
  const rgb = Buffer.from(encoded.rgb);
  const data = section === 'bootstrap' ? encoded.header : encoded.payload;
  const order = section === 'bootstrap' ? encoded.order : encoded.payloadOrder;
  // Flip the first bit, with exact controlled errors in one repetition codeword.
  const original = (data[0] >> 7) & 1;
  for (let copy = 0; copy < copies; copy++) put(rgb, order[copy * data.length * 8], 1 - original, p);
  return rgb;
}
export function malformedHeader(encoded, p) {
  const rgb = Buffer.from(encoded.rgb), header = Buffer.from(encoded.header);
  header.writeUInt32BE(0xffffffff, 8);
  embed(rgb, header, encoded.order, p);
  return rgb;
}
export function publicDetector(rgb, p) {
  const header = extract(carrierBits(rgb, p), HEADER, publicOrder(p), p).data;
  // Frozen format-aware detector; no password, tuning or learned classifier.
  return header.subarray(0, 4).toString() === 'IS16' && header[4] === 1 && header[5] === p.id;
}

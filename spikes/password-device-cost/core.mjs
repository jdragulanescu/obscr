// Disposable experiment. Profiles are candidates, not production policy.
const WORD_SPACE = 2 ** 32;
const MAX_DEMAND = 1048576;
const MAX_DRAWS = 2098176;
const encoder = new TextEncoder();
export const PROFILES = Object.freeze([
  ...[[64, 2], [64, 3], [128, 2], [128, 3]].map(([memoryMiB, passes]) =>
    Object.freeze({ id: `a${memoryMiB}t${passes}`, algorithm: 'argon2id', version: 19, memoryMiB, passes, lanes: 1 })),
  ...[[65536, 1], [131072, 1], [65536, 2]].map(([N, p]) =>
    Object.freeze({ id: `s${N / 1024}p${p}`, algorithm: 'scrypt', N, r: 8, p })),
  ...[600000, 1200000, 2400000].map(iterations =>
    Object.freeze({ id: `p${iterations / 1000}k`, algorithm: 'pbkdf2', hash: 'SHA-256', iterations })),
]);
function integer(value, min, max, name) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`Invalid ${name}`);
  return value;
}
function byteArray(value, length, name) {
  if (!(value instanceof Uint8Array) || value.length !== length) throw new TypeError(`Invalid ${name}`);
}
export function passwordBytes(password) {
  if (typeof password !== 'string' || password.length === 0) throw new TypeError('Password must be a nonempty string');
  // UTF-8 is at least as long as well-formed UTF-16 in code units.
  if (password.length > 1024) throw new RangeError('Password exceeds 1024 UTF-8 bytes');
  for (let i = 0; i < password.length; i++) {
    const unit = password.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = password.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new TypeError('Unpaired surrogate');
    } else if (unit >= 0xdc00 && unit <= 0xdfff) throw new TypeError('Unpaired surrogate');
  }
  const bytes = encoder.encode(password);
  if (bytes.length > 1024) throw new RangeError('Password exceeds 1024 UTF-8 bytes');
  return bytes;
}
function samplingBounds(N, demand, maxDraws = 2 * demand + 1024) {
  integer(N, 1, WORD_SPACE, 'pool size');
  integer(demand, 0, Math.min(N, MAX_DEMAND), 'demand');
  integer(maxDraws, 0, MAX_DRAWS, 'draw limit');
  return maxDraws;
}
export function validateRequest(request) {
  const { profileId, password, salt, width, height, demand } = request;
  const profile = PROFILES.find(item => item.id === profileId);
  if (!profile) throw new RangeError('Unsupported profile');
  byteArray(salt, 16, 'salt');
  integer(width, 1, 4096, 'width');
  integer(height, 1, 4096, 'height');
  integer(width * height, 1, 16777216, 'pixel count');
  const N = width * height * 3 - 4096;
  const maxDraws = samplingBounds(N, demand, request.maxDraws);
  return { ...request, salt: salt.slice(), N, maxDraws, bytes: passwordBytes(password), profile };
}
export async function derive(validated) {
  const { profile, bytes, salt } = validated;
  let root;
  if (profile.algorithm === 'argon2id') {
    const { default: sodium } = await import('libsodium-wrappers-sumo');
    await sodium.ready;
    root = sodium.crypto_pwhash(32, bytes, salt, profile.passes, profile.memoryMiB * 1024 * 1024, sodium.crypto_pwhash_ALG_ARGON2ID13);
  } else if (profile.algorithm === 'scrypt') {
    const { scryptAsync } = await import('@noble/hashes/scrypt.js');
    root = await scryptAsync(bytes, salt, { N: profile.N, r: profile.r, p: profile.p, dkLen: 32, maxmem: 256 * 1024 * 1024 });
  } else if (profile.algorithm === 'pbkdf2') {
    const key = await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveBits']);
    root = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: profile.iterations }, key, 256));
  } else throw new RangeError('Unsupported profile');
  const key = await crypto.subtle.importKey('raw', root, 'HKDF', false, ['deriveBits']);
  const child = async label => new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: encoder.encode(`obscr/keys/1/${label}`) }, key, 256));
  return { root, encryption: await child('encryption'), placement: await child('placement') };
}
// Internal buffers end on AES blocks; unused bytes are retained across callers.
async function streamReader(key, chunkBytes, counter = new Uint8Array(16)) {
  byteArray(key, 32, 'placement key');
  byteArray(counter, 16, 'counter');
  integer(chunkBytes, 1, MAX_DRAWS * 4, 'chunk size');
  const capacity = Math.ceil(chunkBytes / 16) * 16;
  let next = 0n;
  for (const byte of counter) next = (next << 8n) | BigInt(byte);
  const end = 1n << 128n;
  const aes = await crypto.subtle.importKey('raw', key, 'AES-CTR', false, ['encrypt']);
  return {
    capacity,
    async refill(wanted) {
      if (next === end) throw new RangeError('AES counter exhausted');
      const blocks = Math.min(capacity / 16, Math.ceil(wanted / 16), Number(end - next));
      const iv = new Uint8Array(16);
      let value = next;
      for (let i = 15; i >= 0; i--) { iv[i] = Number(value & 255n); value >>= 8n; }
      const result = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CTR', counter: iv, length: 128 }, aes, new Uint8Array(blocks * 16)));
      next += BigInt(blocks);
      return result;
    },
    remaining: () => (end - next) * 16n,
  };
}
export async function streamBytes(key, length, { chunkBytes = 4096, counter } = {}) {
  integer(length, 0, 0xffffffff, 'stream length');
  const reader = await streamReader(key, chunkBytes, counter);
  if (BigInt(length) > reader.remaining()) throw new RangeError('AES counter would wrap');
  const result = new Uint8Array(length);
  for (let offset = 0; offset < length;) {
    const buffer = await reader.refill(length - offset);
    const count = Math.min(buffer.length, length - offset);
    result.set(buffer.subarray(0, count), offset);
    offset += count;
  }
  return result;
}
function sampler(N, demand, maxDraws) {
  maxDraws = samplingBounds(N, demand, maxDraws);
  const output = new Uint32Array(demand);
  const swaps = new Map();
  let count = 0, draws = 0, rejections = 0, peakEntries = 0;
  return {
    get done() { return count === demand; },
    get draws() { return draws; },
    get remainingDraws() { return maxDraws - draws; },
    push(x) {
      if (draws === maxDraws) throw new RangeError('Draw limit exhausted');
      integer(x, 0, WORD_SPACE - 1, 'stream word');
      draws++;
      const b = N - count;
      if (x >= Math.floor(WORD_SPACE / b) * b) { rejections++; return; }
      const j = x % b;
      output[count++] = swaps.get(j) ?? j;
      const last = swaps.get(b - 1) ?? b - 1;
      swaps.delete(b - 1);
      if (j !== b - 1) {
        if (last === j) swaps.delete(j);
        else swaps.set(j, last);
      }
      peakEntries = Math.max(peakEntries, swaps.size);
    },
    result: () => ({ positions: output, draws, rejections, peakEntries }),
  };
}
export function sampleWords(N, demand, words, { maxDraws } = {}) {
  const state = sampler(N, demand, maxDraws);
  if (state.done) return state.result();
  for (const word of words) {
    state.push(word);
    if (state.done) return state.result();
  }
  throw new RangeError('Word source exhausted');
}
export async function positions(key, N, demand, { maxDraws, chunkBytes = 4096, onProgress } = {}) {
  const state = sampler(N, demand, maxDraws);
  const reader = await streamReader(key, chunkBytes);
  let streamBufferBytes = 0;
  while (!state.done) {
    if (state.remainingDraws === 0) throw new RangeError('Draw limit exhausted');
    const buffer = await reader.refill(state.remainingDraws * 4);
    // Native input and output buffers can coexist during encryption.
    streamBufferBytes = Math.max(streamBufferBytes, buffer.byteLength * 2);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    for (let offset = 0; offset < buffer.length && !state.done; offset += 4) {
      state.push(view.getUint32(offset, true));
      if (onProgress && state.draws % 4096 === 0) onProgress({ ...state.result(), streamBufferBytes });
    }
    if (onProgress) onProgress({ ...state.result(), streamBufferBytes });
  }
  return { ...state.result(), streamBufferBytes };
}

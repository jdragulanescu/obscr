// Disposable key/position observations for https://github.com/jdragulanescu/obscr/issues/31.
// Run: node key-chain.mjs. No cached password root or alternate KDF.
const utf8 = new TextEncoder();
const WORD_SPACE = 2 ** 32;
export const MAX_POSITIONS = 262144;
export const MAX_DRAWS = 525312;
export const MAX_PIXELS = 12192768;

export function passwordBytes(password) {
  if (typeof password !== 'string' || password.length === 0 || password.length > 1024)
    throw new TypeError('Password must be nonempty and at most 1024 UTF-8 bytes');
  for (let i = 0; i < password.length; i++) {
    const unit = password.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = password.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new TypeError('Unpaired surrogate');
    } else if (unit >= 0xdc00 && unit <= 0xdfff) throw new TypeError('Unpaired surrogate');
  }
  const bytes = utf8.encode(password);
  if (bytes.length > 1024) throw new RangeError('Password exceeds 1024 UTF-8 bytes');
  return bytes;
}
export async function deriveKeys(salt, password) {
  const bytes = passwordBytes(password);
  if (!(salt instanceof Uint8Array) || salt.length !== 16) throw new TypeError('Salt must be 16 bytes');
  const { default: sodium } = await import('libsodium-wrappers-sumo');
  await sodium.ready;
  const root = sodium.crypto_pwhash(32, bytes, salt, 3, 65536 * 1024, sodium.crypto_pwhash_ALG_ARGON2ID13);
  const material = await crypto.subtle.importKey('raw', root, 'HKDF', false, ['deriveBits']);
  const child = async label => new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: utf8.encode(`obscr/keys/1/${label}`) }, material, 256));
  const encryptionBytes = await child('encryption');
  const placementBytes = await child('placement');
  return {
    root, encryptionBytes, placementBytes,
    encryption: await crypto.subtle.importKey('raw', encryptionBytes, 'AES-GCM', false, ['encrypt', 'decrypt']),
    placement: await crypto.subtle.importKey('raw', placementBytes, 'AES-CTR', false, ['encrypt'])
  };
}

// The pool contains ranks of non-salt groups, not RGB samples. Only swaps are stored.
// A caller can take the header prefix, then extend the same sampler after parsing it.
export function createPlacement(groups, key) {
  if (!Number.isSafeInteger(groups) || groups < 16 || groups > Math.floor(MAX_PIXELS * 3 / 8))
    throw new RangeError('Invalid group domain');
  const reserved = Uint32Array.from({ length: 16 }, (_, i) => Math.floor(i * groups / 16));
  const N = groups - 16;
  const swaps = new Map();
  let count = 0, draws = 0, rejections = 0, peakEntries = 0, counterBlocks = 0;
  let words, wordIndex = 0;
  const zeroChunk = new Uint8Array(4096);
  async function randomWord(drawLimit) {
    if (draws >= drawLimit || draws >= MAX_DRAWS) throw new RangeError('Placement draw bound exceeded');
    if (!words || wordIndex === 1024) {
      const counter = new Uint8Array(16);
      new DataView(counter.buffer).setUint32(12, counterBlocks, false);
      words = new DataView(await crypto.subtle.encrypt({ name: 'AES-CTR', counter, length: 128 }, key, zeroChunk));
      counterBlocks += 256;
      wordIndex = 0;
    }
    draws++;
    return words.getUint32(wordIndex++ * 4, true);
  }
  return {
    async take(amount) {
      const demand = count + amount;
      if (!Number.isSafeInteger(amount) || amount < 0 || demand > N || demand > MAX_POSITIONS)
        throw new RangeError('Placement demand bound exceeded');
      const drawLimit = 2 * demand + 1024;
      const result = new Uint32Array(amount);
      for (let i = 0; i < amount; i++) {
        const remaining = N - count;
        const limit = Math.floor(WORD_SPACE / remaining) * remaining;
        let word;
        do { word = await randomWord(drawLimit); if (word >= limit) rejections++; } while (word >= limit);
        const index = word % remaining;
        const rank = swaps.get(index) ?? index;
        const last = swaps.get(remaining - 1) ?? remaining - 1;
        swaps.delete(remaining - 1);
        if (index !== remaining - 1) {
          if (last === index) swaps.delete(index);
          else swaps.set(index, last);
        }
        count++;
        peakEntries = Math.max(peakEntries, swaps.size);
        // Translate a non-salt rank without building a full-domain lookup table.
        let group = rank;
        for (const saltGroup of reserved) { if (saltGroup > group) break; group++; }
        result[i] = group;
      }
      return result;
    },
    diagnostics: () => ({ positions: count, draws, rejections, peakEntries, mapEntries: swaps.size, maxDraws: 2 * count + 1024, streamChunkBytes: 4096, generatedStreamBytes: counterBlocks * 16 })
  };
}

export async function keyChainObservations() {
  const salt = Uint8Array.from({ length: 16 }, (_, i) => i);
  const password = ' Obscr café e\u0301 🔐 ';
  const derived = await deriveKeys(salt, password);
  const hex = value => Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('');
  // Independent HKDF assembly: extract with zero salt, then one-block expand.
  const zero = await crypto.subtle.importKey('raw', new Uint8Array(32), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = await crypto.subtle.sign('HMAC', zero, derived.root);
  const hmac = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expand = async label => {
    const info = utf8.encode(`obscr/keys/1/${label}`);
    const input = new Uint8Array(info.length + 1); input.set(info); input[info.length] = 1;
    return new Uint8Array(await crypto.subtle.sign('HMAC', hmac, input));
  };
  const groups = 5000, demand = 1300;
  const a = createPlacement(groups, derived.placement);
  const one = await a.take(demand);
  const b = createPlacement(groups, derived.placement);
  const first = await b.take(36), rest = await b.take(demand - 36);
  const split = new Uint32Array(demand); split.set(first); split.set(rest, 36);
  // Independent full-domain reference is observation-only, on a small domain.
  const reserved = new Set(Array.from({ length: 16 }, (_, i) => Math.floor(i * groups / 16)));
  const pool = Array.from({ length: groups }, (_, i) => i).filter(i => !reserved.has(i));
  const stream = new DataView(await crypto.subtle.encrypt({ name: 'AES-CTR', counter: new Uint8Array(16), length: 128 }, derived.placement, new Uint8Array(12288)));
  let at = 0, remaining = pool.length;
  const reference = new Uint32Array(demand);
  for (let i = 0; i < demand; i++) {
    let word; const limit = Math.floor(WORD_SPACE / remaining) * remaining;
    do { word = stream.getUint32(at, true); at += 4; } while (word >= limit);
    const index = word % remaining; reference[i] = pool[index]; pool[index] = pool[--remaining];
  }
  const equal = (left, right) => left.length === right.length && left.every((v, i) => v === right[i]);
  const checks = {
    // Frozen a64t3 chain: prior node-vectors.json, checked against Noble Argon2id.
    independentArgon2Reference: hex(derived.root) === 'adc50138bc654242c87e374011a4c26cb711c4026386ef52c6f104294f7e6e3b',
    frozenEncryptionChild: hex(derived.encryptionBytes) === '682938eea4a91099fc270cb35bbfa8a398d9aeb85c677a734a934b7f6d9958a0',
    frozenPlacementChild: hex(derived.placementBytes) === '5c65e3bc7613b2cebd56c0a65752f216e03226dc0adcfc0ac2a9d77981a2f2ee',
    frozenCtrPrefix: hex(new Uint8Array(stream.buffer, 0, 32)) === '798ce672fa7ec18ceeece9fd72348c315931c0906d6a8baa7a36c60bbe7f5f75',
    encryptionHkdf: equal(derived.encryptionBytes, await expand('encryption')),
    placementHkdf: equal(derived.placementBytes, await expand('placement')),
    separatedChildren: !equal(derived.encryptionBytes, derived.placementBytes),
    splitStreamMatches: equal(one, split), referenceMatches: equal(one, reference),
    unique: new Set(one).size === demand, excludesSalt: one.every(group => !reserved.has(group)),
    bounded: a.diagnostics().draws <= 2 * demand + 1024 && a.diagnostics().peakEntries <= demand
  };
  return { passwordUtf8: hex(passwordBytes(password)), salt: hex(salt), root: hex(derived.root), encryption: hex(derived.encryptionBytes), placement: hex(derived.placementBytes), firstPositions: Array.from(one.subarray(0, 32)), diagnostics: a.diagnostics(), checks, passed: Object.values(checks).every(Boolean) };
}
if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('/key-chain.mjs')) {
  const result = await keyChainObservations();
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
}

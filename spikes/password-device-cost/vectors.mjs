// Every input and key emitted by this module is PUBLIC, fixed, non-secret test data.
// runVectors is deliberately separate from measurement: reference KDFs are expensive.
import { PROFILES, passwordBytes, validateRequest, derive, positions, streamBytes, sampleWords } from './core.mjs';

const utf8 = value => new TextEncoder().encode(value);
const hex = bytes => Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
const unhex = value => {
  if (!/^(?:[0-9a-f]{2})*$/.test(value)) throw new Error('Malformed reference hex');
  return Uint8Array.from(value.match(/../g) ?? [], x => parseInt(x, 16));
};
const salt = Uint8Array.from({ length: 16 }, (_, i) => i);
const password = ' Obscr café e\u0301 🔐 ';
const request = (overrides = {}) => ({ profileId: 'p600k', password, salt, width: 64, height: 64, demand: 24, ...overrides });

// Deliberately dense, independent specification implementation for small public pools.
// It does not import the production sampler or share its sparse-map bookkeeping.
function referenceSample(N, demand, bytes, maxDraws = 2 * demand + 1024) {
  const pool = Array.from({ length: N }, (_, i) => i);
  const result = [], trace = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let draws = 0, rejections = 0;
  while (result.length < demand) {
    if (draws >= maxDraws || draws * 4 + 4 > bytes.length) throw new RangeError('Reference exhausted');
    const word = view.getUint32(draws++ * 4, true);
    const bound = pool.length;
    const limit = 2 ** 32 - (2 ** 32 % bound);
    const accepted = word < limit;
    const entry = { draw: draws, word, bound, limit, accepted };
    if (accepted) {
      const index = word % bound;
      const selected = pool[index];
      pool[index] = pool[pool.length - 1];
      pool.pop();
      result.push(selected);
      Object.assign(entry, { index, position: selected });
    } else rejections++;
    trace.push(entry);
  }
  return { positions: result, draws, rejections, trace };
}

export async function runVectors() {
  const checks = [], chains = [];
  const check = (name, pass, evidence = {}) => {
    checks.push({ name, pass: Boolean(pass), ...evidence });
    if (!pass) throw new Error(`Vector failed: ${name}`);
  };
  const equal = (name, actual, expected, evidence) => check(name, hex(actual) === hex(expected), evidence);
  const rejects = async (name, action) => {
    let rejected = false;
    try { await action(); } catch { rejected = true; }
    check(name, rejected);
  };
  const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);
  // A variable import leaves Node built-ins out of browser bundles.
  const nodeModule = 'node:crypto';
  const node = isNode ? await import(nodeModule) : null;
  const { argon2idAsync } = await import('@noble/hashes/argon2.js');
  const { scryptAsync } = await import('@noble/hashes/scrypt.js');
  const { hkdf } = await import('@noble/hashes/hkdf.js');
  const { pbkdf2Async } = await import('@noble/hashes/pbkdf2.js');
  const { sha256 } = await import('@noble/hashes/sha2.js');
  const nodeScrypt = (bytes, inputSalt, options, length = 32) => new Promise((resolve, reject) => {
    node.scrypt(bytes, inputSalt, length, options, (error, key) => error ? reject(error) : resolve(key));
  });
  const nodePbkdf = (bytes, inputSalt, iterations) => new Promise((resolve, reject) => {
    node.pbkdf2(bytes, inputSalt, iterations, 32, 'sha256', (error, key) => error ? reject(error) : resolve(key));
  });
  const nativeHkdf = async (ikm, inputSalt, info, length) => {
    const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: inputSalt, info }, key, length * 8));
  };
  const nodeStream = (key, counter, length) => {
    const cipher = node.createCipheriv('aes-256-ctr', key, counter);
    const first = cipher.update(new Uint8Array(length));
    const last = cipher.final();
    return new Uint8Array([...first, ...last]);
  };

  // Published anchors test reference implementations as well as native primitives.
  const rfcIkm = new Uint8Array(22).fill(0x0b);
  const rfcSalt = unhex('000102030405060708090a0b0c');
  const rfcInfo = unhex('f0f1f2f3f4f5f6f7f8f9');
  const rfcOkm = unhex('3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865');
  equal('RFC5869 A.1 native HKDF', await nativeHkdf(rfcIkm, rfcSalt, rfcInfo, 42), rfcOkm);
  equal('RFC5869 A.1 Noble HKDF', hkdf(sha256, rfcIkm, rfcSalt, rfcInfo, 42), rfcOkm);
  const rfcScrypt = unhex('77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906');
  equal('RFC7914 section 12 Noble scrypt', await scryptAsync(new Uint8Array(), new Uint8Array(), { N: 16, r: 1, p: 1, dkLen: 64 }), rfcScrypt);
  if (node) equal('RFC7914 section 12 Node scrypt', await nodeScrypt(new Uint8Array(), new Uint8Array(), { N: 16, r: 1, p: 1 }, 64), rfcScrypt);
  equal('RFC9106 section 5.3 Noble Argon2id', await argon2idAsync(new Uint8Array(32).fill(1), new Uint8Array(16).fill(2), {
    m: 32, t: 3, p: 4, version: 19, dkLen: 32, key: new Uint8Array(8).fill(3), personalization: new Uint8Array(12).fill(4),
  }), unhex('0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659'));
  const nistKey = unhex('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4');
  const nistCounter = unhex('f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff');
  const nistPlain = unhex([
    '6bc1bee22e409f96e93d7e117393172a', 'ae2d8a571e03ac9c9eb76fac45af8e51',
    '30c81c46a35ce411e5fbc1191a0a52ef', 'f69f2445df4f9b17ad2b417be66c3710',
  ].join(''));
  const nistCipher = unhex('601ec313775789a5b7a7f504bbf3d228f443e3ca4d62b59aca84e990cacaf5c52b0930daa23de94ce87017ba2d84988ddfc9c58db67aada613c2dd08457941a6');
  const nistExpectedStream = nistPlain.map((byte, i) => byte ^ nistCipher[i]);
  equal('NIST SP800-38A F.5.5 AES256 CTR', await streamBytes(nistKey, 64, { counter: nistCounter, chunkBytes: 17 }), nistExpectedStream);
  if (node) equal('NIST SP800-38A Node CTR', nodeStream(nistKey, nistCounter, 64), nistExpectedStream);

  equal('Exact composed Unicode bytes', passwordBytes(password), unhex('204f6273637220636166c3a92065cc8120f09f949020'));
  check('No Unicode normalization', hex(passwordBytes('é')) !== hex(passwordBytes('e\u0301')));
  check('No trimming or case conversion', hex(passwordBytes(' A ')) === '204120');
  check('1024 UTF8 bytes accepted', passwordBytes('é'.repeat(512)).length === 1024);
  for (const [name, input] of [['empty', ''], ['high surrogate', '\ud800'], ['low surrogate', '\udc00'], ['interior surrogate', 'x\ud800y'], ['byte limit', 'é'.repeat(513)], ['unit limit', 'a'.repeat(1025)]]) {
    await rejects(`Password rejects ${name}`, () => passwordBytes(input));
  }
  const invalidRequests = [
    ['unknown profile', { profileId: 'unknown' }], ['short salt', { salt: new Uint8Array(15) }],
    ['non-byte salt', { salt: Array(16).fill(0) }], ['width limit', { width: 4097 }],
    ['height limit', { height: 4097 }], ['fractional dimension', { width: 64.5 }],
    ['empty eligible pool', { width: 1, height: 1 }], ['negative demand', { demand: -1 }],
    ['demand above pool', { demand: 8193 }], ['payload limit', { width: 4096, height: 4096, demand: 1048577 }],
    ['draw limit', { maxDraws: 2098177 }], ['fractional draw limit', { maxDraws: 1.5 }],
  ];
  for (const [name, overrides] of invalidRequests) await rejects(`Request rejects ${name}`, () => validateRequest(request(overrides)));
  check('Reserved bootstrap excluded from eligible count', validateRequest(request()).N === 8192);
  check('Default draw ceiling', validateRequest(request({ demand: 24 })).maxDraws === 1072);
  check('Maximum image and demand accepted', validateRequest(request({ width: 4096, height: 4096, demand: 1048576 })).maxDraws === 2098176);

  // Each candidate gets a complete fixed-input chain plus independent references.
  for (const profile of PROFILES) {
    const validated = validateRequest(request({ profileId: profile.id }));
    const keys = await derive(validated);
    let referenceRoot, rootReference;
    if (profile.algorithm === 'argon2id') {
      referenceRoot = await argon2idAsync(validated.bytes, salt, { m: profile.memoryMiB * 1024, t: profile.passes, p: 1, version: 19, dkLen: 32, maxmem: 256 * 1024 * 1024 });
      rootReference = 'Noble Argon2id (independent of Sodium)';
    } else if (profile.algorithm === 'scrypt') {
      if (node) {
        referenceRoot = await nodeScrypt(validated.bytes, salt, { N: profile.N, r: profile.r, p: profile.p, maxmem: 256 * 1024 * 1024 });
        rootReference = 'Node crypto.scrypt (independent of Noble)';
      }
    } else {
      referenceRoot = node ? await nodePbkdf(validated.bytes, salt, profile.iterations)
        : await pbkdf2Async(sha256, validated.bytes, salt, { c: profile.iterations, dkLen: 32 });
      rootReference = node ? 'Node crypto.pbkdf2 API' : 'Noble PBKDF2 (independent of native WebCrypto)';
    }
    if (referenceRoot) equal(`${profile.id} independent root`, keys.root, referenceRoot, { reference: rootReference });
    for (const label of ['encryption', 'placement']) {
      const info = utf8(`obscr/keys/1/${label}`);
      equal(`${profile.id} ${label} Noble HKDF`, keys[label], hkdf(sha256, keys.root, new Uint8Array(32), info, 32));
      if (node) equal(`${profile.id} ${label} Node HKDF`, keys[label], new Uint8Array(node.hkdfSync('sha256', keys.root, new Uint8Array(32), info, 32)));
    }
    check(`${profile.id} domain separation`, hex(keys.encryption) !== hex(keys.placement));
    const stream = await streamBytes(keys.placement, validated.maxDraws * 4);
    if (node) equal(`${profile.id} independent CTR`, stream, nodeStream(keys.placement, new Uint8Array(16), stream.length));
    const reference = referenceSample(validated.N, validated.demand, stream, validated.maxDraws);
    const selected = await positions(keys.placement, validated.N, validated.demand);
    check(`${profile.id} dense sampler agreement`, JSON.stringify(Array.from(selected.positions)) === JSON.stringify(reference.positions) && selected.draws === reference.draws && selected.rejections === reference.rejections);
    chains.push({ profileId: profile.id, profile, password, passwordHex: hex(validated.bytes), saltHex: hex(salt), width: validated.width, height: validated.height, N: validated.N, demand: validated.demand,
      rootHex: hex(keys.root), encryptionHex: hex(keys.encryption), placementHex: hex(keys.placement), streamHex: hex(stream.subarray(0, 128)), positions: Array.from(selected.positions), draws: selected.draws, rejections: selected.rejections, trace: reference.trace,
      rootReference: rootReference ?? 'Node-only reference unavailable in this browser; compare with Node chain',
    });
  }

  const key = nistKey;
  const baseline = await streamBytes(key, 8207);
  for (const chunkBytes of [1, 3, 4, 15, 16, 17, 63, 4095, 4096, 4097]) {
    equal(`Stream chunk independence ${chunkBytes}`, await streamBytes(key, baseline.length, { chunkBytes }), baseline);
    const actual = await positions(key, 37, 37, { chunkBytes });
    const expected = referenceSample(37, 37, baseline);
    check(`Sampler chunk independence ${chunkBytes}`, JSON.stringify(Array.from(actual.positions)) === JSON.stringify(expected.positions));
    check(`Full domain uniqueness ${chunkBytes}`, new Set(actual.positions).size === 37 && actual.positions.every(x => x < 37));
  }
  const carryCounter = unhex('0000000000000000ffffffffffffffff');
  const carry = await streamBytes(key, 48, { counter: carryCounter, chunkBytes: 1 });
  equal('Counter carry chunk independence', carry, await streamBytes(key, 48, { counter: carryCounter, chunkBytes: 48 }));
  if (node) equal('Full 128-bit counter carry Node reference', carry, nodeStream(key, carryCounter, 48));
  const finalCounter = new Uint8Array(16).fill(255);
  check('Final counter block allowed', (await streamBytes(key, 16, { counter: finalCounter, chunkBytes: 1 })).length === 16);
  await rejects('Counter wrap rejected before output', () => streamBytes(key, 17, { counter: finalCounter }));
  await rejects('Invalid chunk rejected', () => streamBytes(key, 1, { chunkBytes: 0 }));
  await rejects('Short placement key rejected', () => positions(new Uint8Array(31), 1, 1));
  const forcedWords = [0xffffffff, 1, 0xffffffff, 0];
  const forced = sampleWords(3, 3, forcedWords);
  check('Forced rejection and swap order', JSON.stringify(Array.from(forced.positions)) === '[1,2,0]' && forced.draws === 4 && forced.rejections === 1);
  const single = sampleWords(1, 1, [0xffffffff]);
  check('One-element pool consumes one draw', single.positions[0] === 0 && single.draws === 1);
  check('Zero demand consumes no words', sampleWords(1, 0, [], { maxDraws: 0 }).draws === 0);
  check('Full 2^32 domain sentinel', sampleWords(2 ** 32, 1, [0xffffffff]).positions[0] === 0xffffffff);
  check('Zero demand stream consumes no draws', (await positions(key, 1, 0, { maxDraws: 0 })).draws === 0);
  for (const [name, action] of [
    ['zero pool', () => sampleWords(0, 0, [])], ['oversize pool', () => sampleWords(2 ** 32 + 1, 1, [0])],
    ['demand above pool', () => sampleWords(1, 2, [0, 0])], ['oversize payload', () => sampleWords(2 ** 32, 1048577, [])],
    ['oversize draw limit', () => sampleWords(3, 1, [0], { maxDraws: 2098177 })], ['invalid word', () => sampleWords(3, 1, [-1])],
    ['exhausted words', () => sampleWords(3, 1, [])], ['forced rejection limit', () => sampleWords(3, 1, [0xffffffff, 0], { maxDraws: 1 })],
    ['native draw exhaustion', () => positions(key, 37, 37, { maxDraws: 1 })],
  ]) await rejects(`Sampler rejects ${name}`, action);

  const changedSalt = salt.slice(); changedSalt[15] ^= 1;
  const changed = await derive(validateRequest(request({ salt: changedSalt })));
  const base = chains.find(chain => chain.profileId === 'p600k');
  check('Changed salt changes root and child keys', hex(changed.root) !== base.rootHex && hex(changed.encryption) !== base.encryptionHex && hex(changed.placement) !== base.placementHex);
  const changedStream = await streamBytes(changed.placement, 128);
  check('Changed salt changes stream', hex(changedStream) !== base.streamHex);
  const changedPositions = await positions(changed.placement, base.N, base.demand);
  check('Changed salt changes positions', JSON.stringify(Array.from(changedPositions.positions)) !== JSON.stringify(base.positions));
  chains.push({ profileId: 'p600k', case: 'changed-salt', password, passwordHex: hex(passwordBytes(password)), saltHex: hex(changedSalt), rootHex: hex(changed.root), encryptionHex: hex(changed.encryption), placementHex: hex(changed.placement), streamHex: hex(changedStream), N: base.N, demand: base.demand, positions: Array.from(changedPositions.positions), draws: changedPositions.draws, rejections: changedPositions.rejections });

  // These are API contract negatives, not an implemented image-format exchange.
  const encryptionKey = await crypto.subtle.importKey('raw', unhex(base.encryptionHex), 'AES-GCM', false, ['encrypt', 'decrypt']);
  const iv = new Uint8Array(12);
  const aad = utf8('PUBLIC experiment metadata');
  const plaintext = utf8('PUBLIC vector payload');
  const gcm = { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 };
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(gcm, encryptionKey, plaintext));
  equal('GCM fixed vector roundtrip', new Uint8Array(await crypto.subtle.decrypt(gcm, encryptionKey, ciphertext)), plaintext);
  await rejects('GCM altered metadata', () => crypto.subtle.decrypt({ ...gcm, additionalData: utf8('altered metadata') }, encryptionKey, ciphertext));
  await rejects('GCM shortened tag', () => crypto.subtle.decrypt(gcm, encryptionKey, ciphertext.subarray(0, ciphertext.length - 1)));
  const wrong = await derive(validateRequest(request({ password: password + 'wrong' })));
  const wrongKey = await crypto.subtle.importKey('raw', wrong.encryption, 'AES-GCM', false, ['decrypt']);
  await rejects('GCM wrong password', () => crypto.subtle.decrypt(gcm, wrongKey, ciphertext));
  return {
    publicNonSecret: true, checks, chains,
    forced: { N: 3, demand: 3, words: forcedWords, positions: Array.from(forced.positions), draws: forced.draws, rejections: forced.rejections },
    counterCarry: { keyHex: hex(key), counterHex: hex(carryCounter), streamHex: hex(carry) },
    gcm: { ivHex: hex(iv), aadHex: hex(aad), plaintextHex: hex(plaintext), ciphertextAndTagHex: hex(ciphertext) },
    sources: ['https://www.rfc-editor.org/rfc/rfc5869#appendix-A.1', 'https://www.rfc-editor.org/rfc/rfc7914#section-12', 'https://www.rfc-editor.org/rfc/rfc9106#section-5.3', 'https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf'],
    limits: [
      'Composed outputs use fixed public inputs and are emitted at execution; no previously recorded composed known answers are embedded.',
      'Node PBKDF2/HKDF and WebCrypto can share an OpenSSL backend; Noble HKDF and browser PBKDF2 provide separate implementations.',
      ...(node ? [] : ['Independent scrypt and AES-CTR API comparisons require the Node run; browser runs include published primitive anchors.']),
      'Bootstrap check covers reserved-count arithmetic only, not a carrier mapping or image format.',
      'GCM checks cover native API behavior, not metadata serialization, a parser, or real CLI/browser image exchange.',
      'These checks are correctness evidence, not performance measurements, an audit, or a supported-device claim.',
    ],
  };
}

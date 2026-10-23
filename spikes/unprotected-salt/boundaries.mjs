// Disposable observations for https://github.com/jdragulanescu/obscr/issues/31.
// Run: node boundaries.mjs. These compute outcomes, not permanent test fixtures.
import { encode, decode, profiles, capacity, PASSWORD, readSaltCode } from './codec.mjs';
import { deriveKeys, passwordBytes, createPlacement, MAX_POSITIONS } from './key-chain.mjs';
import { rsEncode } from './rs.mjs';
const utf8 = new TextEncoder();
const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const concat = parts => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let at = 0; for (const p of parts) { out.set(p, at); at += p.length; } return out; };
function insert(rgb, bytes, positions) {
  if (bytes.length > positions.length) throw new RangeError('Observation exceeds available positions');
  for (let i = 0; i < bytes.length; i++) for (let bit = 0; bit < 8; bit++) {
    const at = positions[i][bit]; rgb[at] = (rgb[at] & 254) | ((bytes[i] >>> (7 - bit)) & 1);
  }
}
function payloadCode(bytes, profile) {
  if (!profile.parity) return bytes;
  const blocks = [];
  for (let i = 0; i < bytes.length; i += 223) blocks.push(rsEncode(bytes.subarray(i, i + 223), 32));
  return concat(blocks);
}
function rewrite(frame, metadata, ciphertext = frame.ciphertext) {
  const rgb = frame.rgb.slice();
  insert(rgb, frame.profile.parity ? rsEncode(metadata, 64) : metadata, frame.metadataPositions);
  insert(rgb, payloadCode(ciphertext, frame.profile), frame.payloadPositions);
  return rgb;
}
function corrupt(frame, positions, count, offset = 0) {
  const rgb = frame.rgb.slice();
  for (let i = 0; i < count; i++) rgb[positions[offset + i][0]] ^= 1;
  return rgb;
}
function aad(salt, metadata, width, height) {
  const dimensions = new Uint8Array(8), view = new DataView(dimensions.buffer);
  view.setUint32(0, width, false); view.setUint32(4, height, false);
  return concat([salt, metadata, dimensions]);
}

export async function runBoundaries() {
  const observations = [];
  const record = (name, pass, evidence) => observations.push({ name, pass: Boolean(pass), ...evidence });
  const rejected = async (name, action) => {
    try { await action(); record(name, false, { rejected: false }); }
    catch (error) { record(name, true, { rejected: true, error: error.message }); }
  };
  const width = 96, height = 96;
  const cover = Uint8Array.from({ length: width * height * 3 }, (_, i) => (i * 73 + 19) & 255);
  const message = utf8.encode('  unchanged e\u0301 ≠ é / 雪 / 🐚\n\u0000end  ');
  const exact = async (name, frame, input, w = width, h = height, password = PASSWORD) => {
    const result = await decode(frame.rgb, w, h, frame.profile, password);
    record(name, result.outcome === 'exact-ready' && equal(result.message, input), { outcome: result.outcome, expectedBytes: input.length, actualBytes: result.message?.length, overhead: frame.overhead });
    return result;
  };
  const fail = async (name, rgb, profile, password = PASSWORD, w = width, h = height) => {
    const result = await decode(rgb, w, h, profile, password);
    record(name, result.outcome === 'safe-failure' && !('message' in result), { outcome: result.outcome, reason: result.reason, exposesMessage: 'message' in result });
    return result;
  };
  const frames = [];
  for (const profile of profiles) {
    const prefix = `${profile.name}:`;
    const frame = await encode(cover, width, height, message, profile, { seed: 'boundary/matched' });
    frames.push(frame);
    await exact(prefix + 'unchanged-unicode', frame, message);
    await fail(prefix + 'wrong-password', frame.rgb, profile, 'wrong-password');
    await fail(prefix + 'missing-explicit-profile', frame.rgb, undefined);
    await fail(prefix + 'wrong-explicit-profile', frame.rgb, profiles.find(p => p !== profile));
    await fail(prefix + 'salt-one-byte', corrupt(frame, frame.saltPositions, 1), profile);
    const metadata = frame.metadataCodeword.slice(0, 36);
    metadata[0] ^= 1;
    await fail(prefix + 'altered-aad-with-valid-repair', rewrite(frame, metadata), profile);
    const changedTag = frame.ciphertext.slice(); changedTag[changedTag.length - 1] ^= 1;
    await fail(prefix + 'changed-full-tag-with-valid-repair', rewrite(frame, frame.metadataCodeword.slice(0, 36), changedTag), profile);
    const shortened = frame.metadataCodeword.slice(0, 36);
    const shortView = new DataView(shortened.buffer);
    shortView.setUint32(12, frame.storedBytes - 1, false); shortView.setUint32(16, frame.plainBytes - 1, false);
    await fail(prefix + 'shortened-tag-envelope-with-valid-repair', rewrite(frame, shortened, frame.ciphertext.subarray(0, frame.ciphertext.length - 1)), profile);
    for (const field of [20, 21, 22, 23]) {
      const invalid = frame.metadataCodeword.slice(0, 36); invalid[field] = 255;
      await fail(prefix + `malformed-metadata-byte-${field}`, rewrite(frame, invalid), profile);
    }
    const huge = frame.metadataCodeword.slice(0, 36); new DataView(huge.buffer).setUint32(12, 0xffffffff, false);
    await fail(prefix + 'untrusted-length-bound', rewrite(frame, huge), profile);
    if (profile.parity) {
      const large = await encode(cover, width, height, new Uint8Array(430).fill(91), profile, { seed: 'boundary/repair' });
      for (const count of [16, 17]) {
        const rgb = corrupt(large, large.payloadPositions, count);
        if (count === 16) await exact(prefix + 'payload-16-errors', { ...large, rgb }, new Uint8Array(430).fill(91));
        else await fail(prefix + 'payload-17-errors', rgb, profile);
      }
      for (const count of [32, 33]) {
        const rgb = corrupt(large, large.metadataPositions, count);
        if (count === 32) await exact(prefix + 'header-32-errors', { ...large, rgb }, new Uint8Array(430).fill(91));
        else await fail(prefix + 'header-33-errors', rgb, profile);
      }
      // Ciphertext includes the tag: first block data223, then each edge below.
      for (const lastData of [1, 16, 31, 32, 191, 222, 223]) {
        const input = Uint8Array.from({ length: 223 + lastData - 16 }, (_, i) => i & 255);
        const edge = await encode(cover, width, height, input, profile, { seed: `boundary/last/${lastData}` });
        record(prefix + `last-block-${lastData}-shape`, edge.codewords.length === 2 && edge.codewords[0].length === 255 && edge.codewords[1].length === lastData + 32, { blockLengths: edge.codewords.map(b => b.length), padding: edge.overhead.padding });
        await exact(prefix + `last-block-${lastData}-roundtrip`, edge, input);
      }
    } else {
      await fail(prefix + 'payload-one-byte', corrupt(frame, frame.payloadPositions, 1), profile);
      await fail(prefix + 'header-one-byte', corrupt(frame, frame.metadataPositions, 1), profile);
    }
    for (const size of [0, 207]) {
      const input = new Uint8Array(size);
      const edge = await encode(cover, width, height, input, profile, { seed: `boundary/min-full/${size}` });
      await exact(prefix + `payload-${size}-roundtrip`, edge, input);
      record(prefix + `payload-${size}-shape`, edge.codedBytes === size + 16 + (profile.parity ? 32 : 0), { blockLengths: edge.codewords.map(b => b.length) });
    }
    const w = 32, h = 32, small = new Uint8Array(w * h * 3), cap = capacity(w, h, profile);
    const full = await encode(small, w, h, new Uint8Array(cap), profile, { seed: 'boundary/capacity' });
    await exact(prefix + 'capacity-exact', full, new Uint8Array(cap), w, h);
    await rejected(prefix + 'capacity-plus-one', () => encode(small, w, h, new Uint8Array(cap + 1), profile));
    record(prefix + 'operational-capacity', capacity(4096, 2976, profile) === (profile.parity ? 229132 : 262092), { maximumStoredBytes: capacity(4096, 2976, profile), keyedPositionBudget: MAX_POSITIONS });

    const input = utf8.encode('compress unchanged 🐚 '.repeat(200));
    const compressed = await encode(cover, width, height, input, profile, { seed: 'boundary/compressed', compressed: true });
    const Original = globalThis.DecompressionStream;
    let starts = 0;
    globalThis.DecompressionStream = class extends Original { constructor(format) { starts++; super(format); } };
    try {
      await exact(prefix + 'compressed-exact', compressed, input);
      record(prefix + 'authenticated-decompression-start', starts === 1, { starts });
      starts = 0;
      const damaged = compressed.ciphertext.slice(); damaged[damaged.length - 1] ^= 1;
      await fail(prefix + 'compressed-unauthenticated-repaired-code', rewrite(compressed, compressed.metadataCodeword.slice(0, 36), damaged), profile);
      record(prefix + 'unauthenticated-never-decompressed', starts === 0, { starts });
      // Produce a valid tag over compressed bytes, but understate plain length.
      const keys = await deriveKeys(compressed.saltCodeword, PASSWORD);
      const originalMetadata = compressed.metadataCodeword.slice(0, 36);
      const stored = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: originalMetadata.subarray(0, 12), additionalData: aad(compressed.saltCodeword, originalMetadata, width, height), tagLength: 128 }, keys.encryption, compressed.ciphertext));
      const boundedMetadata = originalMetadata.slice(); new DataView(boundedMetadata.buffer).setUint32(16, input.length - 1, false);
      const encrypt = async (bytes, metadata) => new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: metadata.subarray(0, 12), additionalData: aad(compressed.saltCodeword, metadata, width, height), tagLength: 128 }, keys.encryption, bytes));
      starts = 0;
      await fail(prefix + 'authenticated-decompression-over-bound', rewrite(compressed, boundedMetadata, await encrypt(stored, boundedMetadata)), profile);
      record(prefix + 'over-bound-authenticated-before-decompress', starts === 1, { starts });
      starts = 0;
      const malformed = stored.slice(); malformed[0] ^= 0xff;
      await fail(prefix + 'authenticated-invalid-gzip', rewrite(compressed, originalMetadata, await encrypt(malformed, originalMetadata)), profile);
      record(prefix + 'invalid-gzip-authenticated-before-decompress', starts === 1, { starts });
    } finally { globalThis.DecompressionStream = Original; }
  }
  record('matched-fixture-salt', equal(readSaltCode(frames[0].rgb, width, height), readSaltCode(frames[1].rgb, width, height)), { saltBytes: frames[0].saltCodeword.length, headerBytes: frames.map(frame => frame.metadataCodeword.length) });
  record('matched-fixture-nonce', equal(frames[0].metadataCodeword.subarray(0, 12), frames[1].metadataCodeword.subarray(0, 12)), {});
  record('matched-header-placement-prefix', frames[0].metadataPositions.every((p, i) => equal(p, frames[1].metadataPositions[i])), {});
  const randomA = await encode(cover, width, height, message, profiles[0]);
  const randomB = await encode(cover, width, height, message, profiles[0]);
  record('default-fresh-salt-and-nonce', !equal(randomA.saltCodeword, randomB.saltCodeword) && !equal(randomA.metadataCodeword.subarray(0, 12), randomB.metadataCodeword.subarray(0, 12)), {});
  const boundaryPassword = '🐚'.repeat(256);
  const passwordFrame = await encode(cover, width, height, message, profiles[0], { password: boundaryPassword, seed: 'boundary/password' });
  await exact('password-1024-utf8-bytes', passwordFrame, message, width, height, boundaryPassword);
  for (const [name, password] of [['empty', ''], ['1025-ascii', 'x'.repeat(1025)], ['1025-utf8', boundaryPassword + 'x'], ['high-surrogate', '\ud800'], ['low-surrogate', '\udc00'], ['non-string', 5]]) {
    await rejected(`password-${name}-primitive`, () => passwordBytes(password));
    await fail(`password-${name}-decode`, frames[0].rgb, profiles[0], password);
  }
  record('password-no-normalization-or-trim', !equal(passwordBytes('e\u0301'), passwordBytes('é')) && !equal(passwordBytes(' x '), passwordBytes('x')), {});
  for (const [w, h] of [[0, 96], [-1, 96], [1.5, 96], [4097, 1], [1, 4097], [4096, 2977], [NaN, 96], [Infinity, 1]]) {
    await rejected(`geometry-${w}x${h}`, () => capacity(w, h, profiles[0]));
  }
  await fail('malformed-rgb-type', Array.from(cover), profiles[0]);
  await fail('malformed-rgb-length', cover.subarray(1), profiles[0]);
  await fail('too-small-envelope', new Uint8Array(3), profiles[0], PASSWORD, 1, 1);
  await rejected('message-type', () => encode(cover, width, height, 'not bytes', profiles[0]));
  await rejected('message-plain-bound', () => encode(cover, width, height, new Uint8Array(1048577), profiles[0]));
  await rejected('compression-type', () => encode(cover, width, height, message, profiles[0], { compressed: 1 }));
  await rejected('seed-type', () => encode(cover, width, height, message, profiles[0], { seed: 1 }));
  const keys = await deriveKeys(new Uint8Array(16), PASSWORD);
  await rejected('sampler-demand-bound', () => createPlacement(1000000, keys.placement).take(MAX_POSITIONS + 1));
  await rejected('sampler-domain-bound', () => createPlacement(5000000, keys.placement));
  await rejected('sampler-exhausted-domain', () => createPlacement(32, keys.placement).take(17));
  const reasons = new Set(observations.filter(o => o.outcome === 'safe-failure').map(o => o.reason));
  record('one-safe-failure-reason', reasons.size === 1, { reasons: [...reasons] });
  return { passed: observations.every(o => o.pass), count: observations.length, observations };
}
if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('/boundaries.mjs')) {
  const result = await runBoundaries();
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
}

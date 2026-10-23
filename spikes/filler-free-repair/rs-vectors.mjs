// Independent polynomial reference experiment for https://github.com/jdragulanescu/obscr/issues/28.
// No ZXing arithmetic is used by referenceEncode. Nothing runs on module import.
import { rsEncode, rsDecode } from './rs.mjs';

// Carryless multiply with bitwise reduction, not the vendor's logarithm tables.
function multiply(a, b) {
  let product = 0;
  while (b) {
    if (b & 1) product ^= a;
    b >>>= 1;
    a <<= 1;
    if (a & 0x100) a ^= 0x11d;
  }
  return product;
}

// Coefficients are ascending here, the reverse of ZXing's representation.
// g(x) = product(i=0..parity-1) (x + alpha^i), alpha=2, GF(256), base=0.
export function referenceEncode(data, parity) {
  let generator = Uint8Array.of(1);
  let root = 1;
  for (let i = 0; i < parity; i++) {
    const next = new Uint8Array(generator.length + 1);
    for (let j = 0; j < generator.length; j++) {
      next[j] ^= multiply(generator[j], root);
      next[j + 1] ^= generator[j];
    }
    generator = next;
    root = multiply(root, 2);
  }
  const remainder = new Uint8Array(data.length + parity);
  for (let i = 0; i < data.length; i++) remainder[remainder.length - 1 - i] = data[i];
  for (let degree = remainder.length - 1; degree >= parity; degree--) {
    const leading = remainder[degree];
    for (let j = 0; j <= parity; j++) {
      remainder[degree - parity + j] ^= multiply(leading, generator[j]);
    }
  }
  const encoded = new Uint8Array(remainder.length);
  encoded.set(data);
  for (let i = 0; i < parity; i++) encoded[data.length + i] = remainder[parity - 1 - i];
  return encoded;
}

function equal(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hex(bytes) {
  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
}

// Independent direct evaluation. Zero is code membership, not authenticity.
function syndromes(code, parity) {
  const values = [];
  let root = 1;
  for (let i = 0; i < parity; i++) {
    let sum = 0;
    for (const byte of code) sum = multiply(sum, root) ^ byte;
    values.push(sum);
    root = multiply(root, 2);
  }
  return values;
}

function corrupt(code, count, placement) {
  const out = code.slice();
  const positions = [];
  for (let i = 0; i < count; i++) {
    const position = placement === 'front' ? i
      : placement === 'back' ? code.length - 1 - i
      : Math.floor(i * code.length / count);
    out[position] ^= 1 + ((i * 73 + count * 19) % 255);
    positions.push(position);
  }
  return { out, positions };
}

export function runRsChecks() {
  assert(multiply(0x80, 2) === 0x1d, 'Reference field reduction differs from 0x11d');
  const vectors = [];
  const boundaries = [];
  const beyondRadiusAmbiguity = [];
  for (const parity of [16, 32, 64]) {
    const k = 255 - parity;
    const radius = parity / 2;
    for (const length of [1, 2, 16, 36, k - 1, k]) {
      const data = Uint8Array.from({ length }, (_, i) => (i * 149 + length * 11 + parity) & 255);
      const reference = referenceEncode(data, parity);
      const actual = rsEncode(data, parity);
      assert(equal(actual, reference), `Independent encode mismatch: parity=${parity}, length=${length}`);
      assert(syndromes(actual, parity).every(value => value === 0), 'Reference syndrome is not zero');
      assert(equal(rsDecode(reference, parity), data), 'Clean reference decode mismatch');
      const padded = new Uint8Array(k);
      padded.set(data, k - length);
      assert(equal(referenceEncode(padded, parity).subarray(k - length), actual), 'Reference shortening mismatch');
      assert(equal(rsEncode(padded, parity).subarray(k - length), actual), 'ZXing shortening mismatch');
      vectors.push({ parity, length, shortened: length < k, dataHex: hex(data), codeHex: hex(reference), independentMatch: true, shorteningMatch: true });
      for (const errors of [1, radius - 1, radius, radius + 1]) {
        for (const placement of ['front', 'back', 'spread']) {
          const { out, positions } = corrupt(reference, errors, placement);
          let outcome;
          let reason;
          try {
            outcome = equal(rsDecode(out, parity), data) ? 'exact' : 'miscorrected';
          } catch (error) {
            outcome = 'rejected';
            reason = error.message;
          }
          if (errors <= radius) assert(outcome === 'exact', `Within-radius decode failed: parity=${parity}, length=${length}, errors=${errors}, placement=${placement}`);
          boundaries.push({ parity, length, errors, radius, placement, positions, outcome, ...(reason ? { reason } : {}) });
        }
      }

      // Construct a received word t+1 from A and t from B. A and B differ in
      // exactly parity+1 positions. The bounded decoder must choose B, proving
      // why beyond-radius rejection is impossible without full-message AEAD.
      const a = new Uint8Array(length);
      const b = a.slice();
      b[length - 1] = 1;
      const codeA = referenceEncode(a, parity);
      const codeB = referenceEncode(b, parity);
      const different = [];
      for (let i = 0; i < codeA.length; i++) if (codeA[i] !== codeB[i]) different.push(i);
      assert(different.length === parity + 1, 'Minimum-distance construction failed');
      const received = codeA.slice();
      for (const position of different.slice(0, radius + 1)) received[position] = codeB[position];
      const decoded = rsDecode(received, parity);
      assert(equal(decoded, b) && !equal(decoded, a), 'Beyond-radius nearest-codeword construction failed');
      beyondRadiusAmbiguity.push({ parity, length, errorsFromOriginal: radius + 1, errorsFromOtherCodeword: radius, outcome: 'miscorrected', needsAuthentication: true });
    }
  }
  const inputBounds = [];
  for (const [label, operation] of [
    ['empty data', () => rsEncode(new Uint8Array(), 16)],
    ['oversized data', () => rsEncode(new Uint8Array(240), 16)],
    ['empty code', () => rsDecode(new Uint8Array(), 16)],
    ['no data in code', () => rsDecode(new Uint8Array(16), 16)],
    ['oversized code', () => rsDecode(new Uint8Array(256), 16)],
    ['unsupported parity', () => rsEncode(Uint8Array.of(1), 17)],
    ['wrong data type', () => rsEncode([1], 16)],
  ]) {
    let rejected = false;
    try { operation(); } catch { rejected = true; }
    assert(rejected, `Input bound not enforced: ${label}`);
    inputBounds.push({ label, rejected });
  }
  return {
    field: { size: 256, primitive: '0x11d', alpha: 2, generatorBase: 0 },
    reference: 'Independent carryless GF multiplication, ascending polynomial multiplication, and long division; not ZXing-generated expected values',
    scope: 'Deterministic experiment cases, not an exhaustive error-pattern proof or authenticated message recovery',
    vectors, boundaries, beyondRadiusAmbiguity, inputBounds,
  };
}

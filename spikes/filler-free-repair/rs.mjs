// Throwaway unknown-byte repair experiment for https://github.com/jdragulanescu/obscr/issues/28.
// Controls: parity 16/32/64, 1..255-parity data bytes; run rsChecks() for evidence.
import GenericGF from './vendor/GenericGF.mjs';
import GenericGFPoly from './vendor/GenericGFPoly.mjs';
import ReedSolomonEncoder from './vendor/ReedSolomonEncoder.mjs';
import ReedSolomonDecoder from './vendor/ReedSolomonDecoder.mjs';

const field = new GenericGF(0x11d, 256, 0);
const encoder = new ReedSolomonEncoder(field);
const decoder = new ReedSolomonDecoder(field);

function check(bytes, parity, encoded) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('RS requires Uint8Array');
  if (![16, 32, 64].includes(parity)) throw new RangeError('RS parity must be 16, 32, or 64');
  const dataLength = bytes.length - (encoded ? parity : 0);
  if (dataLength < 1 || dataLength > 255 - parity) throw new RangeError('RS block length is out of bounds');
}

// Systematic shortened encoding: data bytes followed by parity, no transmitted zero padding.
export function rsEncode(data, parity) {
  check(data, parity, false);
  const code = new Int32Array(data.length + parity);
  code.set(data);
  encoder.encode(code, parity);
  return Uint8Array.from(code);
}

// Unknown-error correction, not erasure reconstruction. Does not mutate the input.
// Beyond parity/2 errors, a different valid message can be returned: authenticate afterward.
export function rsDecode(code, parity) {
  check(code, parity, true);
  const corrected = Int32Array.from(code);
  const count = decoder.decodeWithECCount(corrected, parity);
  if (count > parity / 2) throw new Error('RS correction radius exceeded');
  if (count !== 0) {
    const poly = new GenericGFPoly(field, corrected);
    for (let i = 0; i < parity; i++) {
      if (poly.evaluateAt(field.exp(i)) !== 0) throw new Error('RS residual syndrome');
    }
  }
  return Uint8Array.from(corrected.subarray(0, corrected.length - parity));
}

export async function rsChecks() {
  const { runRsChecks } = await import('./rs-vectors.mjs');
  return runRsChecks();
}

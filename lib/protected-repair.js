/*
 * Copyright 2007 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Modified for Obscr: minimal private GF(256) repair and encoding port of
 * zxing-js/library 0.23.0, commit 1722d0744fb5e8b47aebfbeb2b648e17c95e8595,
 * recovered from Obscr commit 8fcb9d98753bb023230b263ae6c40340ea32c57d,
 * spikes/adaptive-codec/reference/vendor/{GenericGF,GenericGFPoly,
 * AbstractGenericGF,ReedSolomonDecoder}.mjs and ../rs.mjs.
 * Authors: Sean Owen, David Olivier, William Rucklidge, sanfordsquires.
 * Polynomial and decoder code is based on William Rucklidge's C++ code.
 * Changes: fixed field/parity, merged dependency closure, byte arrays,
 * nonzero-only log table, explicit allocation/iteration/correction bounds,
 * residual checks, fixed systematic encoding, and removal of unused generic methods.
 * See protected-repair.LICENSE and protected-repair.NOTICE.
 */

const PARITY = 16;
const MAX_ERRORS = 8;

// Index log by value - 1 so neither table requires 256 entries.
const exp = new Uint8Array(255);
const log = new Uint8Array(255);
let fieldValue = 1;
for (let i = 0; i < 255; i++) {
    exp[i] = fieldValue;
    log[fieldValue - 1] = i;
    fieldValue <<= 1;
    if (fieldValue >= 256) fieldValue ^= 0x11d;
}

function multiply(a, b) {
    return a === 0 || b === 0 ? 0 : exp[(log[a - 1] + log[b - 1]) % 255];
}

function inverse(a) {
    if (a === 0) throw new Error('RS inverse of zero');
    return exp[(255 - log[a - 1]) % 255];
}

function allocate(length) {
    if (!Number.isInteger(length) || length < 1 || length > 255) {
        throw new RangeError('RS allocation out of bounds');
    }
    return new Uint8Array(length);
}

// Coefficients are highest degree first. Views remove leading zeros without
// copying; arithmetic always produces a new array and never mutates a Poly.
class Poly {
    constructor(coefficients) {
        let first = 0;
        while (first < coefficients.length - 1 && coefficients[first] === 0) first++;
        this.coefficients = coefficients.subarray(first);
    }

    get degree() { return this.coefficients.length - 1; }
    get isZero() { return this.coefficients[0] === 0; }
    coefficient(degree) { return this.coefficients[this.degree - degree]; }

    evaluateAt(a) {
        if (a === 0) return this.coefficient(0);
        let result = this.coefficients[0];
        for (let i = 1; i < this.coefficients.length; i++) {
            result = multiply(a, result) ^ this.coefficients[i];
        }
        return result;
    }

    add(other) {
        if (this.isZero) return other;
        if (other.isZero) return this;
        let smaller = this.coefficients;
        let larger = other.coefficients;
        if (smaller.length > larger.length) [smaller, larger] = [larger, smaller];
        const sum = allocate(larger.length);
        sum.set(larger);
        const offset = larger.length - smaller.length;
        for (let i = 0; i < smaller.length; i++) sum[offset + i] ^= smaller[i];
        return new Poly(sum);
    }

    multiply(other) {
        if (this.isZero || other.isZero) return ZERO;
        const a = this.coefficients;
        const b = other.coefficients;
        const product = allocate(a.length + b.length - 1);
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b.length; j++) product[i + j] ^= multiply(a[i], b[j]);
        }
        return new Poly(product);
    }

    scale(scalar) {
        if (scalar === 0) return ZERO;
        if (scalar === 1) return this;
        return this.multiplyByMonomial(0, scalar);
    }

    multiplyByMonomial(degree, coefficient) {
        if (coefficient === 0) return ZERO;
        const product = allocate(this.coefficients.length + degree);
        for (let i = 0; i < this.coefficients.length; i++) {
            product[i] = multiply(this.coefficients[i], coefficient);
        }
        return new Poly(product);
    }
}

const ZERO = new Poly(Uint8Array.of(0));
const ONE = new Poly(Uint8Array.of(1));

function monomial(degree, coefficient) {
    if (coefficient === 0) return ZERO;
    const coefficients = allocate(degree + 1);
    coefficients[0] = coefficient;
    return new Poly(coefficients);
}

function dividePolynomials(dividend, divisor) {
    let remainder = dividend;
    let quotient = ZERO;
    const leadingInverse = inverse(divisor.coefficient(divisor.degree));
    let divisions = 0;
    while (remainder.degree >= divisor.degree && !remainder.isZero) {
        if (++divisions > PARITY + 1) throw new Error('RS division iteration limit');
        const previousDegree = remainder.degree;
        const degreeDiff = remainder.degree - divisor.degree;
        const scale = multiply(remainder.coefficient(remainder.degree), leadingInverse);
        quotient = quotient.add(monomial(degreeDiff, scale));
        remainder = remainder.add(divisor.multiplyByMonomial(degreeDiff, scale));
        if (!remainder.isZero && remainder.degree >= previousDegree) {
            throw new Error('RS division did not reduce degree');
        }
    }
    return { quotient, remainder };
}

function runEuclideanAlgorithm(syndrome) {
    let rLast = monomial(PARITY, 1);
    let r = syndrome;
    let tLast = ZERO;
    let t = ONE;
    let steps = 0;
    while (r.degree >= MAX_ERRORS) {
        if (++steps > PARITY) throw new Error('RS Euclidean iteration limit');
        const rLastLast = rLast;
        const tLastLast = tLast;
        rLast = r;
        tLast = t;
        if (rLast.isZero) throw new Error('RS zero remainder');
        const division = dividePolynomials(rLastLast, rLast);
        r = division.remainder;
        t = division.quotient.multiply(tLast).add(tLastLast);
        if (r.degree >= rLast.degree) throw new Error('RS division did not reduce degree');
    }
    const normalization = inverse(t.coefficient(0));
    return [t.scale(normalization), r.scale(normalization)];
}

function findErrorLocations(locator) {
    const count = locator.degree;
    if (count < 1 || count > MAX_ERRORS) throw new Error('RS correction radius exceeded');
    const locations = allocate(count);
    if (count === 1) {
        locations[0] = locator.coefficient(1);
        return locations;
    }
    let found = 0;
    for (let i = 1; i < 256 && found < count; i++) {
        if (locator.evaluateAt(i) === 0) locations[found++] = inverse(i);
    }
    if (found !== count) throw new Error('RS locator roots do not match degree');
    return locations;
}

function findErrorMagnitudes(evaluator, locations) {
    const magnitudes = allocate(locations.length);
    for (let i = 0; i < locations.length; i++) {
        const xiInverse = inverse(locations[i]);
        let denominator = 1;
        for (let j = 0; j < locations.length; j++) {
            if (i !== j) denominator = multiply(denominator, multiply(locations[j], xiInverse) ^ 1);
        }
        magnitudes[i] = multiply(evaluator.evaluateAt(xiInverse), inverse(denominator));
    }
    return magnitudes;
}

function correctErrors(received, syndromes) {
    const [locator, evaluator] = runEuclideanAlgorithm(new Poly(syndromes));
    const locations = findErrorLocations(locator);
    const magnitudes = findErrorMagnitudes(evaluator, locations);
    for (let i = 0; i < locations.length; i++) {
        if (locations[i] === 0) throw new Error('RS zero error location');
        const position = received.length - 1 - log[locations[i] - 1];
        if (position < 0 || position >= received.length) throw new Error('RS error location outside codeword');
        received[position] ^= magnitudes[i];
    }
}

/**
 * Repair one shortened systematic RS codeword without changing the input.
 * GF(256): polynomial 0x11d, primitive element 2, generator base 0,
 * roots alpha^0..alpha^15, highest coefficients first, omitted leading zeros.
 * A word beyond the correction radius can map to another valid codeword;
 * the operation MUST authenticate the repaired bytes before releasing data.
 */
export function repair(codeword) {
    if (!(codeword instanceof Uint8Array)) throw new TypeError('RS requires Uint8Array');
    if (codeword.length < 17 || codeword.length > 255) throw new RangeError('RS codeword length out of bounds');
    const received = allocate(codeword.length);
    received.set(codeword);
    const poly = new Poly(received);
    const syndromes = allocate(PARITY);
    let hasErrors = false;
    for (let i = 0; i < PARITY; i++) {
        const value = poly.evaluateAt(exp[i]);
        syndromes[PARITY - 1 - i] = value;
        if (value !== 0) hasErrors = true;
    }
    if (hasErrors) correctErrors(received, syndromes);
    // Reconstruct the polynomial: correction can change its leading zeros.
    const corrected = new Poly(received);
    for (let i = 0; i < PARITY; i++) {
        if (corrected.evaluateAt(exp[i]) !== 0) throw new Error('RS residual syndrome');
    }
    // Copy only data so the returned buffer cannot expose parity bytes.
    return received.slice(0, received.length - PARITY);
}

// Fixed highest-first generator, with roots alpha^0 through alpha^15.
const generator = (() => {
    let polynomial = ONE;
    for (let i = 0; i < PARITY; i++) {
        polynomial = polynomial.multiply(new Poly(Uint8Array.of(1, exp[i])));
    }
    return polynomial.coefficients;
})();

/** Append 16 systematic parity bytes, omitting leading zero shortening. */
export function encodeRepair(data) {
    if (!(data instanceof Uint8Array)) throw new TypeError('RS requires Uint8Array');
    if (data.length < 1 || data.length > 239) throw new RangeError('RS data length out of bounds');
    const codeword = allocate(data.length + PARITY);
    codeword.set(data);
    // Divide in place, then restore the systematic data prefix.
    for (let i = 0; i < data.length; i++) {
        const coefficient = codeword[i];
        if (coefficient !== 0) {
            for (let j = 1; j <= PARITY; j++) codeword[i + j] ^= multiply(coefficient, generator[j]);
        }
    }
    codeword.set(data);
    return codeword;
}

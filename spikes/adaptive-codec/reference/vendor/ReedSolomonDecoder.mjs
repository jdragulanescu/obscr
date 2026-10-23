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
 */
/* Modified for the Obscr issue 28 prototype: JavaScript ES module port of
 * zxing-js/library 1722d0744fb5e8b47aebfbeb2b648e17c95e8595, ReedSolomonDecoder.ts.
 * Type declarations removed; imports and native error/copy helpers adapted;
 * unrelated eager GenericGF constants removed. Algorithm retained.
 * Original authors: Sean Owen, William Rucklidge, sanfordsquires.
 * Polynomial/decoder portions credit William Rucklidge's C++ implementation.
 * See ../REPAIR.md, LICENSE, upstream/, and provenance.json.
 */
import GenericGF from "./GenericGF.mjs";
import GenericGFPoly from "./GenericGFPoly.mjs";
export default class ReedSolomonDecoder {
  field;
  constructor(field) {
    this.field = field;
  }
  decode(received, twoS) {
    this.decodeWithECCount(received, twoS);
  }
  decodeWithECCount(received, twoS) {
    const field = this.field;
    const poly = new GenericGFPoly(field, received);
    const syndromeCoefficients = new Int32Array(twoS);
    let noError = true;
    for (let i = 0;i < twoS; i++) {
      const evalResult = poly.evaluateAt(field.exp(i + field.getGeneratorBase()));
      syndromeCoefficients[syndromeCoefficients.length - 1 - i] = evalResult;
      if (evalResult !== 0) {
        noError = false;
      }
    }
    if (noError) {
      return 0;
    }
    const syndrome = new GenericGFPoly(field, syndromeCoefficients);
    const sigmaOmega = this.runEuclideanAlgorithm(field.buildMonomial(twoS, 1), syndrome, twoS);
    const sigma = sigmaOmega[0];
    const omega = sigmaOmega[1];
    const errorLocations = this.findErrorLocations(sigma);
    const errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations);
    for (let i = 0;i < errorLocations.length; i++) {
      const position = received.length - 1 - field.log(errorLocations[i]);
      if (position < 0) {
        throw new Error("Bad error location");
      }
      received[position] = GenericGF.addOrSubtract(received[position], errorMagnitudes[i]);
    }
    return errorLocations.length;
  }
  runEuclideanAlgorithm(a, b, R) {
    if (a.getDegree() < b.getDegree()) {
      const temp = a;
      a = b;
      b = temp;
    }
    const field = this.field;
    let rLast = a;
    let r = b;
    let tLast = field.getZero();
    let t = field.getOne();
    while (r.getDegree() >= (R / 2 | 0)) {
      let rLastLast = rLast;
      let tLastLast = tLast;
      rLast = r;
      tLast = t;
      if (rLast.isZero()) {
        throw new Error("r_{i-1} was zero");
      }
      r = rLastLast;
      let q = field.getZero();
      const denominatorLeadingTerm = rLast.getCoefficient(rLast.getDegree());
      const dltInverse = field.inverse(denominatorLeadingTerm);
      while (r.getDegree() >= rLast.getDegree() && !r.isZero()) {
        const degreeDiff = r.getDegree() - rLast.getDegree();
        const scale = field.multiply(r.getCoefficient(r.getDegree()), dltInverse);
        q = q.addOrSubtract(field.buildMonomial(degreeDiff, scale));
        r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
      }
      t = q.multiply(tLast).addOrSubtract(tLastLast);
      if (r.getDegree() >= rLast.getDegree()) {
        throw new Error("Division algorithm failed to reduce polynomial?");
      }
    }
    const sigmaTildeAtZero = t.getCoefficient(0);
    if (sigmaTildeAtZero === 0) {
      throw new Error("sigmaTilde(0) was zero");
    }
    const inverse = field.inverse(sigmaTildeAtZero);
    const sigma = t.multiplyScalar(inverse);
    const omega = r.multiplyScalar(inverse);
    return [sigma, omega];
  }
  findErrorLocations(errorLocator) {
    const numErrors = errorLocator.getDegree();
    if (numErrors === 1) {
      return Int32Array.from([errorLocator.getCoefficient(1)]);
    }
    const result = new Int32Array(numErrors);
    let e = 0;
    const field = this.field;
    for (let i = 1;i < field.getSize() && e < numErrors; i++) {
      if (errorLocator.evaluateAt(i) === 0) {
        result[e] = field.inverse(i);
        e++;
      }
    }
    if (e !== numErrors) {
      throw new Error("Error locator degree does not match number of roots");
    }
    return result;
  }
  findErrorMagnitudes(errorEvaluator, errorLocations) {
    const s = errorLocations.length;
    const result = new Int32Array(s);
    const field = this.field;
    for (let i = 0;i < s; i++) {
      const xiInverse = field.inverse(errorLocations[i]);
      let denominator = 1;
      for (let j = 0;j < s; j++) {
        if (i !== j) {
          const term = field.multiply(errorLocations[j], xiInverse);
          const termPlus1 = (term & 1) === 0 ? term | 1 : term & ~1;
          denominator = field.multiply(denominator, termPlus1);
        }
      }
      result[i] = field.multiply(errorEvaluator.evaluateAt(xiInverse), field.inverse(denominator));
      if (field.getGeneratorBase() !== 0) {
        result[i] = field.multiply(result[i], xiInverse);
      }
    }
    return result;
  }
}

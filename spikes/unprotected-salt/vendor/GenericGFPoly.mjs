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
 * zxing-js/library 1722d0744fb5e8b47aebfbeb2b648e17c95e8595, GenericGFPoly.ts.
 * Type declarations removed; imports and native error/copy helpers adapted;
 * unrelated eager GenericGF constants removed. Algorithm retained.
 * Original authors: Sean Owen.
 * Polynomial/decoder portions credit William Rucklidge's C++ implementation.
 * See ../REPAIR.md, LICENSE, upstream/, and provenance.json.
 */
import { arraycopy } from "./arraycopy.mjs";
import AbstractGenericGF from "./AbstractGenericGF.mjs";
export default class GenericGFPoly {
  field;
  coefficients;
  constructor(field, coefficients) {
    if (coefficients.length === 0) {
      throw new RangeError;
    }
    this.field = field;
    const coefficientsLength = coefficients.length;
    if (coefficientsLength > 1 && coefficients[0] === 0) {
      let firstNonZero = 1;
      while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
        firstNonZero++;
      }
      if (firstNonZero === coefficientsLength) {
        this.coefficients = Int32Array.from([0]);
      } else {
        this.coefficients = new Int32Array(coefficientsLength - firstNonZero);
        arraycopy(coefficients, firstNonZero, this.coefficients, 0, this.coefficients.length);
      }
    } else {
      this.coefficients = coefficients;
    }
  }
  getCoefficients() {
    return this.coefficients;
  }
  getDegree() {
    return this.coefficients.length - 1;
  }
  isZero() {
    return this.coefficients[0] === 0;
  }
  getCoefficient(degree) {
    return this.coefficients[this.coefficients.length - 1 - degree];
  }
  evaluateAt(a) {
    if (a === 0) {
      return this.getCoefficient(0);
    }
    const coefficients = this.coefficients;
    let result;
    if (a === 1) {
      result = 0;
      for (let i = 0, length = coefficients.length;i !== length; i++) {
        const coefficient = coefficients[i];
        result = AbstractGenericGF.addOrSubtract(result, coefficient);
      }
      return result;
    }
    result = coefficients[0];
    const size = coefficients.length;
    const field = this.field;
    for (let i = 1;i < size; i++) {
      result = AbstractGenericGF.addOrSubtract(field.multiply(a, result), coefficients[i]);
    }
    return result;
  }
  addOrSubtract(other) {
    if (!this.field.equals(other.field)) {
      throw new RangeError("GenericGFPolys do not have same GenericGF field");
    }
    if (this.isZero()) {
      return other;
    }
    if (other.isZero()) {
      return this;
    }
    let smallerCoefficients = this.coefficients;
    let largerCoefficients = other.coefficients;
    if (smallerCoefficients.length > largerCoefficients.length) {
      const temp = smallerCoefficients;
      smallerCoefficients = largerCoefficients;
      largerCoefficients = temp;
    }
    let sumDiff = new Int32Array(largerCoefficients.length);
    const lengthDiff = largerCoefficients.length - smallerCoefficients.length;
    arraycopy(largerCoefficients, 0, sumDiff, 0, lengthDiff);
    for (let i = lengthDiff;i < largerCoefficients.length; i++) {
      sumDiff[i] = AbstractGenericGF.addOrSubtract(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
    }
    return new GenericGFPoly(this.field, sumDiff);
  }
  multiply(other) {
    if (!this.field.equals(other.field)) {
      throw new RangeError("GenericGFPolys do not have same GenericGF field");
    }
    if (this.isZero() || other.isZero()) {
      return this.field.getZero();
    }
    const aCoefficients = this.coefficients;
    const aLength = aCoefficients.length;
    const bCoefficients = other.coefficients;
    const bLength = bCoefficients.length;
    const product = new Int32Array(aLength + bLength - 1);
    const field = this.field;
    for (let i = 0;i < aLength; i++) {
      const aCoeff = aCoefficients[i];
      for (let j = 0;j < bLength; j++) {
        product[i + j] = AbstractGenericGF.addOrSubtract(product[i + j], field.multiply(aCoeff, bCoefficients[j]));
      }
    }
    return new GenericGFPoly(field, product);
  }
  multiplyScalar(scalar) {
    if (scalar === 0) {
      return this.field.getZero();
    }
    if (scalar === 1) {
      return this;
    }
    const size = this.coefficients.length;
    const field = this.field;
    const product = new Int32Array(size);
    const coefficients = this.coefficients;
    for (let i = 0;i < size; i++) {
      product[i] = field.multiply(coefficients[i], scalar);
    }
    return new GenericGFPoly(field, product);
  }
  multiplyByMonomial(degree, coefficient) {
    if (degree < 0) {
      throw new RangeError;
    }
    if (coefficient === 0) {
      return this.field.getZero();
    }
    const coefficients = this.coefficients;
    const size = coefficients.length;
    const product = new Int32Array(size + degree);
    const field = this.field;
    for (let i = 0;i < size; i++) {
      product[i] = field.multiply(coefficients[i], coefficient);
    }
    return new GenericGFPoly(field, product);
  }
  divide(other) {
    if (!this.field.equals(other.field)) {
      throw new RangeError("GenericGFPolys do not have same GenericGF field");
    }
    if (other.isZero()) {
      throw new RangeError("Divide by 0");
    }
    const field = this.field;
    let quotient = field.getZero();
    let remainder = this;
    const denominatorLeadingTerm = other.getCoefficient(other.getDegree());
    const inverseDenominatorLeadingTerm = field.inverse(denominatorLeadingTerm);
    while (remainder.getDegree() >= other.getDegree() && !remainder.isZero()) {
      const degreeDifference = remainder.getDegree() - other.getDegree();
      const scale = field.multiply(remainder.getCoefficient(remainder.getDegree()), inverseDenominatorLeadingTerm);
      const term = other.multiplyByMonomial(degreeDifference, scale);
      const iterationQuotient = field.buildMonomial(degreeDifference, scale);
      quotient = quotient.addOrSubtract(iterationQuotient);
      remainder = remainder.addOrSubtract(term);
    }
    return [quotient, remainder];
  }
  toString() {
    let result = "";
    for (let degree = this.getDegree();degree >= 0; degree--) {
      let coefficient = this.getCoefficient(degree);
      if (coefficient !== 0) {
        if (coefficient < 0) {
          result += " - ";
          coefficient = -coefficient;
        } else {
          if (result.length > 0) {
            result += " + ";
          }
        }
        if (degree === 0 || coefficient !== 1) {
          const alphaPower = this.field.log(coefficient);
          if (alphaPower === 0) {
            result += "1";
          } else if (alphaPower === 1) {
            result += "a";
          } else {
            result += "a^";
            result += alphaPower;
          }
        }
        if (degree !== 0) {
          if (degree === 1) {
            result += "x";
          } else {
            result += "x^";
            result += degree;
          }
        }
      }
    }
    return result;
  }
}

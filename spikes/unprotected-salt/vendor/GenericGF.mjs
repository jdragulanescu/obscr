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
 * zxing-js/library 1722d0744fb5e8b47aebfbeb2b648e17c95e8595, GenericGF.ts.
 * Type declarations removed; imports and native error/copy helpers adapted;
 * unrelated eager GenericGF constants removed. Algorithm retained.
 * Original authors: Sean Owen, David Olivier.
 * Polynomial/decoder portions credit William Rucklidge's C++ implementation.
 * See ../REPAIR.md, LICENSE, upstream/, and provenance.json.
 */
import GenericGFPoly from "./GenericGFPoly.mjs";
import AbstractGenericGF from "./AbstractGenericGF.mjs";
export default class GenericGF extends AbstractGenericGF {
  primitive;
  size;
  generatorBase;
  zero;
  one;
  constructor(primitive, size, generatorBase) {
    super();
    this.primitive = primitive;
    this.size = size;
    this.generatorBase = generatorBase;
    const expTable = new Int32Array(size);
    let x = 1;
    for (let i = 0;i < size; i++) {
      expTable[i] = x;
      x *= 2;
      if (x >= size) {
        x ^= primitive;
        x &= size - 1;
      }
    }
    this.expTable = expTable;
    const logTable = new Int32Array(size);
    for (let i = 0;i < size - 1; i++) {
      logTable[expTable[i]] = i;
    }
    this.logTable = logTable;
    this.zero = new GenericGFPoly(this, Int32Array.from([0]));
    this.one = new GenericGFPoly(this, Int32Array.from([1]));
  }
  getZero() {
    return this.zero;
  }
  getOne() {
    return this.one;
  }
  buildMonomial(degree, coefficient) {
    if (degree < 0) {
      throw new RangeError;
    }
    if (coefficient === 0) {
      return this.zero;
    }
    const coefficients = new Int32Array(degree + 1);
    coefficients[0] = coefficient;
    return new GenericGFPoly(this, coefficients);
  }
  inverse(a) {
    if (a === 0) {
      throw new Error;
    }
    return this.expTable[this.size - this.logTable[a] - 1];
  }
  multiply(a, b) {
    if (a === 0 || b === 0) {
      return 0;
    }
    return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
  }
  getSize() {
    return this.size;
  }
  getGeneratorBase() {
    return this.generatorBase;
  }
  toString() {
    return "GF(0x" + this.primitive.toString(16) + "," + this.size + ")";
  }
  equals(o) {
    return o === this;
  }
}

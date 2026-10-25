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
 * zxing-js/library 1722d0744fb5e8b47aebfbeb2b648e17c95e8595, AbstractGenericGF.ts.
 * Type declarations removed; imports and native error/copy helpers adapted;
 * unrelated eager GenericGF constants removed. Algorithm retained.
 * Original authors: Sean Owen, David Olivier.
 * Polynomial/decoder portions credit William Rucklidge's C++ implementation.
 * See ../REPAIR.md, LICENSE, upstream/, and provenance.json.
 */
export default class AbstractGenericGF {
  expTable;
  logTable;
  exp(a) {
    return this.expTable[a];
  }
  log(a) {
    if (a === 0) {
      throw new RangeError;
    }
    return this.logTable[a];
  }
  static addOrSubtract(a, b) {
    return a ^ b;
  }
}

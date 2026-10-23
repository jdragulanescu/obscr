# Unknown-error Reed–Solomon subset

Throwaway experiment for [issue 28](https://github.com/jdragulanescu/obscr/issues/28). This module implements the parameter trial in [the accepted repair research, sections 3 and 5](../../docs/research/obscr-hiding-and-recovery.md). It does not establish a damaged-image recovery rate or a production security claim.

## Contract

- `rsEncode(data: Uint8Array, parity)` returns a new systematic codeword: data, then parity bytes. The input is unchanged.
- `rsDecode(code: Uint8Array, parity)` returns new data bytes or throws. The input is unchanged. It corrects **unknown byte errors**, not erasures supplied by the caller.
- Parity is exactly 16, 32, or 64. A data block has 1 through `255 - parity` bytes. A codeword has `parity + 1` through 255 bytes. An empty payload must be handled by the caller; it is not an RS block.
- The field is **GF(256), primitive polynomial 0x11d, primitive element alpha=2, generator base 0**. Coefficients on the wire run from highest degree to lowest degree. The generator is `product(i=0..parity-1)(x + alpha^i)`.
- Final blocks are shortened by omitting conceptual **leading zero data bytes**. No padding is transmitted. The emitted length is exactly `data.length + parity`. The decoder uses that received length, so the caller must retain block boundaries.
- Full profiles are RS(255,239), RS(255,223), and RS(255,191). Their unknown-error radii are 8, 16, and 32 bytes per codeword. One changed bit makes its containing byte an erroneous symbol.
- The wrapper bounds the input before allocations. It checks the decoder's correction count and checks the residual syndrome after correction. Neither check supplies authenticity. Beyond the radius, it can return a different valid message. **The caller must authenticate the complete envelope before exposing plaintext.**
- Imports are native browser ES modules. No Node-only APIs, package install, global library, bundler, or build step is required to use these modules. A browser must serve modules over HTTP(S), rather than import them from a local file URL.

## Pin, license, and modifications

The only upstream code is five Reed–Solomon TypeScript source files from [zxing-js/library 0.23.0](https://github.com/zxing-js/library/releases/tag/v0.23.0), pinned to commit [`1722d0744fb5e8b47aebfbeb2b648e17c95e8595`](https://github.com/zxing-js/library/tree/1722d0744fb5e8b47aebfbeb2b648e17c95e8595). The [GitHub tag reference](https://api.github.com/repos/zxing-js/library/git/ref/tags/v0.23.0) identified that commit. The files were obtained through the harness web reader using GitHub's primary-source contents API. Its base64 payload preserves the original bytes, including the final newline. No npm package was downloaded.

Original source bytes are retained in [vendor/upstream/](vendor/upstream/). [vendor/LICENSE](vendor/LICENSE) is the complete upstream license: Apache-2.0 plus its retained jai-imageio notice. Copyright headers and author attribution are retained in the executable ports as well as in the original files. The upstream root contents list has no separate NOTICE file. This subset does not change the license of the rest of the repository.

[vendor/provenance.json](vendor/provenance.json) records source URLs, Git blob IDs, exact source SHA-256 values, and executable port SHA-256 values. Source hashes are:

| Source | Bytes | SHA-256 |
|---|---:|---|
| `GenericGF.ts` | 4819 | `3caf70025f3f3e2e47b0b67e064efdd1ed56855b9929bff4cc27eb7c65161a55` |
| `GenericGFPoly.ts` | 10322 | `db399fec2fcf42801abfbbd2115532a1e245b29eba147a8ff99f9563ace88a51` |
| `ReedSolomonEncoder.ts` | 4885 | `c17993869e4aeb8e5c99f47fb486a09f7a7485c0d373831efc7631a1e2552cdf` |
| `ReedSolomonDecoder.ts` | 8620 | `c5838e86b04bddb3ffb5a1e7c6197f17cd4ce5bd576fb6e60f44d87ec85da3f0` |
| `LICENSE` | 13321 | `849b3ff4527ff587eecc78736b5685bbba7a44b071f3b944da914e832292f6c0` |
| `AbstractGenericGF.ts` | 2321 | `6d175430caac77da1049e4a52a40000d44ee830a53bd6537a47cd351447801d5` |

The executable files are a source port, not unchanged upstream JavaScript. TypeScript syntax was converted with the available Bun.Transpiler 1.4.3; that tool is not a runtime dependency. Every port carries a modification notice. Changes are:

1. `AbstractGenericGF.mjs`: remove type declarations and unused utility imports; use native RangeError.
2. `GenericGF.mjs`: remove type declarations and unrelated eagerly initialized fields; the wrapper constructs only the selected GF(256) field. Replace utility exceptions and hexadecimal conversion with native equivalents.
3. `GenericGFPoly.mjs`: remove type declarations; replace the array-copy utility and argument errors.
4. `ReedSolomonEncoder.mjs`: remove type declarations; replace the array-copy utility and argument errors.
5. `ReedSolomonDecoder.mjs`: remove type declarations; replace custom exception classes with Error. Keep the Euclidean algorithm, Chien search, and Forney correction logic.
6. Relative imports have explicit `.mjs` extensions. `arraycopy.mjs` is a small local replacement using typed-array subarray/set for the disjoint ranges used in this subset. The decoder's original William Rucklidge attribution is retained.

No barcode readers, image adapters, or full-library distribution are included. Original TypeScript files are provenance records and are not imported at runtime.

## Reproducible reference experiment

`rsChecks()` is asynchronous and returns JSON. Nothing runs on module import. From the repository root:

```sh
agent-local node --input-type=module -e 'import { rsChecks } from "./spikes/filler-free-repair/rs.mjs"; console.log(JSON.stringify(await rsChecks(), null, 2));'
```

No install is required. In the browser, import `rsChecks` from `./rs.mjs` and await it. The integration owner runs this experiment and records its actual result. No execution result is claimed in this note.

[rs-vectors.mjs](rs-vectors.mjs) constructs expected codewords independently: carryless bit multiplication reduced by 0x11d, ascending-coefficient generator multiplication, and polynomial long division. It imports no vendor arithmetic. ZXing uses logarithm tables and descending-coefficient polynomial objects. Expected data and codeword hex are returned so runs can be compared byte-for-byte. These are reproducible mathematical reference vectors, not a claim that the values came from published ZXing fixtures.

The experiment covers:

- All three parity profiles, with data lengths 1, 2, 16, 36, `k-1`, and `k`. These include the shortened salt and metadata lengths used by the candidate.
- Independent encoded-byte equality, independent zero-syndrome evaluation, clean reference decoding, and the equivalence of shortened blocks to full blocks with leading zero padding.
- Unknown errors at 1, `t-1`, exactly `t`, and `t+1` distinct symbol positions, using front, back, and spread placement. Within-radius cases must recover exactly. Beyond-radius results are recorded as exact, rejected, or miscorrected; they are not assumed to fail safely.
- A constructed beyond-radius ambiguity for every profile and length. Two codewords A and B differ in exactly `parity+1` positions. A received word is `t+1` errors from A and `t` from B. A bounded decoder selects B, which is wrong if A was sent. This is a deliberate demonstration of the need for authentication, not a defect that RS can fix.
- Rejection of invalid input types, empty/oversized blocks, missing data, and unsupported parity.

The finite cases do not exhaust all error patterns, assess browser performance, or prove authenticated recovery. The parent experiment must run both Node and browser paths and must keep AEAD failure separate from RS decoder failure.

# Filler-free repair: recovery works, public discovery fails concealment

Question: [Measure filler-free hiding and bounded pixel repair](https://github.com/jdragulanescu/obscr/issues/28).

## Verdict

**Do not approve any of the six complete experimental profiles.** Grouped placement with 32 parity bytes recovered every declared 1% damage case, but the public salt-repair record identified every encoded photograph. This experiment did not demonstrate improved complete-format concealment over the current filler-on default.

Return to [Choose hiding and recovery behavior](https://github.com/jdragulanescu/obscr/issues/17) to reconsider discovery and hiding together. This rejects the tested public-bootstrap construction, **not every possible RGB carrier or use of Reed–Solomon**. It approves no production profile, cover threshold, embedding-rate cap, KDF setting, or survival percentage.

The evidence is sufficient to expose a concrete disqualifying presence test. Its small convenience corpus is not sufficient to establish population detection rates or a safe cover budget. Human acceptance of this negative prototype remains required.

## What ran

The matrix was declared in [EXPERIMENT.md](EXPERIMENT.md) before scoring. All secrets and messages are synthetic.

- Ten licensed photographic sources, each at 256×256 and 512×512, plus twelve generated flat/gradient stress covers. Four source photographs train the detector, three select thresholds, three are held out. No source photograph crosses a split. [CORPUS.md](CORPUS.md) records rights, original dimensions, preprocessing and limitations; [manifest](photos/manifest.json) pins source bytes and hashes.
- Six complete candidate profiles: 16/32/64 parity bytes per full 255-byte block, each with grouped-byte or scattered-bit placement. Shortened final blocks, independently protected salt and metadata, AES-256-GCM with the full tag, and cryptographic per-image placement. Exact bytes and resource bounds are in [CODEC.md](CODEC.md).
- Equal useful message sizes of 64, 512 and 2,048 UTF-8 bytes across candidates and three [precisely defined controls](CONTROLS.md): current filler-on, current filler-off and a five-copy control using the existing encrypted record and placement. The five-copy control is not the earlier prototype; no previous result was counted here.
- Each target case selects 1% of pixels without replacement, with seeds 2801, 2802 and 2803. One case changes one RGB channel by ±1, clipped at the endpoints. The other replaces all RGB channels. They are separate changes, not cumulative.
- The main run made **6,168 decode observations: 4,372 exact outputs, 1,796 safe failures, zero incorrect authenticated outputs**. Its 180 edge records include compression, PNG rewriting, correction boundaries, malformed input and capacity checks. Some edge records also describe decode rows; these counts must not be added as independent trials.
- A separate [authentication-boundary run](evidence/authentication-boundaries.json) made 54 observations. It rejected altered ciphertext with valid repair codes, altered authenticated metadata, shortened tags with valid repair codes, excessive lengths and invalid password bytes without plaintext. All six profiles recovered a compressed 1 MiB message and rejected one byte above that limit.

The main edge loop selected the final cover of each geometry: the two test-gradient stress covers. Its PNG-rewrite and targeted-boundary counts are therefore stress-cover checks, not additional independent photographs. The separate authentication-boundary run used the brick photograph. The browser/CLI exchange also used that photograph.

## Recovery

The following counts include all 32 covers, three loads and three damage seeds: **288 observations per damage column per method**. All nine methods recovered all 96 unchanged controls. Unsuccessful target cases were safe failures.

| Method | One-channel ±1: exact / 288 | RGB replacement: exact / 288 |
| --- | ---: | ---: |
| Grouped, 16 parity | 162 | 163 |
| Scattered, 16 parity | 169 | 107 |
| Grouped, 32 parity | 288 | 288 |
| Scattered, 32 parity | 287 | 266 |
| Grouped, 64 parity | 288 | 288 |
| Scattered, 64 parity | 288 | 288 |
| Current filler-on | 0 | 0 |
| Current filler-off | 0 | 0 |
| Five-copy control | 288 | 282 |

Photographs alone contribute 180 observations per target/method. Grouped-32 and both 64-parity profiles recovered all of them. Scattered-32 recovered 179 one-channel cases and 165 RGB-replacement cases. The raw records retain every post-extraction erroneous-byte count per payload codeword; they do not infer correction from damaged-pixel counts.

On photographs, the largest observed erroneous-byte count per word was 15/14 for grouped-32 in the two target cases, versus 17/19 for scattered-32. Its correction radius is 16 unknown erroneous bytes per aligned word. Placement changes the byte-error distribution; more scattering is not automatically better. Grouped-32 is the least-parity candidate that passed this declared target matrix, but **that is not a production recommendation**.

Central patches and stripes were checked separately. All profiles except scattered-16 recovered both tested geometries. Salt and metadata recovered at 32 targeted byte errors and failed safely at 33; payloads recovered at their 8/16/32-byte radius and failed safely for the chosen radius-plus-one mutations. Other beyond-radius patterns can miscorrect, so none of these observations removes the need for authentication.

## Detection: the deciding failure

The observer needs no password. It reads the 80 public salt-code bytes, decodes them with the fixed 64-parity code and checks whether re-encoding reproduces the received word. Removing a literal magic string did not remove a public presence test. There are no intentionally repeated public metadata fields in this candidate; the salt's parity is the examined public redundancy.

This exact public test triggered for **360/360 candidate photograph encodings** and for none of their paired photographic covers. The paired count repeats the same covers across profiles/loads; it is not 360 independent negative photographs. On the held-out set, all six profiles at all three loads had public-only and combined-format AUC 1.0. At the validation thresholds targeting 1% and 5% FPR, observed held-out TPR was 100% and observed held-out FPR was 0%.

Those percentages describe only three held-out source photographs, each at two dimensions. They are not population guarantees. The 500 source-group bootstrap replicates gave degenerate public AUC intervals [1,1] and TPR intervals [1,1] because every sampled source had the same result. With just three negative source groups, zero observed false-positive groups still gives an approximately 63.2% one-sided 95% binomial upper bound under an independence/representativeness assumption that this corpus does not establish. Flat stress covers can themselves contain a valid all-zero salt code; the public detector's held-out stress FPR was 50%, reported separately.

At a useful message size of 512 bytes, the held-out comparison was:

| Method | Statistical-only AUC | Conditional source-bootstrap 95% interval | Complete-format AUC | TPR at validation-selected threshold | Actual test FPR |
| --- | ---: | --- | ---: | ---: | ---: |
| Grouped-16 | 0.611 | 0.611–1.000 | 1.000 | 1.000 | 0.000 |
| Scattered-16 | 0.639 | 0.639–1.000 | 1.000 | 1.000 | 0.000 |
| Grouped-32 | 0.611 | 0.611–1.000 | 1.000 | 1.000 | 0.000 |
| Scattered-32 | 0.639 | 0.639–1.000 | 1.000 | 1.000 | 0.000 |
| Grouped-64 | 0.611 | 0.611–1.000 | 1.000 | 1.000 | 0.000 |
| Scattered-64 | 0.639 | 0.639–1.000 | 1.000 | 1.000 | 0.000 |
| Current filler-on | 1.000 | 1.000–1.000 | 1.000 | 0.833 | 0.000 |
| Current filler-off | 0.611 | 0.500–1.000 | 0.611 | 0.000 | 0.000 |
| Five-copy control | 0.667 | 0.667–1.000 | 0.667 | 0.500 | 0.167 |

Both target FPR settings selected the same threshold in this small validation set. Their actual test FPR need not equal the target. Full ROC points, all loads, thresholds, model weights, achieved rates and grouped uncertainty are retained in [results.json](evidence/results.json). The statistical detector is a simple regularized diagonal discriminant over twelve LSB/neighbor features, not a state-of-the-art steganalyzer. Confidence intervals condition on the trained model and selected threshold; they omit training, threshold and corpus-selection uncertainty.

The apparent improvement over filler-on in the statistical-only column disappears once the complete format is tested. Compared with filler-off, the candidate adds an easy public detector. Lower changed-sample counts do not compensate for that repair/discovery penalty.

## Capacity, covers and visual effects

The fixed initial-data cost is 180 transmitted bytes. With s stored bytes and p parity bytes, payload cost is `s + 16 + p*ceil((s+16)/(255-p))`; the 16-byte GCM tag is not shortened. Salt, nonce, lengths, profile, compression flag, dimensions and tag are accounted for. The final word is shortened, not silently weakened.

The following are **physical maxima**, tested at the maximum and one byte beyond for each mapping. They are not safe embedding budgets.

| Payload parity bytes | Maximum stored bytes at 256×256 | Maximum stored bytes at 512×512 |
| --- | ---: | ---: |
| 16 | 22,844 | 91,948 |
| 32 | 21,308 | 85,788 |
| 64 | 18,236 | 73,468 |

All twelve maximum-size checks recovered exactly; all twelve maximum-plus-one checks rejected before embedding. Unicode round trips recovered the 1,140-byte fixture, both uncompressed and gzip-compressed to 92 stored bytes. Pixel-preserving PNG rewrites preserved RGB bytes and recovered exactly. Truncated PNG containers were rejected as containers, not counted as repairable damage.

For the 512×512 brick image and a 512-byte useful message:

| Method | Total coded bytes | Changed RGB samples | PSNR dB |
| --- | ---: | ---: | ---: |
| Grouped-32 | 804 | 3,174 | 72.07 |
| Current filler-on | 774 message bytes, plus full-image filler | 393,557 | 51.14 |
| Current filler-off | 774 | 3,115 | 72.15 |
| Five-copy control | 3,870 | 15,403 | 65.21 |

The browser screenshot showed the brick scene without an obvious visual change. That is a visual observation, not detection evidence. Original, candidate, control and RGB-damaged PNGs are retained under `evidence/`.

**No cover-suitability rule or nonzero safe rate cap can be approved for this complete construction.** Even the 64-byte useful-message cases triggered its public detector. Lowering the payload cap cannot remove a fixed salt-code signal. Reject this construction for all production covers rather than invent a passing photograph threshold. Flat covers, screenshots, illustrations and transparency-heavy images gain no support from these results. A revised construction must supply its own evidence before a cover rule or net cap is proposed.

## Runtime and reference evidence

Host: Apple M3 Max, Mac15,8, 64 GiB RAM, Darwin 25.6.0, arm64. Node v24.13.0; browser Chrome 150, with exact user agent in [browser.json](evidence/browser.json). Experimental PBKDF2-HMAC-SHA256 uses 100,000 rounds only to make this carrier experiment concrete. It is not the pending production KDF profile.

The separate cost run used a 512×512 photograph and 2,048 useful bytes, three fresh CLI processes and three warm encode/decode pairs per profile:

| Profile | Cold CLI process wall time ms | Warm encode ms | Warm decode ms | Largest cold process RSS MiB |
| --- | --- | --- | --- | ---: |
| Grouped-16 | 81.7–83.0 | 14.0–14.9 | 11.4–13.0 | 68.1 |
| Grouped-32 | 91.0–93.0 | 15.7–16.6 | 13.1–14.3 | 68.2 |
| Grouped-64 | 87.0–91.9 | 14.9–15.1 | 13.3–13.9 | 68.3 |
| Scattered-16 | 88.0–89.9 | 17.5–26.4 | 15.4–19.9 | 71.8 |
| Scattered-32 | 91.9–98.1 | 17.6–20.4 | 15.3–17.1 | 71.8 |
| Scattered-64 | 92.4–100.8 | 19.5–20.3 | 17.3–18.6 | 71.3 |

Cold wall time includes process/module/PNG startup. Internal decode timings and raw samples are in [cost.json](evidence/cost.json). RSS includes the process, not just codec allocations. The much larger mixed matrix process peaked at 673,759,232 bytes; it also held corpus arrays, legacy controls, results and detector data. Do not treat that as the candidate's isolated memory need.

[BROWSER.md](BROWSER.md) records actual page controls, screenshots and bidirectional CLI/browser PNG exchange with exact Unicode text. The page also recovered its one RGB-damage example and rejected a wrong password without plaintext. Eighteen additional warm browser encode/decode pairs covered all six profiles and recovered exactly; [browser-cost.json](evidence/browser-cost.json) preserves their times and heap samples. Browser timings were under concurrent matrix load. **Whole-browser native peak memory and browser-process cold cost were not measured. No iPhone, Android, Safari or Firefox evidence exists.** These omissions cannot be turned into device support claims.

[RS vectors](evidence/rs-vectors.json) compare the pinned subset against an independent mathematical encoder: 18 full/shortened vectors, 216 boundary observations, and 18 constructed beyond-radius miscorrections. The actual browser repeated them with matching results. [Key-chain vectors](evidence/key-chain.json) independently reconstruct the candidate's Web Crypto results with Node PBKDF2/HKDF/AES APIs. All six plaintexts and placement sequences matched, including CTR chunk crossings and observed rejection draws for scattered placement.

## Provenance and verification

The Apache-2.0 ZXing subset is pinned to commit `1722d0744fb5e8b47aebfbeb2b648e17c95e8595`; original source, full license, notices, port changes and hashes are retained under `vendor/` and [REPAIR.md](REPAIR.md). No reference adaptive-hiding implementation was copied.

SHA-256:

- Root `package-lock.json`: `2024502204892c4a01719aee69f54f173bf1769b8f0bf2bcd56e5753d7b9b060`.
- Unchanged `lib/crypto.js`: `2f3df9cc9b50e97325a900777f38fc516cd4b5d446986bfcd8bfe014c08df0ce`.
- Unchanged `lib/steg-core.js`: `5fcbb4f9fa69dcb9b48d936828458d4a7af94ba41680b72a50f4e22a6da2c5f6`.
- Unchanged `lib/utils.js`: `028b7135b11496dec8d1599cb52b8b38fad7ddd1eda0022f9df744d353906f4d`.
- Unchanged `lib/mersenne-twister.js`: `2b5577c92eaab573695483bc02e5d82ba88c2e5315ed743606fc4cfee4235bc8`.
- Candidate, detector, runner and fixture source hashes are in `results.json`; photo originals and stored PNG hashes are in `photos/manifest.json`.

Executed commands are in [README.md](README.md). The root fast suite passed: five suites, 104 tests. The product Vite build passed with warnings about the out-of-root build directory, old Browserslist data, `vm-browserify` eval and large chunks. No production source, format test or release claim changed. The legacy control emitted Node's warning about short GCM tags on damaged legacy records; it was not suppressed or copied into the candidate's full-tag contract.

The spike is deliberately retained as primary evidence. Lessons: none added; the known public-structure risk was tested and caught before any production change.

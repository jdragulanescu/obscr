# Hiding with an unprotected random salt: findings

Question: [Measure hiding with an unprotected random salt](https://github.com/jdragulanescu/obscr/issues/31).

## TL;DR

**Inconclusive for selecting a production carrier, repair profile, cover rule or safe capacity cap.** Removing public salt repair removed the known public-code signal on this run. Neither complete candidate met the frozen improvement rule across all three useful-message loads. The repaired 2048-byte case alone passed the exploratory comparison; that does not make a profile-wide result or a safe cap.

Repair provided a measured benefit even with salt failures counted: **97/288** exact recoveries for one-channel ±1 damage and **67/288** for random RGB replacement, against **3/288** and **1/288** without repair. Every changed-salt case failed. Both candidates recovered all unchanged matrix files and all pixel-preserving PNG rewrite checks. No incorrect authenticated output was observed.

Return these findings to [Choose hiding and recovery behavior](https://github.com/jdragulanescu/obscr/issues/17). Do not approve settings, infer a capacity limit from storage, add parity, or weaken the concealment requirement. The human still decides the next hiding/discovery investigation. [Define the complete protected image format](https://github.com/jdragulanescu/obscr/issues/19) still owns production bytes and routing. This report requires human acceptance.

## What was measured

- Frozen protocol: [EXPERIMENT.md](EXPERIMENT.md), [CODEC.md](CODEC.md), [DETECTORS.md](DETECTORS.md), [CORPUS.md](CORPUS.md); exact inputs in [freeze.json](evidence/freeze.json).
- Two complete candidates: `no-repair` and `grouped-p32`, raw salt16 in the same public positions, no filler, matching useful messages, fixture salts, nonces, KDF and grouped placement. Header/payload records differ only as specified by their explicit profiles. No fallback or salt guessing.
- Argon2id v19, 64 MiB, three passes, one lane, root32; explicitly pinned Sodium packages 0.8.4. This exercises the separately accepted provisional password profile, not new production approval. HKDF-separated keys, full-key AES-CTR sampling and full-tag AES-GCM are common to both.
- Current filler-on and filler-off production controls at equal useful loads: 64, 512 and 2048 UTF-8 bytes. The root production code was not changed.
- Ten named photographs, each at 256×256 and 512×512; fixed four/three/three source split. Twelve generated flat/gradient covers were separate stress observations. **These photographs had already been used in the earlier study.** The split is source-separated, not a new untouched confirmation corpus.
- 384 encodings, 2720 decode observations and 52 separate edge observations. The matrix took 286.36 seconds; process peak RSS was 499,302,400 bytes. These totals include controls and stress cases, not independent population samples.
- Host: Mac15,8, Apple M3 Max, 68,719,476,736 bytes RAM, macOS 26.6.2 (25G83), Darwin 25.6.0 arm64. Node v24.13.0; managed desktop Chromium 150.0.7871.24. No physical phone or Safari was measured.

Raw rows, diagnostic damage counts, image hashes, features and operation measurements are in [raw.json](evidence/raw.json). ROC curves, models, thresholds, source-group intervals, comparisons, edge results and capacities are in [results.json](evidence/results.json). [host.json](evidence/host.json) records the host commands' values.

## Concealment: known signal removed, acceptance still incomplete

The detector still reads the **old 80-byte public salt layout**, not the new 16-byte layout. Its exact RS membership test scored 1 on the retained [earlier positive image](evidence/prior-public-salt-positive.png), and 0 on the new representative files and plain cover; see [public-detector-check.json](evidence/public-detector-check.json). All 120 new photographic encodings scored 0 on that old-code detector. Its photographic test AUC is 0.5 for both candidates. This confirms removal of that particular signal, not removal of all signals.

The complete-format detector includes all twelve prior statistical features, ten new public-salt/position signature and reference features, and the old code test. Models fit training sources only. Validation negatives alone set thresholds; no test scores select them. The table gives source-weighted test results over three test photographs, keeping their two dimensions together.

Both nominal validation targets, 1% and 5%, selected the same achieved test rates in this run. **They did not produce a 1% or 5% population false-positive result.**

| Method | Useful bytes | Complete AUC | Source-bootstrap AUC 95% interval | Achieved detection | Achieved false positives |
| --- | ---: | ---: | --- | ---: | ---: |
| No repair | 64 | 0.4722 | 0–0.9340 | 16.67% | 33.33% |
| Repair p32 | 64 | 0.4722 | 0–1 | 16.67% | 33.33% |
| Filler-on | 64 | 1.0000 | 1–1 | 100% | 16.67% |
| Filler-off | 64 | 0.5833 | 0.5833–0.7500 | 33.33% | 33.33% |
| No repair | 512 | 0.5000 | 0–1 | 16.67% | 16.67% |
| Repair p32 | 512 | 0.5000 | 0–1 | 16.67% | 16.67% |
| Filler-on | 512 | 0.9722 | 0.9444–1 | 66.67% | 0% |
| Filler-off | 512 | 0.5278 | 0.5000–0.6840 | 50% | 50% |
| No repair | 2048 | 0.3611 | 0–0.7500 | 16.67% | 16.67% |
| Repair p32 | 2048 | 0.3611 | 0–0.7500 | 16.67% | 0% |
| Filler-on | 2048 | 1.0000 | 1–1 | 33.33% | 0% |
| Filler-off | 2048 | 0.6389 | 0.5000–1 | 0% | 0% |

AUC below 0.5 is retained as measured, not inverted or described as stronger hiding. It can mean poor generalization or reversed ranking. The salt-signature-only candidate AUCs equal 0.4722, 0.5000 and 0.3611 at these loads; no new perfect public signature was observed on these test photographs. That absence does not establish safety.

### Frozen paired comparison

The rule requires a strictly positive paired source-bootstrap interval for `AUC(filler-on) − AUC(candidate)`, no higher achieved detection **or** false-positive rate at both validation targets, and no newly perfect public detector. All three useful loads must pass before a profile-wide improvement claim.

| Candidate | Useful bytes | Paired AUC improvement | Paired 95% interval | Frozen result |
| --- | ---: | ---: | --- | --- |
| No repair | 64 | 0.5278 | 0–1 | Inconclusive: interval includes zero; higher FPR |
| Repair p32 | 64 | 0.5278 | 0–1 | Inconclusive: interval includes zero; higher FPR |
| No repair | 512 | 0.4722 | 0–0.9604 | Inconclusive: interval includes zero; higher FPR |
| Repair p32 | 512 | 0.4722 | 0–1 | Inconclusive: interval includes zero; higher FPR |
| No repair | 2048 | 0.6389 | 0.25–1 | Inconclusive: higher FPR |
| Repair p32 | 2048 | 0.6389 | 0.25–1 | Demonstrated exploratory improvement at this load only |

Repair minus no-repair complete-format AUC was zero at each load; the paired bootstrap interval was also zero on these few sources. This is **not proof of no repair detection penalty**. Source resampling cannot expose sources or detectors that were never measured. At 2048 bytes repair had a lower achieved FPR in this run, not a generally safer construction.

The 500 bootstrap replicates resample whole test sources and retain both classes and dimensions. Models and thresholds stay fixed. These intervals omit training, threshold-selection, photographer, preprocessing, corpus-selection and adaptive reuse uncertainty. With only three convenience test sources, even zero false-positive source groups does not support low population rates; the conditional one-sided 95% binomial upper bound would be about 63.2% if independent representative-source assumptions held, which this corpus does not establish.

### Flat and smooth covers

Flat/gradient stress covers were scored separately, never used to fit photographic models or thresholds. Candidate complete-format stress AUCs were 0.125 at 64/512 bytes, 0.125 for no-repair at 2048 and 0.0625 for repair at 2048. These low/reversed scores show that this trained detector does not establish a useful stress-cover acceptance rule. They are not evidence of invisibility. The old all-zero RS code can also be present in a plain synthetic cover, so public scores were measured for covers rather than assumed absent.

The photographic set includes smooth/defocused sources; grayscale expansion and nearest-neighbor resizing are explicit corpus limitations. No supported flat/smooth threshold was obtained. No support is inferred for screenshots, illustrations, transparency-heavy images or unseen natural photographs. The PNG adapters reject nonopaque input for this experiment.

## Recovery: keep salt failures in the denominator

These are **exact authenticated recoveries / all declared cases**, not cases conditional on salt survival. Each 1% row has 32 covers × three loads × three declared seeds. Damage cases are separate, not cumulative; mutation and selection rules are fixed in the protocol.

| Method | Unchanged | One-channel ±1 at 1% of pixels | Random RGB replacement at 1% of pixels |
| --- | --- | --- | --- |
| No repair | 96/96 | 3/288 | 1/288 |
| Repair p32 | 96/96 | 97/288 | 67/288 |
| Filler-on | 96/96 | 0/288 | 0/288 |
| Filler-off | 96/96 | 0/288 | 0/288 |

Photographs alone: repair recovered 61/180 one-channel cases and 40/180 RGB cases; no-repair recovered 1/180 in each. Stress covers alone: repair recovered 36/108 and 27/108; no-repair recovered 2/108 and 0/108. These subdivisions do not remove any failure from the full counts.

**Salt diagnostics:** 191/288 one-channel cases and 221/288 RGB cases had at least one changed salt byte, identically in both candidates. Every one failed. The repair candidate recovered every remaining declared random-damage case in this run. That diagnostic explains its observed failures; it does not change the denominator or promise a recovery rate. Header damage and per-codeword message damage are separate fields in the raw rows.

For the representative localized cases at each size, repair recovered both central patches and both center stripes (4/4); no-repair recovered none (0/4). Both candidates failed both targeted salt-bit cases. The salt positions were not damaged in the successful localized cases. No whole-image 1% survival envelope follows.

## Bounds, authentication and earliest password verifier

- All eight compressed/uncompressed pixel-preserving PNG rewrite observations recovered exactly, and their RGB bytes matched.
- All 113 standalone [boundary observations](evidence/boundaries.json) passed: Unicode including combining forms and NUL; exact capacity and +1 rejection; full/shortened final blocks; raw/header/payload damage; wrong or missing profile; wrong password; 1024-byte password boundary, malformed Unicode and oversized inputs; authenticated metadata changes; changed/shortened tags; gzip errors and output bounds.
- Repair recovered the tested 16-byte payload and 32-byte header errors. The corresponding 17/33-byte cases failed safely. No-repair failed targeted header/payload byte changes. There was no weaker fallback.
- Decompression instrumentation observed no decompressor construction for a repair-consistent but unauthenticated ciphertext. Validly authenticated over-bound or invalid gzip data failed without plaintext output.
- The primitive [key-chain observations](evidence/key-chain.json) matched the prior independently checked Argon2 root, both child keys, the CTR prefix, explicit HMAC/HKDF assembly and a separate small-domain placement reference across a stream refill.
- The independent [repair observations](evidence/rs-vectors.json) matched all 18 codeword/shortening vectors. All 162 within-radius patterns recovered; the 54 ordinary beyond-radius patterns rejected. All 18 constructed beyond-radius ambiguities deliberately miscorrected to another valid codeword. This is why repair is never authentication.

Inspection of `codec.mjs:180–204` identifies the earliest useful password verifier. Public geometry/profile/password-input checks reject malformed input but do not verify a valid password guess. `deriveKeys` performs Argon2id before keyed header extraction. For repair, header RS decoding supplies an early recognizer; for no-repair, the structured header's lengths, profile bytes and reserved zeros do. Both are **earlier than GCM**, but require placement derived from the expensive root. An attacker need not perform full payload repair/decompression for each rejected guess. This inspection and the exercised paths are not an independent audit or an attacker-throughput benchmark.

Both actual browser/CLI PNG exchange directions passed for both profiles. Wrong-password and salt-bit failures showed `message: null`. See [BROWSER.md](BROWSER.md), [browser.json](evidence/browser.json) and [cli-exchange.json](evidence/cli-exchange.json). These adapters are the spike, not an implemented production migration.

## Space, capacity and visual effects

Stored useful bytes equal useful bytes in the main uncompressed matrix. Each candidate includes salt16, header data36 (nonce12 plus framing24), and GCM tag16. Repair adds header parity64 and payload parity32 per block. Final shortened blocks have no padding. [raw.json](evidence/raw.json) records every overhead field, including legacy base64 expansion, separators, end marker and filler bits.

| Useful bytes | No-repair total bytes | Repair total bytes | Added repair bytes | Increase over no-repair | Legacy framed bytes, either filler setting |
| --- | ---: | ---: | ---: | ---: | ---: |
| 64 | 132 | 228 | 96 | 72.73% | 178 |
| 512 | 580 | 740 | 160 | 27.59% | 774 |
| 2048 | 2116 | 2500 | 384 | 18.15% | 2822 |

For repair, the final payload blocks hold 80, 82 and 57 data bytes at these loads, each plus 32 parity bytes. The legacy framed-byte column excludes filler: filler-on writes all remaining RGB low bits as well.

| Image | No-repair physical/operational stored-byte capacity | Repair physical/operational stored-byte capacity |
| --- | ---: | ---: |
| 256×256 | 24508 | 21372 |
| 512×512 | 98236 | 85839 |

Each listed maximum round-tripped; maximum+1 rejected. These are storage and work-budget bounds, **not evaluated concealment limits**. The evaluated occupied-sample fractions range from 0.1343% to 8.6100% without repair and 0.2319% to 10.1725% with repair across the three loads and two sizes. No safe net capacity cap is proposed.

Across all covers and dimensions, candidate low-bit replacement changed samples only by one intensity level. At 2048 useful bytes, no-repair changed 8257–8556 RGB samples with PSNR 61.74–67.92 dB; repair changed 9770–10155 with PSNR 61.00–67.19 dB. Filler-on changed 97516–393918 samples with PSNR 51.13–51.18 dB at that load. These image-quality measurements do not establish concealment. Representative [original](evidence/original.png), [no-repair](evidence/no-repair.png), [repair](evidence/grouped-p32.png) and damaged counterparts are retained.

## Time and memory

The separate [cost run](evidence/cost.json) used a fresh Node process per profile, one first-use encode and three warm iterations, a 512×512 cover and 2048 useful bytes. All eight encode/decode pairs recovered exactly.

| Profile | First-use encode ms | Warm encode range ms | Decode range ms, all warm key-library state | Process peak RSS bytes |
| --- | ---: | --- | --- | ---: |
| No repair | 145.69 | 104.35–106.27 | 105.67–106.89 | 196575232 |
| Repair p32 | 147.33 | 108.30–110.19 | 103.88–108.80 | 216694784 |

This is codec work after PNG/corpus loading, not a full application benchmark. The processes loaded the corpus before selecting one cover; RSS includes runtime, retained/collectable corpus memory and WASM. The memory difference is not an isolated causal repair-allocation estimate. The small sequential sample does not establish a statistically reliable timing penalty. Complete CLI file-operation elapsed times and browser operations are recorded separately in their raw exchange files.

Browser first no-repair decode was 208.6 ms; later repair decode was 101.5 ms in the same page. Those cold/warm conditions differ, so they are not a repair comparison. Browser JavaScript heap readings omit WASM, decoder, canvas, GPU and other process memory. Whole-browser peak memory, responsiveness under large operations, maximum-geometry decoding, cancellation, phone behavior and the final integrated format remain unmeasured.

## Verification and run corrections

- `agent-local npm run spike-unprotected-salt -- --quick`: training-cover smoke completed, 28 decode rows and 26 edge rows; not used as held-out findings.
- `agent-local npm run spike-unprotected-salt`: full frozen matrix completed; no incorrect authenticated output in 2720 decode rows or 52 edge observations.
- `agent-local node spikes/unprotected-salt/cost.mjs`: all eight pairs exact.
- Standalone key-chain, boundary and independent repair observations completed as recorded above; browser bundle built and actual PNG exchange passed.
- `agent-local npm test -- --runInBand`: **5 suites, 104 tests passed** with the spike present.
- `agent-local npm run build`: production Vite build passed with the spike present. No typecheck/lint commands are defined. No permanent tests were added.

The first key observation failed because a copied expected 32-byte CTR prefix had 65 hex characters. The source reference had 64. The extra trailing nibble was removed before any image scoring; codec and detector algorithms did not change. [freeze-before-reference-fix.json](evidence/freeze-before-reference-fix.json) retains the first hashes, and the final freeze records the correction. The rerun passed all twelve primitive checks. The browser automation also changed its observation method from an inaccessible page-global function to visible DOM state; no app change was needed.

The legacy controls emitted Node's deprecation warning for short GCM tags during damaged-input decoding. Their existing behavior was retained, not suppressed or silently repaired. The root build reported the existing out-of-root `dist` warning, stale Browserslist data, dependency `eval`, and a large bundle. Those warnings do not change this experiment's result and were not used to expand production scope.

## Decision returned to the map

| Choice | Supported conclusion from this experiment |
| --- | --- |
| Carrier/discovery | The raw-salt construction removes the old public-code signal, but complete-format improvement remains inconclusive across the declared loads. No production carrier selected. |
| Repair/interleaving | Grouped p32 repairs useful damage in this matrix, at measured space cost, while leaving salt failures fatal. No production repair profile selected. |
| Cover suitability | No validated rule or threshold. The convenience corpus and flat/smooth stress results do not justify an accepted cover class. |
| Net capacity cap | None. Physical capacity and one favorable exploratory load do not supply a safe cap. |

Human acceptance would accept these findings and return the unresolved choices to the hiding decision. It would not approve production parameters, close the format decision, waive device evidence or prove invisibility.

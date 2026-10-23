# Complete-message image survival: measured findings

Question: [Measure what an encoded image can survive](https://github.com/jdragulanescu/obscr/issues/16).

Status: experiment complete; **human acceptance pending**. No product mode, numeric recovery guarantee, or production format is selected.

## TL;DR

- Five-copy RGB low-bit encoding recovered all tested 1% sparse pixel-change cases, including the initial decoding data. It recovered none of the tested JPEG or resize cases. Repairing bits does not restore a changed coordinate grid.
- The two block-transform candidates recovered all feasible JPEG-only cases at the tested qualities. Their resize-then-JPEG recovery was poor. Both held only **106 stored message bytes** in a 512 × 512 image after complete framing and repair overhead.
- Every encoded fixture was detectable without its password through the public bootstrap signature. The transform candidates also produced visible patterned changes on the inspected smooth cover. These candidates do **not** satisfy a concealment requirement merely because some transforms preserve their messages.
- No incorrectly authenticated plaintext was observed. All unchanged-file, correction-radius and capacity controls behaved as specified. This is bounded experimental evidence, not a security audit or natural-photo/service/device support claim.

## Evidence and reproduction

- [Protocol and commands](README.md); [source](codec.mjs); [runner](run.mjs); [dependency lock](package-lock.json).
- [Machine, versions, source hashes and aggregate results](evidence/m3-max/manifest.json).
- Raw rows: [LSB without redundancy](evidence/m3-max/lsb-1.json), [five-copy LSB](evidence/m3-max/lsb-5.json), [QIM spacing 32](evidence/m3-max/qim-32.json), [QIM spacing 64](evidence/m3-max/qim-64.json).

Executed command:

```sh
agent-local npm run spike-image-survival -- --out spikes/image-survival/evidence/m3-max
```

The full run started at 2026-10-23 19:19:15 UTC and ended at 19:24:20 UTC. Device: Apple M3 Max, Mac15,8, 64 GiB RAM; Darwin 25.6.0 arm64; Node v24.13.0. Image path: Sharp 0.34.5, libvips 8.17.3, libspng 0.7.4, JPEG library revision `0826579`; all reported component versions are in the manifest. Sharp's `mozjpeg` optimization option was false; the library build identity still reports its bundled JPEG component as `mozjpeg`.

There were 216 requested fixtures, 198 encodings, 18 capacity rejections and **5,940 transform/decode rows**. There were also 36 plain-cover checks and 12 capacity-boundary trials. The image set has seven distinct synthetic covers; the repeated flat-cover seeds and message variants are not independent source images. No external service or browser was involved.

The earlier smoke run and full run shared 240 transform cases. All 240 transformed-file SHA-256 hashes and outcomes matched exactly. The manifest's hashes also matched the final codec, runner and spike lockfile. Timings are not expected to repeat exactly.

The root suite ran afterward, without measurement contention: `agent-local npm test -- --runInBand` reported **5 suites and 104 tests passed**. This checks application-suite isolation, not the security or correctness of every experimental path. No application code changed. No app build or real browser/CLI exchange was claimed.

## Equal-message comparison

These rows use **32 raw message bytes**, no compression, across the same nine cover/seed cases per profile. Entries are exact authenticated recoveries out of nine. Three cases share the same flat cover; these are counts, not population success probabilities.

| Transform | LSB, one copy | LSB, five copies | QIM 32, three copies | QIM 64, three copies |
|---|---:|---:|---:|---:|
| One channel ±1 at 1% of pixels | 0/9 | 9/9 | 9/9 | 9/9 |
| One channel ±1 at 5% of pixels | 0/9 | 9/9 | 9/9 | 9/9 |
| Random RGB replacement at 1% of pixels | 0/9 | 9/9 | 0/9 | 9/9 |
| Resize 512 → 384, Lanczos3 | 0/9 | 0/9 | 6/9 | 6/9 |
| Resize 512 → 256, Lanczos3 | 0/9 | 0/9 | 3/9 | 1/9 |
| JPEG quality 85, 4:2:0 | 0/9 | 0/9 | 9/9 | 9/9 |
| Resize to 384 → JPEG85 | 0/9 | 0/9 | 0/9 | 1/9 |
| Clear every RGB lowest bit | 0/9 | 0/9 | 9/9 | 9/9 |

**The order of transformations matters.** Success at JPEG alone and success at resize alone do not establish success when both occur. Increasing the QIM spacing did not monotonically improve resizing: geometric resampling changes the coefficient signal, not just its small-noise margin.

## Complete matrix and limits

These aggregates include all feasible 32-, 96- and 256-byte raw/gzip fixtures. QIM rejects all nine raw 256-byte messages for capacity. Its denominator is therefore different; do not rank candidates from these columns without the equal-message table above.

| Condition | LSB 1 | LSB 5 | QIM 32 | QIM 64 |
|---|---:|---:|---:|---:|
| Feasible encodings | 54 | 54 | 45 | 45 |
| Capacity rejection | 0 | 0 | 9 | 9 |
| Unchanged file | 54/54 | 54/54 | 45/45 | 45/45 |
| Pixel-preserving PNG rewrite | 54/54 | 54/54 | 45/45 | 45/45 |
| One channel ±1 at 0.1% of pixels | 25/54 | 54/54 | 45/45 | 45/45 |
| One channel ±1 at 1% of pixels | 1/54 | 54/54 | 45/45 | 45/45 |
| One channel ±1 at 5% of pixels | 0/54 | 53/54 | 45/45 | 45/45 |
| One channel ±1 at 20% of pixels | 0/54 | 3/54 | 45/45 | 45/45 |
| Random RGB replacement at 1% of pixels | 1/54 | 54/54 | 1/45 | 45/45 |
| Centered black 64 × 64 patch | 0/54 | 53/54 | 35/45 | 37/45 |
| Full-width black stripe, eight rows | 1/54 | 54/54 | 14/45 | 14/45 |
| Resize to 384 | 0/54 | 0/54 | 30/45 | 28/45 |
| Resize to 256 | 0/54 | 0/54 | 15/45 | 2/45 |
| JPEG95 / JPEG85 / JPEG60, each | 0/54 | 0/54 | 45/45 | 45/45 |
| JPEG85 twice | 0/54 | 0/54 | 45/45 | 45/45 |
| Resize384 → JPEG85 | 0/54 | 0/54 | 0/45 | 4/45 |
| JPEG95 → resize384 → JPEG75 | 0/54 | 0/54 | 0/45 | 0/45 |
| Clear lowest bit | 0/54 | 0/54 | 45/45 | 45/45 |
| Clear lowest four bits | 0/54 | 0/54 | 15/45 | 45/45 |

The raw reports hold all thirty conditions, failures by stage, file hashes, and carrier/codeword error counts. For example, QIM64 after resize384 → JPEG85 stopped at bootstrap in seven cases and authentication in 34, with four exact recoveries. There is no basis to call that sequence supported.

### Initial decoding data and safe failure

All four candidates protect the salt, nonce, interpretation fields and length through their own repair layer before authentication. The no-redundancy profile naturally has a correction radius of zero.

- All 198 encodings recovered after a targeted bootstrap codeword was changed within its repetition-code radius. The corresponding payload cases also recovered.
- One additional erroneous copy made every targeted bootstrap case reject at bootstrap and every targeted payload case reject at authentication. A majority vote beyond its radius is not authenticated recovery.
- All 198 wrong-password cases rejected at authentication. All 198 malformed-length cases rejected at bootstrap, before the KDF. All 396 half-file truncation/invalid-signature cases rejected as unreadable images.
- Plain covers never produced authenticated output. Capacity minus one and exact capacity recovered for each candidate; capacity plus one was rejected before encoding.
- Across the transform rows, 2,787 messages recovered exactly. The remaining outcomes were 1,453 bootstrap rejections, 872 authentication rejections, 432 geometry rejections and 396 image-parse rejections. **Zero incorrect authenticated messages were observed.** These counts include deliberately destructive conditions and are not an overall reliability score.

Payload repair cannot rescue an unreadable PNG container. Nor does survival of low-bit clearing mean resistance to deliberate removal: an attacker can destroy or replace the whole image. The bootstrap is public and therefore itself a target.

## Capacity, disturbance and detection

| Profile | Net stored-byte capacity | Coded bits for 32 raw bytes | Embedding PSNR range for 32 raw bytes | Public detector on all encodings | Plain-cover false positives |
|---|---:|---:|---:|---:|---:|
| LSB 1 | 98,240 | 768 | 80.92–82.19 dB | 54/54 | 0/9 |
| LSB 5 | 19,596 | 3,840 | 74.14–75.10 dB | 54/54 | 0/9 |
| QIM 32 | 106 | 2,304 | 42.26–43.59 dB | 45/45 | 0/9 |
| QIM 64 | 106 | 2,304 | 36.34–37.62 dB | 45/45 | 0/9 |

Capacity includes the 48-byte bootstrap, 16-byte tag and all copies. For the QIM candidates, those fixed fields consume 1,536 of 4,096 available block slots before any message data. Gzip allowed the deliberately repetitive 256-byte messages to fit, but did not make the raw 256-byte cases fit.

The detector has no password: it reads the known bootstrap mapping and checks its magic/version/profile. The complete formats are therefore readily distinguishable on these controls even where PSNR is high. Zero false positives among a few generated covers does not establish a natural-photo false-positive rate or statistical concealment. No trained detector, ROC/AUC or photographic corpus was evaluated; there is no justified natural-image confidence interval.

Visual inspection of the saved smooth-cover examples showed fine block-pattern changes in both QIM outputs, stronger at spacing 64. The ×16 absolute residual exposes the occupied block pattern. This was one inspection at native image size, not a blinded quality study. The exact originals and outputs are linked below; they are the evidence, not a claim of universal visibility.

- [Original smooth cover](evidence/m3-max/qim-64-cover.png)
- [QIM32 output](evidence/m3-max/qim-32-encoded.png)
- [QIM64 output](evidence/m3-max/qim-64-encoded.png)
- [QIM64 absolute residual, ×16](evidence/m3-max/qim-64-residual-x16.png)
- [QIM64 resize384 → JPEG85](evidence/m3-max/qim-64-resize384-jpeg85.jpg)

## Device cost

Measurements are from one desktop device. Encoding time covers the full encoding path; decoding values below use only cases that recovered exactly. A quick rejection is not compared with a complete successful decode.

| Profile | Encode median / p95 | Exact decode median / p95 | Whole-worker peak RSS |
|---|---:|---:|---:|
| LSB 1 | 11.83 / 19.05 ms | 38.79 / 45.58 ms | 386.3 MiB |
| LSB 5 | 12.23 / 20.76 ms | 39.07 / 51.74 ms | 391.7 MiB |
| QIM 32 | 16.48 / 24.25 ms | 10.81 / 17.31 ms | 312.6 MiB |
| QIM 64 | 21.47 / 36.15 ms | 13.41 / 24.35 ms | 297.7 MiB |

These are descriptive timings over different workloads. Public-order caching, different slot counts, unequal feasible-message sets and different successful transforms affect them. The first profile use includes order initialization; later uses are warm. Peak RSS includes the experiment, retained report rows, native codec memory and boundary trials. It is not a single-decode memory estimate. None of these numbers establishes a browser, mobile or lower-memory-device budget.

## What this comparison can support

The experiment supplies concrete evidence for the next [Choose hiding and recovery behavior](https://github.com/jdragulanescu/obscr/issues/17) discussion:

- Limited same-grid damage repair and resize/JPEG recovery need different carrier work. The repair overhead is real and the initial decoding data must be protected.
- These robust-carrier candidates buy some JPEG tolerance with very low capacity, greater image disturbance and a known detection signature. They are not acceptable production designs under a concealment-first goal without further design work.
- Combining supported-looking transforms can still fail. A numeric product promise needs a named profile, appropriate image population, message sizes, device evidence and actual transfer trials where relevant.

This does **not** prove that repetition is the best repair code, that QIM is the best robust carrier, or that no better resize/JPEG method exists. RS/BCH, adaptive hiding, secret/public framing tradeoffs, larger images, natural covers, other interpolation/color/alpha paths, cropping/rotation, real services and browser/mobile measurements remain unmeasured. The research report's larger experiment matrix was not silently treated as completed.

The human decision for this ticket is only whether these measurements provide enough comparison to proceed to the recovery-choice discussion, or whether to extend the experiment first. It does not select a mode or approve a release guarantee. Until that agreement, this ticket stays open and its dependents stay blocked.

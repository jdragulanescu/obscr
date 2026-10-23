# Detector protocol: unprotected public salt

This disposable experiment answers [Measure hiding with an unprotected random salt](https://github.com/jdragulanescu/obscr/issues/31). Freeze this document, `detection.mjs`, the wire specification, and codec bytes before held-out scoring. Record the frozen hashes with the run. Do not select features, model settings, thresholds, or loads from the new test results. The prior experiment already evaluated these photographs: the present splits are source-separated, not newly unseen research data.

## Inputs and scope

The methods are `no-repair`, `grouped-p32`, `legacy-filler-on`, and `legacy-filler-off`. The useful plaintext loads are 64, 512, and 2048 bytes. Use the same message bytes per load. Run every method/load on all 32 covers: ten photographs at two sizes, and twelve deterministic stress covers. Preserve the source split in CORPUS.md. A size or payload is not an independent source.

`detection.mjs` exports:

- `featureNames`: all 22 features, in their array order.
- `statisticalFeatureNames`: the original 12 features.
- `saltFeatureNames`: the ten new signature and reference features.
- `features(rgb, width, height)`: the 22-number array, with no password or codec import.
- `publicScore(rgb, width, height)`: exact membership in the **old** public RS code, returning 0 or 1.
- `analyze(rows, {seed, bootstrapReplicates})`: a machine-readable report. Defaults are seed `unprotected-salt-detection-v1` and 500 replicates.

Each row supplies `sourceGroup`, `split` (`train`, `validation`, or `test`), `method`, `load` (useful plaintext bytes), `coverFeatures`, `encodedFeatures`, `coverPublicScore`, and `publicScore`. Supply `kind`, a stable cover `id`, `width`, and `height` as well. Optional `seed` identifies repeated fixtures and must match across methods for paired comparisons. Both public scores must be measured binary results, including the untouched cover.

Identical duplicate rows are removed. Conflicting rows with the same method/load/source/cover/size/seed identity are rejected. Any source assigned to multiple splits is rejected. A method/load missing a photographic split has status `insufficient-splits`; it has no fitted result. Missing baselines and unmatched test pairs are explicit report states, not zero effects.

## Fixed features

### Original statistical features (indices 0–11)

Preserve the earlier formulas and order:

1. Red, green, and blue even/odd histogram-pair chi-square sums, each divided by pixel count.
2. Red, green, and blue absolute LSB frequency imbalances from 0.5.
3. Horizontal, vertical, and adjacent-channel LSB disagreement rates.
4. Horizontal and vertical rates of sample differences at most one.
5. Horizontal low-two-bit agreement rate.

### New salt-position signatures (indices 12–21)

Let `G = floor(3 * width * height / 8)`. New salt byte `i` occupies group `floor(i * G / 16)`, for `i = 0..15`. Its bits occupy the eight consecutive RGB samples in that group, most-significant bit first. There is no public parity, checksum, marker, or repeated salt. Both new profiles have this identical public layout.

A salt bit is a low bit at one of these 128 sample indices. A non-salt bit is any other RGB low bit, including unused trailing samples. Let bit bias be the fraction of ones minus 0.5. Map a bit `b` to spin `2*b - 1`. Correlation here means the mean product of two spins, not a mean-centered Pearson coefficient. Thus independent balanced bits have expected correlation zero, and equal constant bits have correlation one.

Consecutive salt pairs are adjacent RGB sample indices **inside one salt byte**, never pairs across a byte boundary or a gap. Cross-channel salt pairs are the subset of those pairs inside the same RGB pixel (R/G or G/B). Consecutive non-salt pairs have both sample indices outside salt positions. Cross-channel non-salt pairs are their within-pixel subset. Empty pair sets use zero; corpus dimensions provide nonempty sets.

The ten features, in order, are:

1. Salt bit bias.
2. Absolute salt bit bias.
3. Salt consecutive-spin correlation.
4. Salt cross-channel-spin correlation.
5. Non-salt bit bias.
6. Non-salt consecutive-spin correlation.
7. Non-salt cross-channel-spin correlation.
8. Salt minus non-salt bit bias.
9. Salt minus non-salt consecutive-spin correlation.
10. Salt minus non-salt cross-channel-spin correlation.

The signature-only model includes the reference features because they define contrast with the rest of the image. It does not use the original twelve global statistical features. These signatures are measured at the declared new salt positions for every method, including both legacy controls and plain covers. Nothing is inferred from a decoder outcome.

## Old public-code detector: separate positions

Read **80** bytes at groups `floor(i * G / 80)`, for `i = 0..79`, again MSB first in eight consecutive RGB samples. This is the prior RS(80,16) record: 16 systematic salt bytes followed by 64 parity bytes over the existing GF(256) implementation.

Re-encode the first 16 extracted bytes with `rsEncode(data, 64)`. Score 1 only if all 80 encoded bytes equal the extracted record. Otherwise score 0. Error repair is not a positive result. This exact-membership test is equivalent to the earlier decode-then-re-encode equality test for valid records, without running a correction decoder on unrelated covers. An all-zero record is a codeword and must score 1, including on a cover. Images with fewer than 80 byte groups score 0; invalid geometry is an error.

Do not call the new codec's `readSaltCode` here. That function reads 16 bytes at different positions. The detector owns the old layout and imports only `rsEncode`, never `codec.mjs`.

## Fit and four reported detectors

Each method/load fits separate diagonal regularized linear discriminants on **photographic training sources only**. Every source contributes total weight one to each class; divide that weight equally among its sizes and fixture repetitions. For each feature, use the class-mean difference divided by the pooled within-class variance plus the fixed ridge 0.0001. Center at the midpoint of the class means. Do not select model settings on validation or test sources.

- `statistical-only`: a model fitted on indices 0–11.
- `salt-signature-only`: a model fitted on indices 12–21.
- `old-public-code-only`: the binary exact old-code score; no fitted model.
- `complete-format`: a model fitted on all 22 features, plus the binary old-code result. For fitted linear score `s`, the combined score is `2 * publicScore + 0.5 + atan(s) / pi`. Every public-code positive ranks above every negative; all predeclared numerical features break ties through the training-only fit.

Complete-format results are mandatory. A weak statistical-only result cannot override a stronger public detector. These are simple, predeclared detectors, not state-of-the-art steganalysis or a proof that other detectors cannot work.

## Validation thresholds and reported rates

For each detector and method/load, validation negatives alone select thresholds at target FPRs 0.01 and 0.05. Predictions use score greater than or equal to threshold. Select the least restrictive observed negative-score threshold whose source-weighted validation FPR is at most the target. If no observed negative score qualifies, use a representable value just above the maximum negative score. Ties stay together. Test scores never select thresholds. A single validation source can exceed either nominal target on this small corpus.

Report the actual TPR and FPR at those fixed thresholds on training, validation, and test sources. Include the full ROC curve and trapezoidal ROC AUC with equal scores grouped. Test ROC thresholds describe the curve only; they are not selected deployment thresholds. AUC is not inverted after inspecting test results. Stress test rows are scored separately with the same models and validation thresholds. Stress rows never train a model or set a threshold.

The output contains feature lists, detector names, seed, replicate count, duplicate count, weighting, combination rule, decision rule, scope, `reports`, and `comparisons`. Each measured report contains method/load, split source counts, the four detectors and their fitted model (null for old code), and corpus limits. A detector has `train`, `validation`, `test`, `uncertainty`, and `stress`. ROC/AUC is at `test.roc`; achieved rates are at `test.operatingPoints`.

## Paired uncertainty and comparisons

Single-method 95% intervals use 500 default seeded bootstrap draws of whole test source groups with replacement. Both classes, both dimensions, and all fixture repetitions remain together. Models and validation thresholds stay fixed. A duplicate source draw repeats its complete class weight; output dimensions never become independent draws.

For each new profile/load, compare against `legacy-filler-on`. For `grouped-p32`, also compare against `no-repair` at the same load to measure repair penalty. No-repair is not compared with itself. Legacy filler-off still receives all four full detector reports. Each comparison includes all four detectors.

Before paired estimation, require exact equality of photographed test source/cover/size/seed identities, in both classes. Do not silently reduce to their intersection. Use the **same whole-source draw** for candidate and baseline within each replicate. Each method retains its separately trained model and its own validation-selected thresholds.

Report:

- `aucImprovement`: baseline AUC minus candidate AUC, with a paired percentile 95% interval. Positive means less detectable.
- `aucPenalty`: candidate AUC minus baseline AUC and its sign-reversed interval. Positive means more detectable.
- At each validation target, both achieved rate pairs and candidate-minus-baseline TPR/FPR differences, with paired percentile 95% intervals.

The paired seed and draw count are returned. Intervals cover test-source sampling only. They omit model-fitting, threshold-selection, photographer, preprocessing, corpus-selection, and adaptive reuse uncertainty. Three test sources can produce discrete or degenerate intervals. No multiple-comparison adjustment or population-level significance claim is made.

## Frozen improvement decision

For each candidate and useful-byte load against filler-on, report `demonstrated-exploratory-improvement` **only if all three conditions hold**:

1. The complete-format paired 95% interval for `AUC(filler-on) - AUC(candidate)` has a lower endpoint strictly greater than zero.
2. At **both** fixed validation target FPRs, the candidate's achieved test TPR and achieved test FPR are no higher than the baseline's. This conservative rule does not confuse equal nominal target FPR with equal achieved FPR. Numerical rate comparisons allow only 1e-12 roundoff.
3. Neither public detector becomes newly perfect: a salt-signature-only or old-public-code-only candidate test AUC exactly 1, where that same baseline detector's test AUC is not 1, vetoes improvement. This is a conservative empirical perfect-ranking veto, not a claim that a universal perfect detector exists or a threshold tuned on test data. The four detector reports expose any already-perfect baseline and candidate results too.

Otherwise report `inconclusive`. Failure to demonstrate improvement is not equivalence. Comparison against no-repair reports `penalty-estimate`, not an improvement claim. A profile-wide improvement claim requires every declared load to pass; do not choose only a favorable load or detector.

This frozen criterion answers a narrow exploratory question. Ten named, preprocessed photographs with only three test sources, already evaluated in a prior experiment, cannot establish population invisibility, a safe payload capacity, production readiness, or phone approval. An inconclusive result is a complete and valid outcome.

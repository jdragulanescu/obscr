# Photographic corpus and detection protocol

This is an offline prototype corpus, not a representative camera-image benchmark. It contains actual photograph pixels. No generated cover is described as a photograph. No detector result is claimed in this document; the experiment runner must produce those results.

## Sources and rights

`photos/manifest.json` records every original file URL, original SHA-256, Git blob ID, stored PNG SHA-256, author, source group, split, and license evidence. Original JPEG files are retained beside their decoded PNG files. Original PNG files are unchanged.

The primary sources for the included sample-image distributions are:

- [scikit-image v0.24.0 dataset definitions and license statements](https://github.com/scikit-image/scikit-image/blob/v0.24.0/skimage/data/_fetchers.py).
- [scikit-learn 1.5.2 photograph attribution and license statements](https://github.com/scikit-learn/scikit-learn/blob/1.5.2/sklearn/datasets/images/README.txt).
- [Creative Commons Attribution 2.0](https://creativecommons.org/licenses/by/2.0/) for `china.jpg` and `flower.jpg`. Attribution is retained below and in the manifest. These copies are decoded and cropped/resampled by the loader; they are not unmodified displays of the originals.
- [Creative Commons CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) for the entries marked CC0.

| Source group | Split | Kind | Attribution and rights |
| --- | --- | --- | --- |
| skimage-brick | train | textured | CC0Textures, Bricks25; CC0. scikit-image applied perspective correction, rotation, crop, and scaling. |
| skimage-camera | train | smooth | Lav Varshney; CC0. This is the replacement camera image introduced in scikit-image 0.18, not the earlier restricted image. |
| skimage-chelsea | train | textured | Stefan van der Walt; CC0. |
| sklearn-china | train | textured | danielbuechele; CC BY 2.0. [Original Flickr record](https://www.flickr.com/photos/danielbuechele/6061409035/sizes/z/in/photostream/). |
| skimage-clock | validation | smooth | Stefan van der Walt; public domain dedication. The camera was moved during capture. |
| skimage-grass | validation | textured | linolafett; CC0. [Original source](https://www.deviantart.com/linolafett/art/Grass-01-434853879). scikit-image cropped and converted it to grayscale. |
| skimage-rocket | validation | smooth | SpaceX; public domain dedication, as recorded by scikit-image. [Original Flickr record](https://www.flickr.com/photos/spacexphotos/16511594820/in/photostream/). |
| skimage-gravel | test | textured | CC0Textures, Gravel04; CC0. scikit-image scaled, cropped, and converted it to grayscale. |
| skimage-retina | test | smooth | Mikael Häggström; CC0. [Original clinical photograph](https://commons.wikimedia.org/wiki/File:Fundus_photograph_of_normal_left_eye.jpg). |
| sklearn-flower | test | smooth | CC BY 2.0. The distribution README says “Some rights reserved by danielbuechele” but links the account vultilion. Both identifiers are retained here rather than resolving that mismatch without evidence. [Original Flickr record](https://www.flickr.com/photos/vultilion/6056698931/sizes/z/in/photostream/). |

“Smooth” means that the source includes broad smooth or defocused regions, not that every pixel is smooth. These labels are fixed descriptive strata, not measured texture classes. Retina is a clinical photograph, not an ordinary scene. No assertion of photographer-level independence is made: the clock and cat have the same credited photographer but are different source photographs.

## Acquisition and reproducibility

The original bytes were obtained through the harness web reader from GitHub's Contents API. Its response includes the original file as base64. Decoding that field avoids the web reader's image-preview conversion to WebP. A rendered preview is not the source image. The manifest contains the versioned source URLs and Git blob IDs needed to repeat acquisition. API requests have this form:

```text
https://api.github.com/repos/scikit-image/scikit-image/contents/skimage/data/grass.png?ref=v0.24.0
https://api.github.com/repos/scikit-learn/scikit-learn/contents/sklearn/datasets/images/flower.jpg?ref=1.5.2
```

JPEG originals were decoded once with macOS `sips -s format png INPUT --out OUTPUT`. No resizing was done during this conversion. JPEG decoding and color handling can differ across tools; the checked-in decoded PNG bytes and their manifest hashes, not a fresh platform-dependent JPEG decode, define this experiment's input. The corpus loader checks each stored PNG hash before use. No network or new image package is needed when the experiment runs; it uses the repository's `pngjs` dependency.

`covers()` returns RGB8 arrays at 256×256 and 512×512. For each source, it selects the largest centered square, then uses pixel-center nearest-neighbor sampling. Specifically, each source coordinate is `origin + floor((outputCoordinate + 0.5) * squareSide / outputSize)`. Grayscale inputs are expanded to three equal channels by the PNG decoder. The loader does not add noise, normalize colors, or blur images.

Nearest-neighbor upsampling repeats pixels when the source square is smaller than 512. This affects the cat, clock, rocket, flower, and China scene. It can make embedding easier to detect. Grayscale expansion creates equal RGB channels, which is also an easy signal for independently changed RGB low bits. These are important limits, not evidence of natural-camera performance. The original dimensions are returned with each cover so the runner can identify these cases.

The split is fixed before scoring: **4 training, 3 validation, and 3 test source photographs**. Both sizes of one source always stay in the same split. The 20 photo covers are not 20 independent photographs. Source-group counts, not output image counts, describe the sample size.

The loader also supplies 12 deterministic stress covers: a flat field and a gradient, at both dimensions, for each split. Their formulas and split-specific constants are in `corpus.mjs`. Stress covers never train the photographic detector or set thresholds. Their test results are reported separately. They are not independent natural-image evidence.

## Detector protocol

`features(rgb, width, height)` returns the numeric features named by `featureNames` in `detection.mjs`:

- Three normalized even/odd histogram-pair chi-square statistics.
- Three absolute LSB frequency imbalances.
- Horizontal, vertical, and cross-channel LSB disagreement rates.
- Horizontal and vertical rates of neighbor differences at most one.
- Horizontal low-two-bit agreement rate.

These are simple descriptive LSB and neighbor statistics. This is not a deep learned detector, a reproduction of a published state-of-the-art steganalyzer, or a proof of undetectability.

`analyze(rows, options)` takes one paired cover/encoded row per source, size, method, and load. Rows have `sourceGroup`, `split`, `method`, `load`, `coverFeatures`, `encodedFeatures`, `coverPublicScore`, and `publicScore`; the runner should also include `kind`, `id`, `width`, and `height`. Public scores are 1 for a valid public RS salt record and 0 otherwise. The cover score must be measured, not assumed to be zero. Both scores are required.

Each method/load gets its own model. A diagonal linear discriminant fits the photographed training split only, with fixed variance regularization of 0.0001. Each source gets equal weight within each class; repeated dimensions do not add independent source weight. No hyperparameter is selected from the validation or test split. Identical duplicate rows are removed. Any source-group overlap across splits is an error.

Three detectors are reported separately:

1. **statistical-only:** the fitted linear score.
2. **public-format-only:** the measured public RS salt-record score.
3. **combined-format:** public positives rank above every public negative; the bounded statistical score breaks ties within those classes. This is the complete-format detector. A candidate must not be described as undetectable by showing only detector 1.

For each detector, the validation negatives select the least restrictive observed threshold whose empirical FPR does not exceed 0.01 or 0.05. If even one false positive would exceed the target, the threshold is just above the largest negative validation score. No heldout threshold selection is performed. Reports include the full ROC curve, trapezoidal ROC AUC with ties handled together, validation rates, and actual rates at those fixed thresholds for training, validation, and test samples. Training rates are descriptive fit results, not heldout evidence.

The output is `{featureNames, seed, bootstrapReplicates, duplicateRowsRemoved, weighting, combinedRule, reports}`. Each report contains `method`, `load`, `counts`, `model`, `detectors`, and `limits`. Within each detector, ROC/AUC is at `test.roc`, and achieved rates are at `test.operatingPoints`. Stress results are in a separate `stress` field. A method/load without all three photographed splits is reported as `insufficient-splits`, never as a measured AUC.

## Uncertainty and limits

The default uncertainty calculation uses 500 seeded bootstrap replicates. It resamples whole heldout source groups with replacement and keeps paired cover/encoded rows and all sizes together. It gives percentile 95% intervals for AUC and for achieved TPR/FPR at each fixed validation threshold. The seed and replicate count are included in the report. The model and thresholds stay fixed, so the intervals describe test-source resampling only. They omit training-set, threshold-selection, photographer, corpus-selection, and preprocessing uncertainty.

Three test photographs are enough to exercise a source-grouped heldout pipeline, **not enough to establish a 1% or 5% population false-positive rate**. With zero false-positive source groups out of three, the one-sided 95% binomial upper bound for a source producing any false positive is about 63.2%, under an independent representative-source assumption that this convenience corpus does not establish. Pixel counts, two output dimensions, many payloads, and narrow bootstrap intervals do not remove this limitation. A degenerate bootstrap interval can simply mean that these few sources all gave the same outcome.

The photographic result is an exploratory measurement on ten named, preprocessed sample photographs. It does not support population security or covertness claims. A larger independent camera-source corpus, including unmodified color captures and more smooth scenes, is required before low-FPR detector claims are meaningful.

# Reused photographic corpus and source-separated protocol

This is the offline corpus for the disposable [unprotected-salt experiment](https://github.com/jdragulanescu/obscr/issues/31). It is not a representative camera-image benchmark. It contains actual photograph pixels. No generated cover is described as a photograph. No detector result is claimed in this document; the experiment runner must produce those results.

The ten named source photographs and their preprocessing were already evaluated in the earlier filler-free repair experiment. They are legally reused here with the same rights and attribution. The prior source is commit `ffd5f3fa1b535694246966b2701155378399debb`. These are **source-separated splits, not newly unseen research data**. Knowledge from the earlier experiment can affect this experiment's design. A fresh code freeze does not undo that adaptive reuse. No new photographs are acquired for this experiment.

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

In the earlier experiment, the original bytes were obtained through the harness web reader from GitHub's Contents API. Its response includes the original file as base64. Decoding that field avoids the web reader's image-preview conversion to WebP. A rendered preview is not the source image. The manifest contains the versioned source URLs and Git blob IDs needed to repeat acquisition. API requests have this form:

```text
https://api.github.com/repos/scikit-image/scikit-image/contents/skimage/data/grass.png?ref=v0.24.0
https://api.github.com/repos/scikit-learn/scikit-learn/contents/sklearn/datasets/images/flower.jpg?ref=1.5.2
```

JPEG originals were decoded once with macOS `sips -s format png INPUT --out OUTPUT`. No resizing was done during this conversion. JPEG decoding and color handling can differ across tools; the checked-in decoded PNG bytes and their manifest hashes, not a fresh platform-dependent JPEG decode, define this experiment's input. The corpus loader checks each stored PNG hash before use. No network or new image package is needed when the experiment runs; it uses the repository's `pngjs` dependency.

`covers()` returns RGB8 arrays at 256×256 and 512×512. For each source, it selects the largest centered square, then uses pixel-center nearest-neighbor sampling. Specifically, each source coordinate is `origin + floor((outputCoordinate + 0.5) * squareSide / outputSize)`. Grayscale inputs are expanded to three equal channels by the PNG decoder. The loader does not add noise, normalize colors, or blur images.

Nearest-neighbor upsampling repeats pixels when the source square is smaller than 512. This affects the cat, clock, rocket, flower, and China scene. It can make embedding easier to detect. Grayscale expansion creates equal RGB channels, which is also an easy signal for independently changed RGB low bits. These are important limits, not evidence of natural-camera performance. The original dimensions are returned with each cover so the runner can identify these cases.

The prior split is retained: **4 training, 3 validation, and 3 test source photographs**. Both sizes of one source always stay in the same split. The 20 photo covers are not 20 independent photographs. Source-group counts, not output image counts, describe the sample size. This experiment fits only the training sources and selects thresholds only from the validation sources, but all ten sources have prior-experiment exposure.

The loader also supplies 12 deterministic stress covers: a flat field and a gradient, at both dimensions, for each split. Their formulas and split-specific constants are in `corpus.mjs`. Stress covers never train the photographic detector or set thresholds. Their test results are reported separately. They are not independent natural-image evidence.

## Measurements and protocol freeze

The complete detector specification and decision rule are in [DETECTORS.md](DETECTORS.md). The runner must freeze that file, `detection.mjs`, the wire protocol, and codec bytes before scoring this experiment. The source photographs, manifest, split, and `corpus.mjs` stay unchanged.

The runner supplies all 32 covers: 20 photographic covers and 12 deterministic stress covers. It compares `no-repair`, `grouped-p32`, `legacy-filler-on`, and `legacy-filler-off` at 64, 512, and 2048 useful message bytes. These loads are equal plaintext lengths, not equal coded sizes or equal changed-pixel counts. Both new profiles use the same 16-byte unprotected salt placement. The new profiles use matched seeded fixture salts; production-style encode defaults use fresh random salt and nonce. A seeded fixture is not evidence about the security of randomness.

Four detectors are reported at each method/load: the original 12 statistical features alone; new public 16-byte salt-position signatures alone; the **old** 80-byte RS public-code test alone; and the complete-format combination. The old test must read the old 80-group layout, not the new 16-group layout. Its cover result is measured, never assumed to be zero. None of these detectors needs a password or imports the codec.

Models give each source equal class weight and train only on photographic training sources. Validation negatives alone select thresholds for target FPRs of 1% and 5%. Models and thresholds remain fixed for test scoring and bootstrap draws. Stress covers neither train the models nor set thresholds; their results are separate.

## Uncertainty and limits

Reports give achieved test TPR/FPR, full ROC curves, AUC, and 95% source-group bootstrap intervals. The default is 500 seeded draws. Each draw retains both classes, both output sizes, and all repetitions of a source. Method comparisons use the **same** source draw on both sides, not independent intervals. They report improvement against filler-on and repair penalty against no-repair at each useful-byte load.

Demonstrated exploratory improvement requires a positive paired 95% AUC-improvement interval for the complete-format detector, no higher achieved test TPR or FPR at either validation-selected operating point, and no newly perfect public detector. See DETECTORS.md for exact signs and the empirical perfect-detector veto. A failure to meet this criterion means **inconclusive**, not equivalent hiding. A profile-wide claim requires every declared load to pass.

Three test photographs are enough to exercise the source-grouped pipeline, **not enough to establish a 1% or 5% population false-positive rate**. With zero false-positive source groups out of three, the one-sided 95% binomial upper bound for a source producing any false positive is about 63.2%, under an independent representative-source assumption that this convenience corpus does not establish. Pixel counts, two output dimensions, many payloads, and narrow bootstrap intervals do not remove this limitation. A degenerate bootstrap interval can simply mean that these few sources all gave the same outcome.

Intervals describe test-source resampling with trained models and validation thresholds fixed. They omit training-set, threshold-selection, photographer, corpus-selection, preprocessing, and prior-experiment adaptation uncertainty. These ten named, preprocessed, adaptively reused photographs cannot support population invisibility, a safe payload capacity, production readiness, or phone approval. An inconclusive outcome is valid. A larger, independently acquired camera-source corpus is needed before population low-FPR claims are meaningful.

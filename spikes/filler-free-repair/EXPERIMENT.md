# Declared experiment, before scoring

Question: [Measure filler-free hiding and bounded pixel repair](https://github.com/jdragulanescu/obscr/issues/28).

This is disposable evidence, not a supported format. No candidate settings are approved for production. One experimental envelope uses publicly recoverable salt encoded with shortened RS(80,16), then secret-position metadata and GCM payload. Public salt-code redundancy is explicitly a rejection risk. A successful repair result cannot excuse a public presence test.

## Matrix

- RGB low-bit replacement, no filler, RS parity 16/32/64, grouped bytes versus scattered bits: six candidate profiles. Full words 255 bytes, final word shortened. Each uses the same fixed salt and metadata protection; details in CODEC.md.
- Controls: repository `lib/crypto.js` and `lib/steg-core.js` filler-on and filler-off at their existing settings; a five-copy repeat-code control defined in CONTROLS.md. Useful message bytes are equal across methods. Ciphertext expansion is not equalized away.
- Useful UTF-8 message sizes: 64, 512 and 2048 bytes uncompressed (deterministic printable synthetic data). Separate Unicode/compressed repetitive-message checks. A profile unable to fit is recorded as capacity rejection, not truncated or weakened.
- Corpus source groups and train/validation/test assignment fixed in CORPUS.md. Related resizes of each photograph stay in the same split. Dimensions 256×256 and 512×512 where available. Flat and smooth generated stress covers are reported separately, not used as photographic detector training or a substitute for photographs.
- Damage seeds: 2801, 2802, 2803. Pixel sampling without replacement by a recorded seeded PRNG. Damage selects floor(width*height*.01) pixels. Case A changes one uniformly selected RGB channel by a uniform ±1; clamp at 0/255. Case B replaces all three RGB channels independently with uniform integer bytes. Cases are separate, not cumulative. Exact recovery throughout these cases is the proposed target, not an expected result or promise.
- Additional cases on representative sources at both dimensions: unchanged RGB, pixel-preserving PNG rewrite, central square covering 1% of pixels, full-height vertical stripe of width max(1,floor(width*.01)), targeted salt/metadata/payload low-bit flips, RS correction radius and radius+1, wrong passwords, plain covers, truncated/raw malformed inputs and container truncation, full physical capacity and one byte beyond.
- Record erroneous extracted bytes separately for each payload word. Pixel counts are not codeword error counts. Distinguish exact authenticated output, safe failure and incorrect authenticated output; a container parse failure is not repaired pixel damage.

## Detection and acceptance

Run complete-format public-structure tests and a trained low-dimensional statistical detector. Training uses only training sources, threshold selection only validation sources, scores only held-out sources. Report ROC/AUC and detection at target FPR 1%/5%, actual held-out FPR, and source-group bootstrap uncertainty. Small corpus cannot estimate tiny false-positive rates reliably. Report photographic and stress results separately. Include public RS repair structure, repeated fields and legacy framing where publicly available, rather than only visible magic.

No profile is proposed if it fails the concealment-before-additional-recovery priority. Require demonstrated improvement over filler-on; report the penalty against filler-off. PSNR, changed samples and visual appearance are not detection evidence. A public salt-code classifier which cleanly identifies candidates is grounds to reject this experimental discovery scheme, not proof all RGB or RS schemes are impossible.

## Costs and scope

Report cold/warm complete operations and peak process memory separately. Browser and CLI must exchange files in both directions using the spike, not claim that unchanged production apps understand a new experimental format. Record exact runtime/device and dependency/source hashes. Unavailable phone evidence remains missing. No permanent application changes, JPEG/resize product mode or final wire format.

# Image survival experiment

Question: [what can a complete encoded image survive?](https://github.com/jdragulanescu/obscr/issues/16)

This is a disposable measurement spike, not an Obscr format, security fix, or supported recovery mode. It compares limited pixel damage with controlled resizing and JPEG encoding. It does not decide whether the product should have one or two modes.

## Run

Requires Node 24 or later and the platform's Sharp binary packages. No service, credentials, private images or network access are needed during a run.

```sh
npm ci
npm ci --prefix spikes/image-survival
npm run spike-image-survival
```

The command prints per-fixture results and writes JSON reports and representative images to ignored `spikes/image-survival/runs/local/`. It does not overwrite the committed evidence.

For a smaller smoke run:

```sh
npm run spike-image-survival -- --smoke --out spikes/image-survival/runs/smoke
```

To record a separate full run:

```sh
npm run spike-image-survival -- --out spikes/image-survival/runs/my-device
```

Run the root `npm test -- --runInBand` to check that the spike does not enter the application test suite. The spike has no permanent tests. Its runner checks its unchanged-file, pixel-preserving PNG, correction-boundary, capacity and negative controls and exits unsuccessfully if a required control fails. A completed experiment is not a security certification.

## Candidates

All use 512 × 512, opaque, 8-bit RGB covers. All use the same 48-byte bootstrap and full 16-byte authentication tag. Only used carrier positions are written; there is no filler.

| Public profile | Carrier | Repair | Maximum stored message bytes, after all overhead |
|---|---|---|---:|
| `lsb-1` | One low bit per RGB sample | No redundancy | 98,240 |
| `lsb-5` | One low bit per RGB sample | Five copies per bit, majority vote | 19,596 |
| `qim-32` | One quantized luminance DCT coefficient per 8 × 8 block; spacing 32 | Three copies per bit, majority vote | 106 |
| `qim-64` | Same coefficient; spacing 64 | Three copies per bit, majority vote | 106 |

The capacity formula is `floor(carrier_slots / (8 × copies)) - 48 - 16`. Gzip may reduce the stored message size; there is no fixed larger plaintext capacity promise. The last partial byte is not used. Boundary runs use incompressible bytes at capacity minus one, capacity, and capacity plus one.

These are independently written experimental carriers, **not the current Obscr implementation**. The accepted research identifies repetition as a simple baseline, not an efficient code. RS/BCH, adaptive embedding and STC are not implemented or compared here. Nothing in these results rejects those alternatives.

### Complete decoding path

1. Optionally gzip the message. Form a 48-byte bootstrap: `IS16`, version, candidate ID, compression flag, reserved byte, stored length, original length, 16-byte salt, 12-byte nonce, fixed width and height.
2. Derive a 32-byte root with PBKDF2-SHA256, 65,535 iterations. HKDF-SHA256 derives separate AES-256-GCM and placement keys with distinct labels. This fixed experimental cost is **not** a selected password policy or an attack-cost comparison.
3. Encrypt the stored message. Authenticate the whole bootstrap as GCM associated data. Append the complete 16-byte tag.
4. Apply the candidate's repetition code separately to bootstrap and ciphertext/tag. A public, deterministic shuffled order spreads bootstrap copies. A separately keyed shuffle selects payload positions from the remaining slots. The bootstrap never needs the secret or its own salt to locate itself. No payload bit overwrites bootstrap data.
5. Decode pixels. LSB profiles reject a changed geometry. QIM profiles normalize every received image to the public fixed 512 × 512 grid with Lanczos3, without sender dimensions or access to the cover. The caller selects one of four public experiment profiles; this is not automatic product-format discovery.
6. Majority-decode the bootstrap and validate its fixed fields and bounds before KDF work. Extract and majority-decode the payload. Authenticate before returning any plaintext; decompress only after authentication, with a 1 MiB output bound. Verify the original length. The harness compares accepted bytes with the original message.

Fixture salt and nonce come from SHA-256 counter output with public case labels. This is deliberate reproducibility, **not production randomness**. The public fixture password is in `codec.mjs`. Placement shuffles use HMAC-SHA256 counter output with rejection sampling. The runner never gives the decoder an original header, message length, bit order, or image.

QIM uses the orthonormal `(u=1, v=2)` 8 × 8 luminance basis, `Y = 0.299R + 0.587G + 0.114B`. It rounds the coefficient to the nearest lattice point with the requested parity. The inverse basis delta is added equally to RGB, rounded and clipped. Extraction rounds the coefficient divided by the profile spacing and takes parity. No full JPEG coefficient codec, learned model, crop registration or geometry search is included.

### Repair limits

An odd repetition code corrects up to `floor(copies/2)` flips **in each encoded bit's codeword**, not that fraction of arbitrary image damage. Controlled cases flip exactly that many copies of one bootstrap or payload bit, then one more copy. With no redundancy, the within-limit case has zero flips. These targeted cases know placement to measure the code boundary; the low-bit clearing cases do not use a password or placement information.

`bootstrapErrors` and `payloadErrorsAtOriginalPositions` are oracle diagnostics measured **after** decode. They count carrier-bit errors, majority errors and the worst errors per repetition codeword. They never assist the receiver. The payload diagnostic still uses original positions when damaged salt would make a real receiver choose different positions.

## Corpus and matrix

Full runs use `smooth`, `texture`, and `flat` mathematical covers at seeds 17, 29 and 43. Smooth covers are gradients plus a sinusoid; textured covers add deterministic bounded noise; flat covers use RGB `(64,128,192)`. The three flat seeds produce the same cover. Thus there are nine source/seed cases but **seven distinct covers**, not nine independent photographs. All images are generated by this spike; there are no third-party image rights or redistribution requirements.

Each case uses nominal 32-, 96- and 256-byte messages:

- Raw: deterministic pseudorandom bytes, not necessarily UTF-8.
- Gzip: valid UTF-8 repetitions of `Hi 🌍 你好` plus a newline, padded with spaces to the exact byte budget. Compression behavior is therefore measured on compressible text, not a matched incompressible/compressible distribution.

This gives 54 requested fixtures per profile. A capacity rejection remains a result; the runner never shrinks a message to make a profile fit. Report equal-message subsets separately from all-feasible aggregates.

Thirty transforms run on each feasible encoding:

| Family | Exact operation |
|---|---|
| File controls | Original bytes; PNG rewrite at compression level 9 with adaptive filtering, verifying RGB equality |
| Sparse unit damage | Select `floor(512² × rate)` distinct seeded pixels at rates 0.0001, 0.001, 0.01, 0.05, 0.2; change one seeded RGB channel by +1, or -1 when it equals 255 |
| Sparse replacement | Replace all RGB values of selected pixels with seeded random bytes at rates 0.001 and 0.01; a selected sample may coincidentally remain equal |
| Bursts | Centered 16 × 16 and 64 × 64 black squares; full-width black stripe in rows 252–259 |
| Resize | 512 → 384 and 512 → 256 with Lanczos3; no crop or rotation |
| JPEG | Quality 95, 85, 60; 4:2:0 chroma subsampling; Sharp/libvips JPEG defaults, `mozjpeg` false |
| Ordered combinations | Resize to 384 → JPEG85; JPEG95 → resize to 384 → JPEG75; JPEG85 → decode → JPEG85 |
| Password-free removal | Clear the lowest RGB bit; separately clear the lowest four RGB bits |
| Container damage | Keep only the first half of the PNG file; separately invert its first signature byte |
| Bootstrap and payload limits | Flip one repetition codeword at its correction radius and one copy beyond it, for each section |
| Malformed record | Encode stored length `0xffffffff` in the bootstrap, without changing the original authentication tag |
| Wrong password | Decode an intact image with a deliberately wrong password |

Plain covers are separate negative controls. Codec versions are in each `manifest.json`; exact JPEG quantization/subsampling markers remain in the representative `.jpg` artifacts, and every transformed file has a SHA-256 in the raw rows. All other files can be regenerated with the recorded source and lockfile. Quality settings are codec inputs, not a universal JPEG channel definition. **No sharing service was tested.**

## Evidence interpretation

Each profile runs in a fresh Node child process, sequentially, with Sharp concurrency 1 and its image cache disabled. `encodeMs` includes key derivation, envelope, placement, embedding and PNG encoding. `decodeMs` includes image decode/normalization, bootstrap, key derivation, placement, authentication and optional decompression. Per-phase decoder times are recorded where those phases completed. Transform time and oracle diagnostics are outside decoder timing.

The first use of a profile includes the public-order initialization; later uses reuse it. Timings mix that first use with warm calls. Quantiles are descriptive across cases, not repeated fixed-workload benchmarks. `peakRssKiB` is the high-water RSS of the **entire profile worker**, including Sharp, raw-result retention and capacity-boundary trials, not the memory required for one message. The parent is not included. No browser, phone, constrained device, power use or main-thread blocking was measured.

Image disturbance is RGB mean squared error, PSNR with peak 255, changed-sample fraction, and maximum absolute channel change, **before** damage. It is not a detection rate. Representative covers, encodings, amplified absolute residuals (×16), and two JPEG transforms are saved for inspection.

The fixed password-free detector majority-decodes public bootstrap positions and checks `IS16`, version and profile. Its threshold is fixed before measurement; it has no training or tuning. It deliberately tests an obvious complete-format signature. False positives are checked on every plain source/seed case. Message/seed variants are correlated; do not compute a population confidence interval as if all fixtures were independent photos. These small synthetic results cannot estimate a natural-image false-positive rate, ROC/AUC, or resistance to rich-model or learned detectors.

Read the committed findings with the raw reports. Recovery means the **entire authenticated message matched exactly**, not a high proportion of recovered bits. Rejection labels identify the stopping stage; they are not proof that all malicious inputs have been handled safely. An unexpected authenticated message makes the run invalid. Production bounds, cryptographic review, real app exchange, and natural-image/device evidence remain outside this spike.

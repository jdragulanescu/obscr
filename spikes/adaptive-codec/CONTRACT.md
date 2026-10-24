# Frozen feasibility contract

Question: [Prove adaptive message coding and salt discovery across browser and CLI](https://github.com/jdragulanescu/obscr/issues/35). Disposable experiment, not production bytes or approved settings. Freeze this contract before any measurement. Stop on a rights, correctness, or resource failure; do not substitute a simulator.

## Stage gates

1. Build the pinned Rust core to one WASM binary. Run exact-message, blind-extraction, rank, bounds and deterministic checks in Node and Chromium before PNG transport. A failure here ends later image and repair measurements.
2. Only after that gate, build the complete envelope and prove unchanged PNG and sample-preserving rewrite exchange in both directions. Then measure extraction errors on development data, choose a finite repair comparison, and freeze its parameters before comparing it. No confirmation scoring is authorized.

## Fixed coding profile

- Stenoxide 3.24.3 `91a7322e83310a1a9577353f14cf7ad7f884e3c8`, only its Apache-2.0 Rust coding core. No optional native DDE code or whole application protocol.
- Height 10, upstream 0.02 bit per scalar sample ceiling, at most 262,144 keyed RGB samples for header and body together. No groups reinterpreted as scalar samples. Capacity is at most 655 encoded bytes before overhead, not a safe product limit.
- Fixed public all-zero 32-byte codec seed. Upstream ChaCha20 column stream nonce `[1;12]`, sign stream nonce `[2;12]`; no added secret and no placement-stream reuse. Upstream MSB-first payload bits, segmented matrix, mixed widths and inward signs at 0/255 remain unchanged. Public fixed signs are an experimental choice, not a concealment claim.
- Bootstrap: compare 128 raw salt samples with 8,192 adaptive salt samples; geometry-spread public sample pools. For matched salt arms reserve the full 8,192-sample pool in both, and use its first 128 samples for raw salt. Its fixed matrix extracts exactly 128 bits of salt and must have rank 128. No marker, parity, checksum, retries or salt guessing.
- One keyed fixed-length header pool followed by the body pool from one continuous accepted sampler, both disjoint from bootstrap. Blind extraction uses only encoded samples, fixed profile, password and bounded header lengths, never the cover or sender costs.

## Costs and representation

Only opaque, noninterlaced, RGB/RGBA8 PNG input is admitted for the pilot. No palette/16-bit/color-management conversion or JPEG support. RGB row-major scalar order; alpha unchanged. Per-pixel luminance `0.299R + 0.587G + 0.114B`; absolute cross-Laplacian with edge reflection; separable normalized Gaussian radius 2/sigma1 then radius3/sigma1.5; reciprocal with epsilon 1e-6. Assign the same pixel cost to R/G/B. This is the named **Stenoxide-inspired HILL-like RGB baseline**, not standard HILL or S-UNIWARD. Omit upstream cover rejection and uniform red multiplier: no cover-suitability rule is approved. Calculate costs in image order before gathering samples.

## Finite resource envelope

These experiment bounds can be tighter than the accepted provisional ceilings; they do not approve those ceilings on any device.

- Source PNG at most 16 MiB; each dimension at most 1,024; at most 1,048,576 pixels. Validate signature, IHDR, chunk lengths/CRC and format before decode; cap inflated scanline bytes at `(4*width+1)*height`; reject trailing/extra raster data. At most two application-owned pixel buffers. No unbounded image-supplied lengths.
- One operation at a time in an owned worker. Cancellation terminates the worker and releases its state; no partial output is released. Per-operation timeout 30 seconds. No retry or weaker fallback.
- Cost/filter workspace at most four Float32 pixel planes (16 MiB at this pilot ceiling), gathered costs at most 1 MiB. Encode one segment at a time. Validate actual segment width before survivor allocation (maximum 66,816 columns), height10 survivor storage at most 8,552,448 bytes. Codec WASM linear memory capped at 64 MiB. KDF memory is separate.
- At most 262,144 keyed positions, sparse entries at most k, draws at most `2*k+1024` and absolute 525,312. Full-key AES-256-CTR, little-endian draws with unbiased rejection, continuous stream, 4,096-byte chunks and 8,192 paired buffers. No full-domain shuffle.
- Argon2id v19, 65,536 KiB, three passes, one lane; wrappers and sumo 0.8.4. Accepted password bytes, HKDF labels, fresh 16-byte salt and 12-byte nonce, AES-256-GCM full 16-byte tag. Do not emit plaintext or invoke decompression before authentication.
- Useful-message loads 64, 512 and 2,048 bytes. At most 1 MiB plaintext/decompressed output for separate compressed boundary cases. At most 655 coded bytes per codec call; total keyed budget also applies. Repair candidates limited to the prior pinned shortened RS implementation, parity16/32/64, at most four codewords and no decoder retries. Select settings only after extraction-error measurement. Record every capacity rejection.

## Evidence boundary

Record actual runtimes, wall time, Node peak RSS, Chromium available heap/process measurements with their scope, and codec linear-memory bytes. Synthetic arrays are codec-gate vectors and stress covers, not photographic concealment evidence. The previous RGB no-repair/grouped-p32 and legacy filler-on/off are controls; filler-on is not a product choice. Keep salt/header/payload failures separate, and salt failures in every end-to-end denominator. No measured result approves production repair, a safe capacity cap, cover acceptance, or a hiding advantage.

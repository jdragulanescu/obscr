# Development procedure frozen before image measurement

All photographs in photos/manifest.json are development data only. Four photographs from three credited photographers cannot support a concealment, population recovery, or production setting claim. The 512x512 PNG crops are decoded with the shared bounded parser; no image conversion occurs after embedding except the explicitly sample-preserving rewrite.

## Envelope and load accounting

Header: 32 bytes, comprising 12-byte fresh GCM nonce, big-endian 32-bit stored length, big-endian 32-bit useful length, parity byte, interleaver byte, compression byte and nine zero reserved bytes. All header bytes, salt, dimensions and salt-route selector are authenticated. No header field is checked before the expensive root. Tag is 16 bytes. No padding or public marker. Profiles are supplied explicitly out-of-band to the experimental harness; no multiple-profile or salt search.

The no-repair header uses 16,384 scalar samples. The body uses `min(remaining accepted budget, coded bytes * 512)` samples. Capacity is also checked against the upstream float32 0.02 ceiling. Public salt pool is always 8,192 samples and excluded from keyed sampling in both salt arms. Raw salt writes the first 128 entries; adaptive salt uses the fixed matrix across the complete pool. Nonce is inside the header and is not double-counted in total bytes.

If a repair comparison is justified after measurement, use a fixed 16-byte-parity header (48 total bytes, 24,576 samples), and select payload parity/interleaving from the finite menu in STUDY-PLAN.md. The fixed header repair choice here is part of this disposable envelope, not production approval. Body candidates cannot exceed four shortened RS codewords. No-repair remains matched in useful load, not in encoded overhead.

## First measurement stage

For each fresh photograph and separate flat/gradient stress cover, attempt useful ASCII message byte loads 64, 512 and 2,048 without compression under both salt routes, parity0 and identity byte order. Message fixtures are seeded non-secret printable bytes; every encode uses fresh CSPRNG salt/nonce. Do not retry rejection. Admit unchanged round trips only if exact full-tag authentication returns the identical message. Stop on any admitted unchanged-file error or resource failure.

For development photographs and admitted files, apply two fixed damage seeds (35 and 3501) to each of:

- Unique random pixels: 0.01%, 0.1%, and 1% of pixels, one channel ±1 with saturation clipping. Count actual sample and parity changes.
- Center square of side `floor(sqrt(0.01*pixels))`: replace all RGB samples using seeded bytes.
- Center vertical stripe of width `max(1,floor(0.01*width))`: replace all RGB samples using seeded bytes.

Record changed salt, original-position extracted header/payload error bit and byte indices, contiguous runs, per-255-byte concentration, actual terminal decode result and stage, and time. Original-position extraction is an oracle diagnostic, not the real decoder; the real decoder derives positions from the possibly changed salt and one password. Salt failures stay in every end-to-end denominator.

## Controls and observations

Retain unchanged raw-salt RGB no-repair/grouped-p32 and legacy filler-off/on controls from the prior experiment, with all three useful loads and the same photographs. Reference code is copied verbatim from commit e0e7ed81c2790f608029cad76289f79935904f29 except this spike's top-level control import paths already match its location. State group and expanded scalar-sample counts separately. Apply the same fixed damage seed35 cases to controls; retain rejection/failure outcomes. No repair selection uses historical control success as evidence about adaptive errors.

For every complete encoded image and original cover, report simple non-trained, original-free parity fraction, pair-histogram imbalance and RGB-channel absolute-difference statistics. Report public-bootstrap parity statistics separately. These are descriptive targeted/color observations, not rich-model or learned detection evidence and not AUC or security gates. The future-study plan specifies color-aware trained detectors and rights prerequisites. No detector is trained on these four photographs.

## Separate workflow and bounds checks

Use both salt routes for actual CLI-to-browser and browser-to-CLI file exchange. Check exact decoded samples after PNG rewrite and exact authenticated message after rewritten-file transport. Include wrong password, directed salt/header/body modification, malformed and oversized PNG, invalid password bytes, profile errors, over-capacity plaintext, Unicode and compressed plaintext. Cancel an in-flight worker; it must terminate before any plaintext output. Record actual runtime versions and resource scope. Stop on correctness/resource failure rather than claiming skipped downstream work passed.

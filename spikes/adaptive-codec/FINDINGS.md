# Adaptive complete-message pilot findings

## Answer

The real pinned adaptive codec works as a **bounded experimental transport** in Node and Chromium. Unchanged files and sample-preserving PNG rewrites recovered the exact authenticated message across runtimes. This does **not** establish a hiding advantage, a robust recovery setting, a safe product capacity, or phone support.

For the next decision, keep raw salt as the damage baseline and retain parity 16 with round-robin bytes as a candidate to compare, not an approved repair default. Adaptive salt was more fragile in this small development pilot. None of the adaptive candidates recovered from the larger damage operations tested. Return these limits to [Choose hiding and recovery behavior](https://github.com/jdragulanescu/obscr/issues/17). Production bytes and routing remain in [Define the complete protected image format](https://github.com/jdragulanescu/obscr/issues/19).

This artifact answers [Prove adaptive message coding and salt discovery across browser and CLI](https://github.com/jdragulanescu/obscr/issues/35), subject to human acceptance. No confirmation study, detector training, product cutover or approval is included.

## Source and prerequisite gate

One 34,725-byte WASM module contains the actual Apache-2.0 Stenoxide 3.24.3 coding core at `91a7322e83310a1a9577353f14cf7ad7f884e3c8`; Node and Chromium load that same artifact. The build uses the pinned Cargo lock, Rust 1.99.0 and target `wasm32-unknown-unknown`. `evidence/build.json` records artifact SHA-256. [PROVENANCE.md](PROVENANCE.md) retains upstream source, transitive-license evidence and the explicit yanked-dependency qualification. No native codec or simulator was substituted.

Both prerequisite gates passed before image measurements: six accepted vectors, exact extraction without the original cover/costs, zero/saturated samples, varied cost maps, at-most-one sample changes, rank 128 for the fixed public salt matrix, and unchanged-output rejection of invalid costs and over-bound sizes. A 2048-byte direct codec request was rejected. Source inspection identifies the known yanked chacha20 SSE2 defect as native-target-specific; this is not a general security clearance of that dependency.

## Experiment and complete overhead

The fixed cost profile is the **Stenoxide-inspired HILL-like RGB baseline**, not standard HILL or S-UNIWARD. Costs are computed in image order. The full-key scalar AES-CTR sampler then gathers distinct RGB samples from one continuous stream, excluding the public salt pool. There is no extra secret seed, placement-stream reuse, retry, cover rule or uniform red-channel penalty. See [CONTRACT.md](CONTRACT.md) and [EXPERIMENT.md](EXPERIMENT.md).

The envelope uses the accepted Argon2id/HKDF chain, a fresh 16-byte salt, fresh 12-byte nonce, bounded 32-byte header and full 16-byte AES-GCM tag. Header fields and salt are authenticated. Compression is before encryption; decompression follows successful authentication and has a declared/output cap. The header is not a public magic marker. The caller supplies the profile out-of-band; this is not a self-routing production format.

Both salt arms reserve 8192 public scalar samples from the keyed pools. Raw salt changes the first 128 of those samples; adaptive salt codes 128 bits over all 8192 with the fixed full-rank matrix. Neither has salt repair, a checksum or salt guessing. Reserving the same pool matches available message capacity, **not the salt footprint or damage geometry**: the raw samples occupy the early part of the spread pool.

| Experimental payload repair | Total encoded bytes for 64 useful bytes | Total encoded bytes for 512 useful bytes | 2048 useful bytes |
|---|---:|---:|---|
| None |128 |576 | Rejected |
|16 parity bytes per shortened RS block |160 |640 | Rejected |
|32 parity bytes per shortened RS block |176 | Rejected | Rejected |

Totals include salt, header, nonce inside the header, tag and repair. There is no padding. For repaired profiles the header separately gets 16 parity bytes. The `nonce` diagnostic is a component of `header`, not an additional 12 bytes to add again. The fixed rate is at most 0.02 coded bit per scalar sample; header and body together get at most 262,144 keyed samples. The direct-codec 655-byte ceiling is therefore not a useful-message cap. Payload order is either identity or byte round-robin across at most four shortened codewords.

## Development data and measured repair selection

Four fresh 512×512 photographic crops were acquired after the codec gate: VanDusen garden, Saigon ride, Minnesota flowers and Lake of the Clouds. Their source records declare CC0. `photos/manifest.json` records source URLs, creators, dates, camera metadata where available, JPEG/PNG hashes and the Chromium sRGB center-crop procedure. Source conversion occurred **before** embedding; encoded files were never canvas-resampled. Two synthetic flat/gradient covers are separate stress cases, not photographic evidence.

The four source records differ from the prior pilot's records. Pixel-level near-duplicate exclusion was not performed. Three photographers, repeated camera models, four crops and seeded damage cases are not independent population samples. Rights records permit these retained development crops; they do not clear every depicted third-party right or authorize a later corpus automatically.

Initial no-repair extraction errors, including salt/header/payload bit and byte indices, byte runs and per-255-byte-region counts, are retained in `evidence/initial.json.gz`; repair results are in `evidence/repair.json.gz`. These are lossless archives, with original-byte hashes and round-trip checks in `evidence/archive.json`. At the mildest random damage, header errors were 0–4 bytes; payload errors were 0–33 bytes, runs no longer than 4, with up to 17 bad bytes in one 255-byte region. That observation motivated the finite comparison in [repair-selection.json](repair-selection.json): parity 16/identity, parity 16/byte-round-robin and parity 32/identity, plus no repair. Bit interleaving and parity 64 were not pursued. This is a development selection, not a preregistered confirmation result.

The unchanged-file stages made 108 adaptive encode attempts: 64 admitted exact recoveries and 44 explicit capacity rejections. No admitted unchanged message failed. Photograph-only rows account for 56 of those successes; the remaining 8 are synthetic stress cases. All 48 control attempts recovered unchanged files, including 2048-byte loads that the adaptive profile rejected. Do not omit the different admission rates when comparing candidates.

### End-to-end damage results

Damage is fixed random one-channel ±1 at 0.01%, 0.1% and 1% of pixels, plus a center 1% RGB replacement patch and a center stripe of width floor(1% of image width). Adaptive comparisons use two seeds per photograph; the controls use one. The raw files record actual pixel/sample/parity changes and damage hashes. Diagnostic error measurement can use oracle original positions; actual decoding cannot and does not.

At 0.01% random pixel damage, exact authenticated recovery was:

| Complete adaptive candidate |64-byte successes /8 |512-byte successes /8 |
|---|---:|---:|
| Raw salt, no repair |3 |0 |
| Adaptive salt, no repair |1 |0 |
| Raw salt, parity 16, identity |8 |3 |
| Adaptive salt, parity 16, identity |8 |2 |
| Raw salt, parity 16, byte round-robin |8 |6 |
| Adaptive salt, parity 16, byte round-robin |8 |7 |
| Raw salt, parity 32, identity |8 | Not admitted |
| Adaptive salt, parity 32, identity |8 | Not admitted |

**Every adaptive candidate had zero exact recovery at the other four damage levels.** Across the admitted photographic attempts there were 560 damage cases, 70 exact recoveries and 490 safe failures. All 280 cases with changed extracted salt failed end-to-end; they remain in these denominators. In the no-repair pair, salt changed in 16/80 raw-arm cases and 64/80 adaptive-arm cases. Larger matrix-footprint sensitivity is a concern here, not a measured universal error rate.

The 512-byte parity 16/round-robin result is enough to retain that experimental candidate, not enough to claim it is better in general. Fresh salts/nonces change placement between arms, the sample is tiny, and both repaired 64-byte byte orders are the same single-codeword operation. There is no independent interleaving benefit at that load. Parity 32 consumed enough capacity to reject 512 bytes; no benefit from more parity can rescue wrong salt without a different salt decision.

### Controls and detection observations

The RGB controls preserve their byte-group placement units; they are not relabelled as adaptive scalar samples. The following aggregates combine all three useful loads across four photographs and are **not** a matched-load superiority test:

| Control | Exact after 0.01% random /12 | After 0.1% /12 | After 1% /12 | Patch /12 | Stripe /12 |
|---|---:|---:|---:|---:|---:|
| RGB no repair |10 |4 |0 |0 |3 |
| RGB grouped parity 32 |12 |12 |1 |12 |12 |
| Legacy filler on |0 |4 |0 |0 |0 |
| Legacy filler off |0 |4 |0 |0 |0 |

Random perturbations at different rates are not nested corruption sets, so nonmonotonic rows are not a recovery guarantee. The grouped control spends a much larger expanded sample footprint and retains its own salt design. Filler-on is a legacy positive control, not a proposed product setting. Its damaged-path run emitted Node's existing short-GCM-tag deprecation warning; the new candidate always uses a 128-bit tag.

Ledgers retain parity fraction, pair-histogram imbalance, color-channel differences, bootstrap observations, changed samples and distortion. These are simple diagnostic signals, not a trained detector, confidence interval or AUC. Fewer changes do not prove better concealment. No hiding advantage is established.

## Runtime, boundaries and actual workflows

Measured host: Apple M3 Max MacBook Pro, 16 CPU cores, 64 GB RAM, macOS 26.6.2 build 25G83. Node 24.13.0 and managed Chromium 150. Chromium's user-agent platform string is not the physical CPU identity.

| Measurement | Node | Chromium |
|---|---:|---:|
| Complete codec-only gate |1037.1 ms |1065.2 ms |
| Direct 512-byte codec encode |382.7 ms |391.1 ms |
| Direct 655-byte codec encode |430.0 ms |432.9 ms |
| Codec linear memory, fixed maximum |64 MiB |64 MiB |

The image-stage process peaks were 398,508,032 bytes (initial), 414,351,360 (repair) and 446,791,680 (controls). Their stage wall times were 36.06, 79.73 and 35.02 seconds. Those are whole-process peaks, including the diagnostic harness, retained oracle covers/rows and garbage collection; they are not per-operation workspace measurements. Each individual operation had a 30-second worker deadline. The KDF separately uses 64 MiB. Whole-browser/worker peak RSS was not measured; page heap is not a substitute. No physical phone was tested.

`evidence/boundaries.json` records the accepted frozen KDF/HKDF/CTR vectors, independent shortened-RS vectors, full-domain sampler reference and split-stream checks, Unicode/compression, freshness, wrong password, salt/header/payload/tag damage, malformed PNGs and capacity refusals. Its “shortened-tag” case removes a tag byte then zero-pads the fixed-length transport: it proves authentication rejection of that alteration, not a variable-length format parser. `frame-bounds.json` adds valid-CRC oversized dimensions, excess inflated PNG raster, malicious protected lengths and an authenticated decompression-overrun case. Authentication failure released no plaintext in exercised cases.

[The browser/CLI walkthrough](BROWSER.md) proves actual files in both directions, 512-byte parity 16/round-robin exchange, exact Unicode, sample-preserving PNG rewrites, completed browser download, cancellation, wrong-password handling and oversize refusal. SIGINT exited 130 with no output file; browser cancellation showed no late plaintext. Console and page errors were empty; the first session's only failed request was a favicon 404.

Before publication, review found that the CLI/browser wrappers retained the input RGB reference while the PNG writer allocated scanlines. Both now clear that reference first, preserving the two-live-application-pixel-buffer bound at that boundary. `buffer-lifetime-smoke.json` records a fresh 512-byte CLI→browser→download→CLI exchange with the final wrappers. It proves output preservation, not garbage-collector timing. Earlier timings remain historical observations of the earlier wrapper lifetime; the codec and measured damage algorithms were unchanged. The diagnostic study harness intentionally retains original covers for comparison and is not the candidate worker workspace.

The repository's existing 5 Jest suites/104 tests and Vite production build passed. Jest reported 0% aggregate coverage; no coverage claim follows. Existing build warnings concerned outDir placement, stale Browserslist data, vm-browserify eval and large chunks. No production code or permanent test changed.

## Confirmation-study proposal and stopping point

[STUDY-PLAN.md](STUDY-PLAN.md) proposes rights-first acquisition, photographer/source/near-duplicate cluster splits, development/validation/held-out separation, a matched complete-file control set, targeted bootstrap/syndrome tests, a color-rich-model ensemble and a learned color-aware detector. Detector weights/licenses must be cleared or a permitted independent implementation trained. No weights or confirmation corpus were acquired here.

Its illustrative 2000/2000/4000 independent-group split and target AUC difference 0.02 are **proposals**, not approved requirements or a power result. Paired variance and source clustering must determine the final acquisition size before held-out scoring. Low-FPR intervals, per-source results, all capacity rejections and salt failures must remain visible. Cover-suitability rules may be fit only on development data and tested unchanged later. A previous 25,000-image number is not a requirement.

**Proposed acceptance:** accept feasibility and the measured limits of this disposable pilot; return to the hiding/recovery decision with raw salt as baseline and parity 16/byte-round-robin retained for comparison. Do not approve production repair, adaptive salt, a capacity promise, a cover rule or the confirmation-study acquisition by accepting this artifact.

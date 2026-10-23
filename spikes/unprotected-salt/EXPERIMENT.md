# Unprotected salt: pre-scoring plan

Question: [Measure hiding with an unprotected random salt](https://github.com/jdragulanescu/obscr/issues/31).

This disposable experiment compares complete files, not just their encrypted payloads. It does not select a production format. The earlier negative experiment at `ffd5f3fa1b535694246966b2701155378399debb` stays unchanged.

## Candidates and bytes

`CODEC.md` specifies every candidate byte, key rule, placement rule and work bound. The two explicit profiles are `no-repair` and `grouped-p32`. Both use 16 raw random salt bytes in public, evenly spaced byte groups. Neither stores public parity, checksum, repeated salt, fixed marker or profile bytes. A recipient selects the known experimental profile before derivation. No fallback or salt search is allowed.

Both use the accepted provisional Argon2id v19 tuple (64 MiB, three passes, one lane, 32-byte output) and the accepted HKDF/AES key schedule. This experiment measures that tuple, but does not approve it for release or unmeasured devices. Header and repair structure are located only after the expensive root. Default encodings use fresh CSPRNG salt and nonce. Explicit matrix fixture seeds are `source-id/useful-size`, shared across both profiles so salt, nonce and message match. These deterministic fixtures are unsafe for real secrets.

Repair uses the pinned Apache-2.0 Reed-Solomon subset, its license and provenance. Header is 36 data bytes plus 64 parity bytes. Payload full blocks are 223 data plus 32 parity bytes; a nonempty final shortened block adds 32 parity bytes, without padding. No-repair stores the same 36 header bytes and ciphertext/tag directly. Salt is never repaired. All overhead is counted.

## Corpus and loads

Use the previously acquired, legally reusable ten photograph source groups and their fixed four/three/three train/validation/test split in `CORPUS.md` and `photos/manifest.json`. Both 256 and 512 square derivatives stay with their original source group. Twelve deterministic flat/gradient covers are separate stress observations. These sources were already examined in the earlier experiment: the split remains source-separated, but this is not a new untouched confirmation corpus. No photographic independence is inferred from resizes, pixels or message variants.

Useful message sizes: 64, 512 and 2048 uncompressed UTF-8 bytes, identical across both candidates and current filler-on/filler-off controls. Messages use the recorded LCG in `controls.mjs`, seeded by 2800 + size. Candidate fixture seeds omit profile. Legacy encryption retains its actual CSPRNG behavior; raw output PNG hashes identify each realization, and representative files are retained. Legacy filler uses the earlier declared synthetic seed 28028. No five-copy control is scored in this experiment.

## Damage and boundaries

Every candidate and legacy control is scored end to end on unchanged files and two separate 1% cases for seeds 2801, 2802 and 2803. Select floor(width*height*0.01) pixels without replacement with the fixed LCG and sparse swap-with-last selector in `controls.mjs`.

- One-channel case: choose one RGB channel and +1 or -1 uniformly; clamp to 0/255.
- Replacement case: replace each selected pixel's three channels with independent uniform integer bytes.

These are measurements, not passing recovery targets. Keep failures when the salt changes. Diagnostic salt, header and per-payload-codeword error counts never filter the recovery denominator.

For each candidate on one representative source at each dimension, also run pixel-preserving PNG rewrite, central square area near 1%, full-height center stripe width max(1,floor(width*0.01)), one salt-bit error, header correction radius and radius+1, payload radius and radius+1, wrong password, plain cover, truncated RGB, truncated PNG, Unicode compressed/uncompressed messages, exact physical capacity and capacity+1. `boundaries.mjs` exercises authentication with repair-consistent tampering, shortened tags/final blocks, password-byte bounds and resource rejection. Browser and spike CLI exchange actual PNG files both ways for both profiles. The wrappers reject nonopaque covers and images above 1024 per dimension; codec ceilings are documented separately.

## Detection and decision rule

Freeze all candidate source and protocol hashes in `evidence/freeze.json` before the full run. `DETECTORS.md` declares the old public RS salt-code detector at its old 80 positions, new raw-salt/position signatures, statistical models, complete-format combination, validation-only operating thresholds, ROC/AUC and source-group bootstrap comparison. There is no detector removal or threshold tuning after scoring.

Demonstrated exploratory improvement requires the paired source-bootstrap 95% interval for filler-on AUC minus candidate AUC to be strictly positive, no worse achieved detection at the fixed validation operating points, and no new perfect public signature. Failure to meet this rule is negative or inconclusive; it is not permission to weaken repair, add parity, discard difficult sources, or infer invisibility from image quality. Even a pass cannot establish population rates on this corpus.

Unchanged files and pixel-preserving rewrites must recover exactly. No incorrect authenticated output or unauthenticated plaintext is allowed. Salt-only damage must produce safe failure. Repair correction-radius cases must recover; beyond-radius cases must not release unauthenticated plaintext. No-repair gives up repair. Any statistically supported capacity rule must come from evaluated concealment, not available bit storage. Otherwise no safe net capacity cap is proposed. Screenshots, illustrations and transparency-heavy covers are not supported by these observations.

## Costs and hand-back

Record useful/stored/framing/nonce/tag/repair/final-block bytes; changed RGB samples, MSE and PSNR; encode/decode time, process memory and exact runtime/device. Separate physical capacity from evaluated embedding loads. Node cost runs use separate cold processes and warm operations. Browser heap is a partial metric, not whole-device memory. Missing physical phone evidence remains missing.

Publish runnable source, licenses, protocol, raw observations, source hashes, representative PNGs, browser walkthrough and findings in one spike PR. Return a supported proposal or an explicit negative/inconclusive result to the hiding decision. Human acceptance is required; neither the map nor this ticket closes automatically during this session.

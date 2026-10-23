# Password device-cost findings

Evidence for [Measure password-processing cost on supported devices](https://github.com/jdragulanescu/obscr/issues/27), under [Harden Obscr security and preserve repeatable attack checks](https://github.com/jdragulanescu/obscr/issues/11). Experiment date: 2026-10-23. This is a partial device matrix, not a resolved decision.

## Verdict

**All ten exact candidates met the three-second key-ready target in every observed Node and Chromium sample on this Mac. None is established for the required phone/browser matrix.** Physical iPhone Safari, physical Android Chrome, desktop Safari and desktop Firefox results remain missing. No algorithm, production profile or device-memory limit can be selected from this evidence alone.

The agreed native AES-CTR/sparse-sampler contract worked in this experiment. Eleven fixed public key-to-position chains agreed across Node and the bundled browser implementation. No change to that contract is proposed. Preferential consideration of Argon2id remains the accepted design direction, not a profile selection.

## Device, conditions and method

- MacBook Pro **Mac15,8**, Apple M3 Max, 16 CPU cores, **64 GB RAM**, macOS **26.6.2 (25G83)**, arm64. Node **v24.13.0**, LTS **Krypton**, OpenSSL **3.5.4**. Actual physical host identity comes from system hardware/software reports, not the browser's privacy-reduced `Intel Mac OS X 10_15_7` user-agent string.
- **Chrome for Testing 154.0.8037.57**, headed, on this same Mac. Browser user agent reduces this to `Chrome/154.0.0.0`; reported `deviceMemory=32` is not the host's actual 64 GB.
- Battery power, 30% when scoped and 24% after measurements/check setup; other desktop apps open, no thermal control, no fixed-idle guarantee. Node and browser sweeps ran sequentially, without the project tests/build running alongside them. These are short observations, not stable p99 estimates.
- Three fresh workers and three corresponding warm operations per profile per image case: **120 samples per runtime**. Maximums below combine the two image cases, so each mode has six samples per runtime/profile. Cold includes worker creation, image transfer, module/library startup, KDF, HKDF and key-ready message. OS/browser asset caches were not flushed; “cold” does not mean a first-ever download.
- Images: 1024×768 with 4096 sampled positions, and 4032×3024 with 262144 sampled positions. The represented RGB-LSB carrier reserves 4096 RGB positions for bootstrap and keeps two RGBA8 buffers live. The photo case therefore has **97,542,144 bytes of explicit pixels** before password workspace, sparse state, output, runtime and native memory. Payload counts are placement demands, not final framed-message capacities.

[PLAN.md](PLAN.md) fixes the numeric sweep and method. [Node raw samples](results/node-measurements.json), [browser raw samples and vectors](results/chromium.json), and [machine-readable comparison](results/comparison.json) hold the observations.

## Observed timing and memory

All times are milliseconds. RSS is whole Node-process sampled resident memory, **not incremental KDF memory**. Allocator/GC retention from preceding profiles affects later rows; these RSS values cannot rank algorithms by their own memory demand.

| Profile | Node cold max | Node warm max | Chromium cold max | Chromium warm max | Node sampled RSS max MiB |
| --- | ---: | ---: | ---: | ---: | ---: |
| a64t2 | 137.6 | 74.8 | 94.9 | 62.8 | 335.3 |
| a64t3 | 163.9 | 112.4 | 124.4 | 94.6 | 340.0 |
| a128t2 | 228.8 | 154.1 | 175.4 | 135.6 | 406.4 |
| a128t3 | 300.2 | 227.7 | 241.8 | 211.1 | 405.5 |
| s64p1 | 158.5 | 144.3 | 139.9 | 121.5 | 401.0 |
| s128p1 | 290.2 | 288.0 | 247.4 | 244.1 | 655.2 |
| s64p2 | 310.6 | 285.3 | 250.4 | 230.8 | 649.5 |
| p600k | 76.2 | 59.7 | 62.7 | 48.2 | 650.3 |
| p1200k | 134.8 | 117.5 | 108.2 | 95.1 | 650.7 |
| p2400k | 257.8 | 233.9 | 204.9 | 189.0 | 655.6 |

Argon2id profiles use version 19, 64/128 MiB, two/three passes and one lane. Scrypt profiles use N=65536/131072, r=8 and p=1/2 as fixed in PLAN.md. PBKDF2 profiles use HMAC-SHA256 and 600000/1200000/2400000 iterations. Every route derives a 32-byte root from a 16-byte salt, then the agreed two HKDF children. These costs are not equal-strength translations.

The largest retained-context time, from submission through placement and pixel touches, was **388.1 ms in Node** and **298.9 ms in Chromium**. Image allocation is recorded separately and is not included in those times. Image decoding/loading, final format/repair processing and GPU costs are not modeled. Maximum 10 ms heartbeat gaps observed were **13.8 ms Node** and **12.7 ms Chromium**; this checks the runner's event loop, not every possible UI frame or input latency.

Node RSS was sampled every 10 ms, plus worker checkpoints during sampling. Short peaks can be missed. Browser main-thread heap values were available, but **whole-browser/worker/WASM/native peak memory was not measured**. Browser `workerSampledPeak:null` means unavailable. The recorded generator input/output allowance is 8192 bytes for 4096-byte stream chunks; emitted positions and sparse-entry counts are recorded separately. JavaScript Map entries do not have a portable fixed byte cost.

The separate Node sampler stress requested 1,048,576 positions, consumed 1,053,225 draws, reached 1,018,703 sparse entries and took 252.2 ms. It did not retain the two image buffers or run another KDF. It is a sampler boundary observation, **not** acceptance of maximum-image whole-operation memory.

## Candidate resource envelope, not approved limits

The experiment rejects geometry above 4096×4096, demand above 1,048,576 positions, and more than 2×demand+1024 draws (absolute 2,098,176). Only the fixed ten profile IDs are accepted; caller-provided arbitrary cost parameters do not control derivation. The sampler's mathematical N≤2^32 bound does not authorize a four-billion-position image allocation.

For the next device measurements, retain these hard experiment guards but treat the **4032×3024 / 262144-position case as the largest measured complete represented context**. Do not approve the larger guarded geometry or demand for production from a sampler-only result. Proposed production allocation limits remain unresolved until phone memory, the chosen carrier, image decoding and repair costs are known. Final full-format confirmation is required even if every KDF fits three seconds.

## Correctness, failure and packaging evidence

- **169 Node and 133 browser checks passed**, including published RFC 5869 HKDF, RFC 7914 scrypt, RFC 9106 Argon2id and NIST AES-256-CTR anchors. Sodium Argon2id matched independent Noble Argon2id at every candidate; Noble scrypt matched native Node scrypt. Browser native PBKDF2 matched Noble. HKDF matched Noble and Node APIs; CTR matched Node native API and the published vector. Node native APIs may share OpenSSL, so two Node API calls alone are not claimed as independent implementations.
- `node compare.mjs` matched **11 composed chains** byte-for-byte: UTF-8 password, salt, root, both children, stream, positions and draw counts. Forced rejection, counter carry and fixed GCM outputs also matched. [Node vectors](results/node-vectors.json) and the browser export retain all public values and traces.
- Boundary checks cover exact Unicode distinctions, empty/malformed/overlong passwords, changed salt, chunk boundaries, full-width counter carry/wrap, forced rejection, one-element/non-power-of-two/full-width domains, small-domain uniqueness, dense-versus-sparse selection and draw/resource exhaustion. Bootstrap evidence is represented reserved-slot arithmetic, not final format serialization.
- GCM negatives cover wrong password, changed metadata and shortened tag. They exercise native API contracts, not a new image parser or real CLI/PWA image exchange.
- Unsupported profile/excess-resource requests were rejected before workers started. An **injected** allocation failure produced an error with no fallback. No genuine host OOM was induced, and browser/OS kill behavior remains unknown.
- Cancelling a cold worker after its `deriving` message returned in 0.39 ms in Node; Chromium's synchronous terminate call rounded to 0 ms. That browser number is API return time, not proof of OS thread teardown or erasure. Manual UI cancellation returned controls to usable state and preserved completed pairs; [partial cancellation evidence](results/partial-cancellation.json) shows two saved samples and no completed-sweep claim.
- The actual minified module-worker bundle ran under the self-only CSP with `wasm-unsafe-eval`, on secure localhost without cross-origin isolation. [A second server without that CSP allowance](results/chromium-csp-denied.json) produced an explicit Sodium WASM compilation error; it did not choose scrypt/PBKDF2 or weaker settings. A real non-secure-context browser run was not performed.
- After network-off emulation and reload, the cached page ran the Argon2 probe in a fresh worker. [All 20 listed cached assets returned 200 offline](results/offline-assets.json), including worker, library chunks and notices. [Offline probe output](results/chromium-offline.json) records `online:false` and a controlling service worker. This is browser network emulation, **not** a physical-phone airplane-mode result.
- [Exact package and source evidence](DEPENDENCIES.md), [lockfile](package-lock.json), and [installed-byte inventory](results/artifacts.json) record pins, notices and hashes. Npm installation completed with integrity-checked extraction and scripts disabled. No registry signature/attestation verification, full sumo license audit, exact-version composition audit or source-reproducible rebuild is claimed.

## Earliest password-verification point

In `derive`, validated password bytes first enter the selected expensive root KDF. HKDF children and CTR placement come only afterward. Before that, the experiment checks input encoding and public structural/resource limits; it has no password-check field, fast password-derived seed or password recognizer. Error paths never select another profile.

This establishes the experiment's dependency order, not the unfinished image format's attack floor. A future inner header, repair condition or AEAD tag can verify guesses after the root and a short prefix; full legitimate extraction time must not be charged to every attacker guess. Legitimate-device elapsed time is not attacker guess time. Weak passwords remain guessable offline.

## Missing matrix and acceptance

| Required evidence | State |
| --- | --- |
| Physical iPhone Safari | No device reached; exact model/OS/browser/RAM must be recorded before its run |
| Physical Android Chrome | No device reached; exact model/OS/browser/RAM must be recorded before its run |
| Desktop Safari 26.6.2 on this Mac | Installed, but WebDriver returned `session not created`: enable Allow remote automation; setting was left unchanged |
| Desktop Firefox | No installed Firefox application found; not measured |
| Desktop Chrome | Chrome for Testing measured; ordinary installed release not measured |
| Node LTS | v24.13.0 Krypton measured on the named Mac |
| Whole-browser and final-format peak memory | Not established |
| Real-device allocation failure/OS kill | Not established; injected failure only |

[README.md](README.md) gives exact commands, fixed inputs, output schema, secure/offline hosting requirements and return instructions. No claim covers an unnamed “current” device. Human acceptance of sufficient evidence is still required; the ticket remains open. Final algorithm/profile selection remains in [Choose password processing and image-position generation](https://github.com/jdragulanescu/obscr/issues/18).

## Verification and corrections

- `agent-local npm run vectors`: passed after correcting a copied NIST plaintext string that had one extra hexadecimal digit. Both Node native CTR and the stream wrapper had produced the same correct stream; the expected plaintext was wrong. The vector decoder now rejects odd-length/non-hex reference strings, and the plaintext is written in the published 16-byte blocks. No cryptographic contract changed.
- `agent-local npm run measure -- --device '…'`: completed 120 Node samples, guards and sampler stress.
- Browser: reference vectors, 120 samples, guards, manual cancellation, cached reload/Argon2 probe, all-asset offline fetch and CSP denial were exercised. No console or uncaught errors on the normal path; a favicon 404 was the only failed normal resource request. CSP-denial errors are expected and stored separately.
- `agent-local npm test`: **5 suites, 104 tests passed** with the spike present. Jest reported existing experimental-VM warnings and an empty coverage summary.
- `agent-local npm run build` at the root: production PWA build passed. Reported warnings: external outDir, stale Browserslist data, `vm-browserify` eval and a large bundle. No production source/dependency change was made to suppress them.
- Measured browser bundle version: `ad5adf849240e21b`, retained in [measured build manifest](results/measured-build-manifest.json). After timing, the page was changed only to retain completed pairs on interruption. Its final bundle is recorded in [current build manifest](results/build-manifest.json); cancellation preservation was then exercised. Core derivation, worker and measurement timer code did not change after timings.

Lessons: the malformed reference-string correction is guarded by the vector decoder. No additional agent rule is proposed; the independent-vector gate caught it before measurement.

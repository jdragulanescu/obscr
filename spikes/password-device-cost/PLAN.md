# Password device-cost experiment — pre-measurement plan

Question: [Measure password-processing cost on supported devices](https://github.com/jdragulanescu/obscr/issues/27). Disposable experiment; no production profile is approved. Recorded before measurements on 2026-10-23.

## Device boundary

Reachable physical hardware: MacBook Pro Mac15,8, Apple M3 Max (16 cores), 64 GB RAM, macOS 26.6.2 (25G83). Node v24.13.0 (24 LTS family). Installed Safari 26.6.2. Available automation browser: Chrome for Testing 154.0.8037.57; actual user agent must be saved before measurement. No Firefox installation found. Initial power condition: battery, 30%, discharging. Record conditions again with results; no idle-machine or thermal-control guarantee. Run KDF measurements sequentially, never alongside the project suite.

Required but NOT represented by this machine: physical iPhone Safari and Android Chrome. Their exact model, RAM if known, OS and browser version must be entered before their runs. No emulation substitutes. Desktop Firefox and installed Safari require their own actual runs; Chrome for Testing is not a measurement of all desktop browsers. This is a measured-device boundary, not a claim to support every current device. A production support floor remains undecided.

## Fixed sweep

Every profile: 16-byte salt, raw 32-byte root, child HKDF-SHA256 outputs of 32 bytes. Password bytes and key/stream/sampling contract follow the accepted design linked by the ticket. Fixed public vector inputs only; no real passwords accepted by this experiment.

| IDs | Algorithm | Exact candidate cost |
| --- | --- | --- |
| a64t2, a64t3 | Sodium Argon2id v19 | 64 MiB, 2 or 3 passes, 1 lane, empty secret/AD |
| a128t2, a128t3 | Sodium Argon2id v19 | 128 MiB, 2 or 3 passes, 1 lane, empty secret/AD |
| s64p1 | Noble scrypt | N=65536, r=8, p=1 |
| s128p1 | Noble scrypt | N=131072, r=8, p=1 |
| s64p2 | Noble scrypt | N=65536, r=8, p=2 |
| p600k, p1200k, p2400k | Native PBKDF2-HMAC-SHA256 | 600000, 1200000, 2400000 iterations |

Pin Sodium wrapper/raw 0.8.4, Noble 2.4.0, build-only esbuild 0.25.12. Lock all transitive packages and record registry integrity. Integrity checks prove fetched bytes match registry metadata, not provenance or an audit of composition.

## Method and represented carrier

For each profile and each image case, collect 3 cold-worker and 3 warm-worker samples. Cold: create a fresh module worker after validating request and preparing image arrays; include creation, pixel transfer, module loading, lazy library initialization, KDF, HKDF and key-ready message. Warm: a second operation in that same worker, with libraries and worker pixels retained. Cold does not mean cold disk/network cache; browser cache and OS cache can remain warm. Image allocation precedes submission; receipt latency is recorded separately but not subtracted. Both child keys remain in worker memory. Root and key bytes appear only in explicitly non-secret reference-vector output.

Represent an RGBA8 decoded carrier with a main-thread source pixel array and a second pixel array transferred to the worker (no transfer copy); touch all pages. Eligible domain is ordered RGB positions minus a represented 4096-position bootstrap reserve. Carrier choice, image decoding temporaries, encoded source, repair buffers, final frame and GPU allocation are NOT modeled. This is not complete-format memory acceptance.

| Case | Dimensions | RGBA bytes per copy | Requested positions |
| --- | --- | --- | --- |
| small | 1024 x 768 | 3145728 | 4096 |
| photo | 4032 x 3024 | 48771072 | 262144 |

After keys become available, run the agreed native CTR stream and sparse swap sampler while both pixel arrays remain live. Record root-to-key timer separately from complete context elapsed time, transfer latency, sampler entries, generator buffers, sampled memory, event-loop heartbeat gaps and cancellation latency. A separate maximum-demand check uses 1048576 positions. The maximum represented geometry is 4096x4096; demand is capped at 1048576, draws at 2*demand+1024 (absolute 2098176). These are experiment guards, not approved production limits.

Browser memory APIs may omit worker/WASM/native/GPU memory. Report unavailable values as null, never as zero; nominal live buffers are not a measured peak. Node RSS covers the process and worker; interval sampling may miss brief peaks. Browser whole-process peak requires an external profiler. Worker termination is cancellation; it does not guarantee erasure. Check allocation-error handling with a deliberate injected allocation failure, labelled as such; do not induce host OOM or present injection as proof of real-device OOM behavior.

Check unknown profiles/excess dimensions/demand before worker startup. Check draw exhaustion without biased fallback. Run independent primitive checks and composed browser/Node chain equality, Unicode boundaries, stream carry/chunks, rejection and sampler limits. Use a bundled worker served with strict self-only CSP plus wasm-unsafe-eval. Precache all emitted assets for offline reload. Report CSP-denied WASM behavior separately; never switch KDFs. Secure-context checks must fail explicitly outside trusted local/HTTPS contexts.

## Acceptance boundary

Report each observed cold/warm sample against 3000 ms; three samples establish only this bounded observation, not tail latency. No common profile is feasible for the required matrix until all named physical device results exist. Legitimate elapsed time is not attacker guess time. Earliest password-dependent work must be the expensive root; the unfinished format can still introduce a cheaper verifier and needs its own review.

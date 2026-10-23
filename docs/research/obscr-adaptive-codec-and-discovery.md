# Adaptive message coding and initial-data discovery

**Research date: 2026-10-23.** Findings for [Find a usable adaptive message codec and discovery route](https://github.com/jdragulanescu/obscr/issues/33), under [Harden Obscr security and preserve repeatable attack checks](https://github.com/jdragulanescu/obscr/issues/11). This is research, not a selected carrier, approved prototype, production format or release claim.

## TL;DR

- **Blind adaptive message extraction is possible.** Syndrome-trellis coding (STC) puts the message in a shared matrix syndrome. The sender uses image-dependent change costs; the recipient needs the matrix, carrier order and message length, not the original image or those costs. A change simulator is not this codec. [STC §§IV–VI][stc]
- **An available Apache-2.0 coding core is a concrete lead, not a ready browser/CLI solution.** Stenoxide 3.24.3 contains native Rust message embedding and extraction. A narrow adaptation avoids assuming that an MIT wrapper relicenses DDE code. Its existing salt, keys, mapping, cost model and capacity policy cannot be adopted unchanged; no browser artifact or Obscr round trip was established. [Rust codec][rust-code] [License][rust-license]
- **Discovery remains separate from message coding.** Raw random salt at fixed public positions is a usable research baseline, not an approved production choice. A fixed public STC syndrome containing only the random salt is another construction to investigate: it needs no password or original cover and adds no salt repair. Its statistical footprint is unmeasured. Neither route makes a changed decoded salt recoverable. **[INFERENCE]** from STC equation (13).
- **Retain the accepted expensive-root key schedule and bounded sampler.** A small keyed header can reveal message length and coding parameters after Argon2id. Header structure or successful repair may reject a password guess before GCM; the expensive root must precede every such test. A full-image permutation or content-ranked receiver domain is not a compatible shortcut. [Accepted password decision][keys]
- **Return to human selection before another prototype.** Compare complete images on fresh source-separated photographs, including salt, framing, repair and the existing RGB controls. Measure post-extraction errors before choosing repair. No safe cover threshold, capacity cap, repair rate or interleaver follows from this research.

## 1. Evidence boundary and accepted constraints

Sources are original papers, upstream code and documentation, and the project's accepted decisions and immutable experiment report. **[INFERENCE]** marks deductions; **Proposal** marks future evaluation choices. No production code, dependencies, prototype, image experiment, application tests or benchmark was run. A small local arithmetic command checked the memory and binomial calculations below; these are calculations, not measured memory or detection results.

The [accepted investigation direction][direction] retains one original-file delivery mode, no full-image filler, one password, authenticated output, and concealment before additional repair. JPEG/resize product support is outside this effort. No public salt parity, salt guessing, cheap password-derived placement or silent weaker fallback is allowed. Exact bytes and version routing belong to [Define the complete protected image format](https://github.com/jdragulanescu/obscr/issues/19); this research does not wait on that downstream decision.

The [previous report][previous] established S-UNIWARD/STC as an algorithmic candidate, not a cleared implementation. The [accepted raw-salt experiment][experiment] is inconclusive: neither candidate met its complete-format improvement rule at all three loads. Its test set contained three photographs from a reused ten-photo corpus. It measured a repair benefit, but every changed-salt case failed. Those results are historical evidence, not new measurements or proof that RGB low-bit carriers cannot work.

Obscr's shared engine is JavaScript, with Node and browser PNG adapters. The [package manifest][package] declares MIT, ESM and distribution of `bin/` and `lib/`, with no Node engine floor. Any WASM asset needs explicit npm packaging, browser loading, worker ownership, offline caching and dependency notices. A native library or Python wrapper alone does not satisfy that integration contract.

## 2. Implementation routes and rights

The DDE archive facts below are retained from the [accepted prior audit][previous], not claimed as new archive inspections. New implementation claims come from the pinned sources. “Available for public use” is not treated as either a clear MIT grant or a definitive legal prohibition. No rights holder was contacted. This is source-license evidence, not legal advice, certified originality, patent clearance or a complete transitive-license audit.

| Artifact and exact source identity | Actual codec and maintenance evidence | Rights and integration boundary |
| --- | --- | --- |
| DDE S-UNIWARD MATLAB archive, SHA-256 `f708a146c13d57ffba138253beebb8649ecbce299f1b9765b705653869ce7799` | Inspected previously: rate-driven change simulation, not supplied-message transport. The index also lists C++ v10; those bytes are not established here as a complete codec. | Source grant restricts use to educational/research/non-profit purposes and retains notices. Not unrestricted production permission. [Prior audit][previous] [DDE index][dde] |
| DDE multilayer STC Linux v1.0, SHA-256 `e79158346729b1eff09a13efb0bfe24a5a550338da26b524a7d34c3e69b50f17` | Real C++/MATLAB embedding and extraction; site last-update label 2010-12-12. Image costs/framing are separate. | No blanket core redistribution license established in the prior archive audit. Separate zlib `sse_mathfun.h` and MathWorks helper notices do not resolve core rights. SSE/Boost in the old distribution need port review. [Distribution][stc-site] [Prior audit][previous] |
| `pySTC` / `pystcstego` 0.1.0, `9bad216cd74f08d6b5f2655307abb191613d4bcb` | Actual Python `hide`/`unhide` over C++ STC; observed commit 2025-03-03. Python wheels/sdist, not a JS package. | Wrapper MIT; README explicitly derives core from DDE. No new DDE rights-holder grant established. NumPy runtime, SciPy/imageio example dependencies, zlib helper notice. Current core uses C++ `std::mt19937`, not the old Boost RNG. [README][pystc-readme] [Wrapper][pystc-api] [License][pystc-license] [Build][pystc-build] |
| HStego 0.6.1 source, `bf71f6e0d7faaa632ad8a988c0393e94bfd13b2a` | Actual file embedding/extraction and per-channel S-UNIWARD costs; observed release commit 2026-07-19. README still says alpha. | Project MIT does not resolve acknowledged DDE core provenance. Python/scientific/image/crypto dependencies and bundled IJG JPEG 9c require their own terms; exclude unrelated JPEG code from a spatial port. Emscripten/Pyodide setup exists but is not a proven browser release. [README][hstego-readme] [Source][hstego-code] [License][hstego-license] [Pyodide setup][hstego-web] [IJG notice][hstego-ijg] |
| **Stenoxide core 3.24.3**, `91a7322e83310a1a9577353f14cf7ad7f884e3c8` | Actual safe-Rust `stc_encode_safe`/`stc_decode_safe`; observed commit 2026-08-10. Default features empty; native Ubuntu CI configuration, no inspected browser target. | **Apache-2.0 core**, visibly implemented in Rust rather than calling DDE. The deprecated optional `ffi-stc` feature still compiles external native sources and is not this route. Source history/CI configuration is maintenance evidence, not observed passing tests or a support guarantee. [Commit][rust-commit] [Codec][rust-code] [Manifest][rust-manifest] [License][rust-license] [Build][rust-build] [CI][rust-ci] |
| `conseal`, `7acae342a07de9d5c9a9870253d1713517259339`, Rust manifest 2026.6.0 | Observed commit 2026-10-05. README says no end-to-end method; `coding/trellis.py` contains a docstring and `pass`. **Still a simulator**, not a substitute for extraction. | MPL-2.0 declaration; cost source acknowledges earlier implementations. Top-level licensing does not independently certify provenance. Useful cost/simulation research, not an assembled codec. [README][conseal-readme] [Trellis source][conseal-trellis] [Manifest][conseal-manifest] |
| Stegolab `codes/STC.py`, file-history commit `d193262727a35aeead5f9387da4ccec91894b2c0` (2020-10-08) | Small educational binary encoder/extractor, not a supported common-runtime package. | MIT-style header also says part is based on the DDE MATLAB implementation. Not evidence of an independent-license route. [Source][stegolab] |

### Available Rust core: the strongest implementation lead in this set

The native module imports the standard library, `chacha20` and `zeroize`, implements the trellis itself, and generates columns rather than importing DDE matrix tables. Apache-2.0 permits redistribution/modification subject to its terms: provide the license, preserve relevant attribution and any applicable NOTICE material, and mark modified files. Its contributor patent grant is limited, not universal patent clearance. No independent originality certification was obtained. [Codec][rust-code] [License §§2–4][rust-license]

The lock pins `chacha20 0.10.1`, `zeroize 1.9.0`, `cipher 0.5.2` and architecture-dependent `cpufeatures 0.3.0`. The inspected chacha20/zeroize manifests offer MIT/Apache-2.0 choices. Zeroize's derive feature adds a proc-macro build chain; complete dependency notices and artifact-to-source provenance remain unchecked. The **whole crate** also brings image/PNG/TIFF/WebP, zstd, crypto, random generation, Rayon and a `cc` build dependency. Use of its small STC module would be a maintained adaptation, not adoption of that entire graph. [Lock][rust-lock] [Manifest][rust-manifest] [chacha20][chacha-license] [zeroize][zeroize-license]

The codec takes ordered sample bytes, one finite nonnegative cost per sample, actual payload bytes, and a configuration. Extraction takes the same sample order, configuration and payload bit length, with no cover/cost input. It uses `u = min(n, 64m)` carrier positions for `m` bits, an implicit ChaCha20-derived height-`h` matrix, mixed block widths and segment resets shared by both ends. Default height is 10; its accepted internal range 2–20 is not a mobile resource guarantee. It rejects infinite costs, so **it has no hard-wet infinity interface**. A large finite cost does not forbid a change. Alpha/bootstrap reservations can be excluded by the shared domain; arbitrary cover-dependent prohibitions would need an explicit solver change. [Codec][rust-code]

It optimizes binary parity changes and then chooses an allowed ±1 sign with a separate stream, forced inward at 0/255. It does not optimize independent positive/negative costs as the DDE ternary solver does. The application uses only red samples for RGB, not all three channels; its luminance “HILL” costs use a cross Laplacian and two Gaussian smoothings before inversion. Treat this as its own HILL-like model, not the conventional HILL or S-UNIWARD reference. Its uniform color-cost multiplier does not change relative costs or the minimum-cost path except through numerical effects. **[INFERENCE]** Do not transfer its concealment claims to Obscr. [Codec][rust-code] [Frame pipeline][rust-frame] [Cost source][rust-cost]

Its fixed `MAX_BPP=0.02` is also incompatible with blindly using the planned loads: at 262,144 scalar positions it permits at most 5,242 payload bits, or 655 whole bytes **before** spending that shared budget on framing/repair. Thus an unchanged API cannot carry the 2,048-byte comparison load in that domain. This is calculated API capacity, not a safe Obscr threshold. A fork could expose a bounded experimental rate, or a different explicitly approved domain could be evaluated; neither is authorized here. [Codec capacity check][rust-code]

Do **not** adopt its complete protocol: it derives salt from an image hash, has salt-hypothesis extraction paths, derives its nonce from the key schedule, uses XChaCha20-Poly1305 and a full-image ChaCha shuffle. These conflict with the accepted Obscr contract. Reusing only the ordered-array codec still requires choosing a fixed matrix profile or an explicitly separated matrix/sign seed scheme; do not add an unapproved key or reuse placement-stream bytes silently. [README][rust-readme] [Pipeline][rust-pipeline] [Permutation][rust-permute]

**[INFERENCE] Integration route:** isolate the scalar Rust solver, use a narrow bounded buffer API compiled to WASM for both Node and browser workers, and retain Obscr's image adapters and accepted key/sampler chain. Rust 1.85 is the declared workspace minimum. No WASM artifact, JS binding, build success or common-runtime vector was established. The costs are source adaptation, a reviewed cost model, explicit matrices/limits, WASM packaging and ongoing maintenance—not merely adding a dependency. [Workspace][rust-workspace] [CI][rust-ci]

### DDE-derived routes: message transport exists, but contracts need repair

pySTC shuffles the whole flattened array using Python `random`, stores a 32-bit message-bit length in its first 64 positions and decodes it before the body. Its byte bits are LSB-first, distinct from the network-order length bytes. The native wrapper fixes height 10 and discards returned multilayer bit counts; extraction assumes the original half split. Internal embedding trials can reduce a layer count and change a length-seeded permutation. **[INFERENCE]** Such a retry can break extraction agreement; this was not executed as a failing case. A compatible port must return the complete requested message or fail, retain all required layer metadata, and replace the incompatible full-array/internal mapping rules explicitly. [Wrapper][pystc-api] [Interface][pystc-interface] [Multilayer source][pystc-ml] [Matrix construction][pystc-matrix]

HStego supplies a concrete RGB policy: per-channel directional 16×16 wavelet costs with symmetric padding, an encrypted fixed header in channel 0, and ciphertext split across channel capacities. Extraction does not recompute costs. Its scrypt/AES-EAX envelope is not Obscr's accepted cryptography. Its Pyodide setup still declares version 0.4 and links Python/native JPEG sources, so it proves a build configuration exists, not browser compatibility for 0.6.1. [Source][hstego-code] [Setup][hstego-web]

A C++ port needs a byte-buffer ABI without Python linkage and a reviewed scalar/SIMD path. Emscripten supports many SSE/SSE2 intrinsics with `-msimd128` and appropriate flags, with documented differences; SSE is not proof that a port is impossible. It is also not proof of correct or fast browser behavior. Retain helper licenses and resolve DDE core/cost-source rights first. [Emscripten SIMD guide][simd]

**Research recommendation, not selection:** take the narrow Apache-licensed Rust adaptation to the hiding decision first because it supplies actual independently implemented coding logic. Keep a permission-cleared DDE-derived route as the closer ternary reference alternative. A new paper-derived implementation is a third route if neither fits, but Obscr would own every algorithmic and maintenance detail. No route is a ready, supported production solution.


## 3. How actual adaptive extraction works

For a binary parity carrier, let `x` be the ordered original samples, `y` the encoded samples, `P(y)` their parity vector, `H` the shared `m × n` binary matrix, and `u` the actual `m` message bits. The sender minimizes its additive change cost subject to `H P(y) = u`; the receiver calculates `u = H P(y)`. It does not run the sender's image-cost calculation. STC is an efficient family of these matrices and a trellis search for the sender, not a channel-error decoder. [STC equations (12–13), §§V–VI][stc]

**[INFERENCE] A concrete common-runtime route:** compute directional image costs; collect a bounded keyed pool of RGB samples; encode the complete framed encrypted bytes, optionally with outer repair, into their syndrome; change only the samples selected by the coding result; write a PNG. Extraction reads the same ordered pool and calculates the syndrome. This is a composition to implement and evaluate, not a demonstrated package.

### RGB, sample order and matrices

- Define one canonical decoded RGB8 representation and RGB channel order; leave alpha unchanged. Initially restricting the candidate to opaque photographs avoids an unmeasured compositing path. Palette expansion, gamma/color handling, orientation and bit-depth conversion need exact cross-runtime checks. A lossless PNG file does not imply that every application preserves decoded samples. [PNG specification][png]
- S-UNIWARD's directional residual costs can be computed per channel, but treating RGB planes independently is an experiment choice, not established color-image security. Preserve spatial neighborhoods while calculating costs, then gather costs in keyed carrier order. Do not compute a spatial filter over the shuffled vector. [UNIWARD §3][uniward]
- Fix matrix columns, bit order, block boundaries, final-block termination, carrier counts and message-bit counts as a codec profile. A small fixed matrix can be expanded implicitly; do not allocate a dense `m × n` matrix. The paper permits variable block widths for arbitrary message rates. [STC §V-B][stc]
- Keep the receiver's domain independent of image texture and mutable parity. Do not sort samples by sender costs or discard “unsuitable” samples at the receiver: embedding or damage can change that classification. High-cost or forbidden samples stay in the agreed domain with encoder-side constraints. The sender may have to reject an infeasible frame; it must not change forbidden samples, retry with an undisclosed matrix, shorten the message, or weaken repair silently. **[INFERENCE]** from STC §§II, V-E.
- Binary parity coding can choose the lower-cost allowed `+1` or `-1` change when a parity flip is needed. This is not the full optimal ternary construction. STC §VI explicitly requires communicating each layer's message length; its example length-seeded permutation/retry convention is not Obscr's accepted sampler. A compatible multilayer route must supply bounded layer counts through a fixed binary header and define its mapping without replacing the key schedule. A wrapper that returns encoder-side counts does not solve blind framing. Saturated samples cannot wrap from 255 to 0 or from 0 to 255. [STC §§II, VI][stc]

The accepted sampler chooses unique positions using the full placement key. An adaptive candidate can optimize changes **within that bounded pool**. It cannot silently replace the sampler with a full-image permutation, use texture-dependent ordering unavailable to the recipient, or claim the same performance as a published algorithm that optimizes across the whole image. [INFERENCE]

## 4. Initial salt and header discovery

Discovery must finish before password-dependent placement. Encryption cannot conceal the salt inside positions that require that same salt to derive. A usable experimental decoder needs one pre-agreed profile; it does not try multiple salts, matrices, costs or lengths until something authenticates. Production version routing is still a separate decision. [Accepted password decision][keys]

| Route | What the recipient does | What it gains and costs |
| --- | --- | --- |
| Raw-salt baseline | Read exactly 128 bits from a fixed public geometry-derived layout; use the resulting 16 bytes once. | Already exercised in the prior spike. No public salt parity or marker, but known-position statistical changes remain testable. A changed decoded salt causes authentication failure. |
| Adaptive salt syndrome, proposed | Read a fixed public pool and compute a fixed, full-row-rank `128 × nB` matrix syndrome. Use those 128 bits as the salt once. | Sender can minimize change costs over more samples without sending its cost map. Needs a real cleared codec, fixed boundaries and extra carrier/work budget. It provides no salt repair and has no measured detection advantage. |
| Out-of-band salt or original cover | Obtain extra data from the sender. | Does not meet this ticket's file-plus-one-password constraint; not an adopted workaround. |
| Public salt ECC, guessed salt or fast password path | Validate public redundancy, search salt candidates, or derive positions cheaply. | Conflicts with accepted constraints; not a candidate in this investigation. |

**[INFERENCE] Why the proposed salt syndrome is not public salt parity:** for full-row-rank `H`, every 128-bit syndrome is permitted. A fresh random salt imposes no known membership condition on the extracted syndrome. Across all possible salts, the linear mapping does not restrict images to the codeword subset used by public error correction. The sender still selects low-distortion representatives, so this says nothing about their statistical distribution or invisibility. Adding a magic value, checksum, repeated salt or known ECC relation would invalidate that argument. Rank and matrix scheduling need independent checks.

**[INFERENCE] Why it is not recovery:** if carrier parity changes by `e`, the decoded salt changes by `H e`. Some patterns cancel; others corrupt several salt bits. If the resulting salt differs, the root and keyed placement differ. There is no authorized search for the old salt. Compare actual decoded-salt changes, not merely whether any bootstrap pixel was touched.

Full row rank does not guarantee feasibility under sender-side wet constraints. Reject an infeasible encoding; do not keep drawing salts until one fits and then claim an unchanged salt distribution. Include such rejections in the evaluation. Bind salt and interpretation metadata to the final authenticated envelope. **[INFERENCE]**

A compatible experimental sequence is:

1. Decode and bound the image; use the one pre-agreed public bootstrap layout to obtain one salt.
2. Derive the accepted Argon2id root and both child keys.
3. Generate a fixed-size keyed header pool, disjoint from bootstrap positions. Decode a fixed-size header with fixed coding parameters; reject invalid or over-limit fields before using their lengths.
4. Continue the agreed sampler for the message pool. The header supplies bounded message length and any layer/block counts needed for extraction. All counts and matrix/profile interpretations must later be authenticated.
5. Extract bytes; undo the selected interleaving and outer repair, if any; verify the complete GCM tag before plaintext output or decompression.

This is a dependency order, not production field serialization or a selected header-repair rate. Encoder costs may be recalculated after writing the bootstrap; the receiver never needs those costs. Header and payload pools must remain disjoint so later writing cannot destroy initial data.

## 5. Password cost and resource contract

Apply the [accepted password decision][keys], not library defaults:

- Argon2id v19, 65,536 KiB, three passes, one lane, fresh 16-byte salt, raw 32-byte root, empty optional secret and associated data. Profile `0x01` denotes that tuple; Sodium wrappers and raw sumo packages are both pinned to 0.8.4.
- UTF-8 without trimming or normalization; reject empty input, unpaired surrogates and more than 1,024 UTF-8 bytes. Fresh 12-byte GCM nonce; retain the full 16-byte tag.
- HKDF-SHA256 with 32 zero salt bytes and the exact labels `obscr/keys/1/encryption` and `obscr/keys/1/placement`, no terminator, yielding separate 32-byte keys.
- Full-key AES-256-CTR placement, zero initial 128-bit counter, big-endian counter increment without wrap, continuous stream, little-endian 32-bit draws, rejection sampling and sparse swap-with-last selection without duplicates. Do not reseed the stream for each block or consume it differently across runtimes.

**Earliest useful verifier [INFERENCE]:** public parsing can reject malformed images but cannot check a valid password guess. After root derivation, decoded header structure, feasible lengths, or a successful outer repair can reject a guess before payload authentication. STC extraction alone returns a syndrome for any input; that alone is not a recognizer. Charge an attacker for the root plus the earliest recognizer, not necessarily full message extraction, GCM or decompression. All password-dependent positions and checks must descend from the expensive root. Public format detection and cheap password verification are different risks.

| Accepted provisional limit | Consequence for the adaptive candidate |
| --- | --- |
| Width/height each ≤4,096; pixels ≤12,192,768 | Validate geometry before app buffers; no implicit approval of 4096×4096. |
| Keyed sampled positions `k ≤ 262,144` and `k ≤ N` | For the proposed scalar-RGB-sample domain, budget header and message samples together. STC carrier count is not its extracted message-bit count. Account for public bootstrap reservations separately. |
| Draws ≤`2k + 1024`, absolute 525,312; sparse state ≤`k` | No full-domain permutation, resampling restart or biased fallback. |
| Stream chunks ≤4,096 bytes; paired buffers ≤8,192 bytes | Preserve unused bytes at chunk boundaries. |
| At most two application-owned RGBA8 buffers, together ≤97,542,144 bytes | Additional cost, filter, trellis, WASM, decoder and GPU memory is not covered by this ceiling. |
| One active derivation/placement operation per app instance | Worker use must not multiply simultaneous KDF or image memory. Allocation/CSP/load failure is an error, not a weaker profile. |

**Position units matter.** The accepted decision leaves the eligible domain to the format decision. The historical RGB controls select byte groups, each representing eight RGB samples; their `k` is a group count. The conservative adaptive route proposed here selects single RGB samples. Preserve the controls unchanged and report both selection counts and expanded sample footprints. A grouped/tiled adaptive domain needs its units and expanded work made explicit; it cannot inherit a larger budget by relabeling bits as positions. [Historical byte contract][old-codec]

Before a prototype, freeze finite source-file/PNG decoding limits, bootstrap/header sizes, matrix/layer counts, cost/filter workspace, repair work, decompression bounds and cancellation points. These limits are not supplied by the KDF workspace or the previous spike's plaintext limit. Production values remain with the format decision.

### Calculated costs, not browser measurements

STC encoding's basic trellis has `O(n 2^h)` time and path storage; extraction can accumulate the sparse syndrome without that search. For a packed one-bit predecessor per state/sample, `n 2^h / 8` is the path-storage calculation. Actual wrappers may store more. [STC §V-C][stc]

| Carrier samples `n` | Height `h` | Packed path bytes | `n 2^h` state/sample updates |
| ---: | ---: | ---: | ---: |
| 262,144 | 6 | 2,097,152 | 16,777,216 |
| 262,144 | 8 | 8,388,608 | 67,108,864 |
| 262,144 | 10 | 33,554,432 | 268,435,456 |
| 262,144 | 12 | 134,217,728 | 1,073,741,824 |

At the pixel ceiling, one Float32 cost per RGB sample is 146,313,216 bytes; two directional arrays are 292,626,432 bytes before residual/filter buffers. Two Float32 costs for only 262,144 selected samples are 2,097,152 bytes. A 16,384-sample, height-10 block needs 2,097,152 packed path bytes. These are arithmetic examples, not selected coding parameters or measured peak memory. Tiled filters with correct halos, sequential channel processing and bounded coding blocks are possible engineering routes; verify that they preserve the intended cost function and codec schedule.

The Rust core segments traceback and stores two `f32[2^h]` state arrays plus `O(u+m)` columns/output/message buffers. Its segment planner uses `floor(65536 / floor(u/m))` message blocks. Width rounding can put slightly more than 65,536 columns in a segment, so its nominal 8-MiB height-10 comment is not an exact universal bound. A port must bound the actual segment width before allocation; the generic whole-trellis table above is not a claim about that implementation's measured peak. [Rust layout and solver][rust-code]

For a C/C++ route, use a narrow byte-buffer ABI and one portable build in both runtimes. Emscripten documents Node/browser bindings and warns that WASM memory growth invalidates existing typed-array views. Bound memory growth, avoid retained stale views, and account for input/output copies. Worker cancellation, CSP, offline WASM loading and deterministic numerical/tie-breaking behavior need actual browser checks. No native timing result establishes those properties. [Emscripten integration guide][emscripten]

## 6. Repair must follow the actual extraction channel

For a binary syndrome carrier with stable `H` and sample order, parity error `e` gives message error `H e`. One changed carrier sample may affect several message bits, and several carrier errors may cancel. With a height-`h` banded matrix a column has at most `h` active rows, but that does not give an image-level repair percentage. Multilayer extraction can additionally lose layer alignment if a layer count is wrong. [STC §§V–VI][stc]

Keep error correction outside the encrypted bytes so repair can occur before authentication. Preserve the nonce, authenticated metadata, ciphertext and full tag needed for GCM. A codeword syndrome, successful repair, CRC or readable text is not authentication. Unknown pixel errors require an unknown-error decoder; an erasure-only API is insufficient without a reliable way to identify bad symbols. Existing FEC implementation options and their license limits remain in the [prior research][previous].

**Proposal, before choosing any repair rate or interleaver:** collect extracted-bit and extracted-byte error vectors, errors per codeword, run lengths, cross-block correlations, layer/count failures and bootstrap/header outcomes. Compare spatially random changes with patches and stripes. Record actual parity flips separately from altered pixels. A bit interleaver can disperse flips into more erroneous RS bytes; byte grouping can concentrate them. Measure that tradeoff after adaptive extraction rather than copying `grouped-p32` into the new codec.

Keep salt failures in every end-to-end denominator. Diagnose salt-conditioned recovery separately, never as the headline recovery rate. Image parse failure, bootstrap change, header failure, payload repair failure and GCM rejection are distinct outcomes. Same-grid pixel damage is not corruption of the PNG compressed stream; neither supports a JPEG/resize promise. No weaker decoder retry is allowed after failure.

## 7. Proposed next comparison

This is a plan to take back to [Choose hiding and recovery behavior](https://github.com/jdragulanescu/obscr/issues/17), not authorization to run it. First select a rights-cleared implementation route and bootstrap candidate there. Use development data to measure the extraction-error channel and choose a finite set of experimental repair/interleaving settings. Freeze their exact code, parameters, source split, detectors, operating points and decision rules **before** held-out scoring. A discovered bug invalidates that frozen run; preserve it and predeclare a replacement, rather than tuning against its test results.

### Complete files and controls

- Retain the immutable `no-repair` and `grouped-p32` raw-salt RGB candidates, plus production filler-on and filler-off controls. Their previous result is inconclusive, not a reason to remove them. Filler-on is a positive/control condition only; it is not a new production option.
- Add actual adaptive message coding with the same raw-salt baseline, with and without the experimental outer repair. If approved, compare the adaptive-salt bootstrap separately with otherwise matched message settings. Include complete salt, header, nonce, tag, repair and final-block overhead in every image.
- Pair candidates on the same covers and useful UTF-8 byte loads: 64, 512 and 2,048, retaining the previous comparison points. Add a preregistered larger-load grid only where bounds permit. Record capacity rejection; do not silently shrink a message or drop rejected covers. Include compressed/uncompressed and Unicode boundary cases separately.
- Report both matched-useful-message and matched-total-carrier-budget comparisons. Changed samples, selected carrier samples, extracted syndrome bits, repair bytes and useful bytes are different denominators.
- Use fresh CSPRNG values for ordinary operation. If paired deterministic fixtures share salt/nonce values across experimental arms, use only non-secret fixtures and disclose that pairing; never reuse a GCM key/nonce pair for different secret plaintexts.

### Fresh data and uncertainty

Use newly acquired, legally reusable color photographs with recorded acquisition source, camera/development pipeline and capture session. Group every derivative, burst, resize and repeated encoding of a source together. Keep test acquisition sources separate from development and validation, not merely different crops. Include smooth, textured, low-light and saturated photographic strata. Synthetic flat/gradient images, screenshots and transparency cases are separate stress sets, not substitutes for photographic evidence.

**Proposal:** budget 5,000 independent source groups for development/training, 10,000 for validation and 10,000 untouched groups for the primary test, with one prespecified primary photograph per group. Related variants remain paired within that group. This is an acquisition target, not a claim that such a licensed corpus has been obtained. If actual independence is at camera/session rather than image level, use that larger grouping and report the reduced effective sample count. A small convenience sample is an exploratory pilot, not confirmation.

For 10,000 independent negative observations, a 1% false-positive probability gives about 100 expected events and an approximate 95% normal half-width of 0.195 percentage points. At 1,000 observations the half-width is about 0.617 points. Use Wilson or exact intervals in the report, not that approximation near zero. With zero failures, the one-sided 95% binomial upper bound `1 - 0.05^(1/N)` is about 0.030% for 10,000, or 0.299% for 1,000. These calculations assume representative independent sampling; repeated messages, pixels and correlated source groups do not supply it. [NIST confidence intervals][nist]

Use 1% and 5% validation false-positive targets for the primary operating-point comparison; measure achieved test rates and their intervals. Do not claim a precise 0.1% operating point from only ten expected events. These counts do not establish AUC-difference power: estimate paired variance on development data, predeclare the smallest improvement worth detecting, then fix the final sample size and multiplicity plan before opening test scores. If that evidence needs more groups, enlarge the untouched study or state that the planned comparison is underpowered. Never treat a nonsignificant difference as equivalence.

### Detectors and pre-scoring rules

Use targeted public-layout tests, LSB/parity and residual statistics, **SCRMQ1/CRMQ1 with an ensemble**, and **WISERNet retrained for these RGB images and complete formats**. The DDE color model includes spatial and inter-channel features; WISERNet's paper provides an RGB architecture and shows sensitivity to image-development pipelines. These are concrete baselines, not claims that a 2019 model is the strongest current detector. Freeze code, model seeds, preprocessing and equal training/tuning budgets. A detector requiring the encoder's true change map is an oracle diagnostic; publicly computable selection probabilities may support a separate realistic selection-aware attacker. [Color feature index][features] [WISERNet §§I–III][wiser]

Detector rights also need resolution: the DDE extractor index permits research/non-profit use, not unrestricted redistribution. The inspected WISERNet repository at `4e3b110d580ea1ed278181257b7c0ec410f89fc5` has no root license file; do not copy it or its checkpoint on an assumption of permission. Obtain suitable rights or independently implement the published architecture, and train on the actual study data. Available source or a checkpoint is not a licensed, calibrated Obscr detector. [WISERNet source][wiser-code]

Prepare a 512×512 full-image stratum before embedding for the learned detector's native input. For larger images, freeze an image-level tile aggregation that covers the whole image, including bootstrap locations; tiles are not independent observations. Do not resize encoded images merely to fit the network. Require separate development positive-control sensitivity before confirmation. If all detectors miss the positive controls, report an inconclusive study, not safe hiding.

Train on complete files, not payload-only crops that exclude salt. Compare salt-region-only, salt-syndrome/known-matrix statistics, message-region and combined detectors. Retain the old public RS salt detector with its old positive control; passing that detector alone proves only that the old signature is absent. Repeated-cover and exact-original differencing attacks are separate declared threat conditions. Neither fresh keys nor adaptive costs protects against an attacker who already has the original pixels.

**Proposal for a conservative selection gate:**

1. Every admitted unchanged file and sample-preserving rewrite must recover the exact authenticated plaintext in both CLI→browser and browser→CLI directions. Wrong-password, tampered/shortened-tag, invalid-length, repair-miscorrection, over-limit and malformed-image cases must release no plaintext. Any violation fails the candidate.
2. Freeze the primary rich-model, learned and combined complete-image scores before confirmation; choose score direction on validation only. Require simultaneous paired source-group confidence bounds strictly above zero for `AUC(control) - AUC(candidate)` at **every** declared useful load on each primary detector, against filler-on and both raw-salt RGB controls. Also require no worse achieved TPR or FPR at both frozen operating points. A new perfect public signature fails the candidate. No detector, score direction or inconvenient source is changed after scoring. Use a prespecified simultaneous interval method across these comparisons and retain all targeted safety checks.
3. Report interval overlap as inconclusive, not approval. Passing the relative gate establishes improvement under these detectors and source conditions only, not invisibility. Stronger absolute release limits still need a human decision and independent review.
4. Select no repair rate now. The future frozen plan must state which damage cases and end-to-end exact-recovery improvement justify its overhead. Require a positive paired interval for any claimed recovery gain, keep salt failures, and require the repaired complete candidate to meet the concealment gate too. Otherwise report a tradeoff or no supported setting.
5. Count all capacity and resource failures. Report useful capacity, exact recovery, detection, encoding/decoding time and peak memory separately. No aggregate score may hide a confidentiality failure or exchange concealment for unapproved recovery.

Resample whole source groups, keeping covers, variants, loads and seeds paired; use higher-level source clusters where needed. Report stratum/source-family failures rather than hiding them in a pooled mean. Test-set intervals for fixed trained models do not cover training, threshold-selection or acquisition uncertainty; report variation across independently trained seeds separately. A rejected/infeasible encode is not a successful hidden message and cannot improve the detection result by removing a difficult cover.

### Measurements and capacity evidence

Record parse, bootstrap, KDF, cost calculation, embedding/extraction, FEC, authentication and decompression time separately; collect cold and warm latency, peak process/browser memory, main-thread blocking, cancellation, asset size and output-file size. Use named desktop Node and browser versions and physical iPhone/Android devices before support claims. Retain the accepted three-second key-ready target and final-format release gates; it is not a new total-operation deadline.

For damage, retain same-grid random one-channel ±1 changes and random RGB replacement, with explicit clipping, unique-pixel selection, seeds and actual parity counts. Add localized patches, stripes, targeted bootstrap changes, header changes and codeword boundary cases. PNG-container corruption is a separate parse boundary. No JPEG/resize product support is inferred.

A cover rule needs prespecified measurable image features, a development-only rule fit, and fresh held-out evaluation of both accepted and rejected covers across photographic sources. A payload cap needs a load-response study, all-overhead accounting, confidence bounds and explicit rejection behavior. It is the intersection of evaluated concealment limits, successful coding, repair/framing requirements and resource ceilings—not `3 × pixels`, selected pool size, a distortion score or one favorable load. Report useful UTF-8 bytes before compression, stored bytes after compression, salt, nonce, tag, framing, code parity, shortening/padding and carrier expansion separately. None of these unmeasured limits is selected here.

## 8. Hand-back and unresolved facts

The next human decision is which implementation and discovery route, if any, is worth a prototype. Merging these findings accepts the research only. It does not choose a production carrier, salt protection, repair/interleaving profile, cover rule or capacity cap.

Still required before that route can be shipped: exact core redistribution rights and complete dependency notices; a reproducible actual-message codec; stable RGB and matrix/layer framing; bounded filter/trellis allocations; common-runtime vectors and file exchange; measured post-extraction damage; fresh-corpus complete-format detection; device evidence; and independent review. A missing permission or inadequate implementation can stop a proposed route without proving that all adaptive coding is impossible.

The exact format decision remains downstream. The existing hiding decision already owns implementation-route selection, discovery, repair, cover suitability and capacity, so this report does not create parallel decision tickets or silently settle those choices.

## Sources

[keys]: https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6374176664
[direction]: https://github.com/jdragulanescu/obscr/issues/17#issuecomment-6374774775
[previous]: ./obscr-hiding-and-recovery.md
[experiment]: https://github.com/jdragulanescu/obscr/blob/e0e7ed81c2790f608029cad76289f79935904f29/spikes/unprotected-salt/FINDINGS.md
[package]: ../../package.json
[stc]: https://dde.binghamton.edu/filler/pdf/Fill10tifs-stc.pdf
[stc-site]: https://dde.binghamton.edu/download/syndrome/
[uniward]: https://dde.binghamton.edu/vholub/pdf/EURASIP14_Universal_Distortion_Function_for_Steganography_in_an_Arbitrary_Domain.pdf
[png]: https://www.w3.org/TR/2025/REC-png-3-20250624/
[emscripten]: https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html
[nist]: https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm
[old-codec]: https://github.com/jdragulanescu/obscr/blob/e0e7ed81c2790f608029cad76289f79935904f29/spikes/unprotected-salt/CODEC.md
[features]: https://dde.binghamton.edu/download/feature_extractors/
[wiser]: https://arxiv.org/pdf/1803.04805v2
[wiser-code]: https://github.com/tansq/WISERNet/tree/4e3b110d580ea1ed278181257b7c0ec410f89fc5
[dde]: https://dde.binghamton.edu/download/stego_algorithms/
[pystc-readme]: https://github.com/daniellerch/pySTC/blob/9bad216cd74f08d6b5f2655307abb191613d4bcb/README.md
[pystc-api]: https://github.com/daniellerch/pySTC/blob/9bad216cd74f08d6b5f2655307abb191613d4bcb/pystc/pystc.py
[pystc-interface]: https://github.com/daniellerch/pySTC/blob/9bad216cd74f08d6b5f2655307abb191613d4bcb/pystc/stc_interface.cpp
[pystc-ml]: https://github.com/daniellerch/pySTC/blob/9bad216cd74f08d6b5f2655307abb191613d4bcb/pystc/stc_ml_c.cpp
[pystc-matrix]: https://github.com/daniellerch/pySTC/blob/9bad216cd74f08d6b5f2655307abb191613d4bcb/pystc/common.cpp
[pystc-license]: https://github.com/daniellerch/pySTC/blob/9bad216cd74f08d6b5f2655307abb191613d4bcb/LICENSE.txt
[pystc-build]: https://github.com/daniellerch/pySTC/blob/9bad216cd74f08d6b5f2655307abb191613d4bcb/setup.py
[hstego-readme]: https://github.com/daniellerch/hstego/blob/bf71f6e0d7faaa632ad8a988c0393e94bfd13b2a/README.md
[hstego-code]: https://github.com/daniellerch/hstego/blob/bf71f6e0d7faaa632ad8a988c0393e94bfd13b2a/hstegolib.py
[hstego-license]: https://github.com/daniellerch/hstego/blob/bf71f6e0d7faaa632ad8a988c0393e94bfd13b2a/LICENSE.txt
[hstego-web]: https://github.com/daniellerch/hstego/blob/bf71f6e0d7faaa632ad8a988c0393e94bfd13b2a/setup-pyodide.py
[hstego-ijg]: https://github.com/daniellerch/hstego/blob/bf71f6e0d7faaa632ad8a988c0393e94bfd13b2a/src/jpeg-9c-win/jpeg-9c-src/README
[rust-commit]: https://github.com/stenoxide/stenoxide/commit/91a7322e83310a1a9577353f14cf7ad7f884e3c8
[rust-code]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/src/stego/stc/native.rs
[rust-manifest]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/Cargo.toml
[rust-workspace]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/Cargo.toml
[rust-license]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/LICENSE
[rust-build]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/build.rs
[rust-ci]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/.github/workflows/ci.yml
[rust-lock]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/Cargo.lock
[rust-frame]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/src/pipeline/frame.rs
[rust-cost]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/src/cost/hill.rs
[rust-readme]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/README.md
[rust-pipeline]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/src/pipeline/mod.rs
[rust-permute]: https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/src/stego/permute.rs
[chacha-license]: https://docs.rs/crate/chacha20/0.10.1/source/Cargo.toml
[zeroize-license]: https://docs.rs/crate/zeroize/1.9.0/source/Cargo.toml
[conseal-readme]: https://github.com/uibk-uncover/conseal/blob/7acae342a07de9d5c9a9870253d1713517259339/README.md
[conseal-trellis]: https://github.com/uibk-uncover/conseal/blob/7acae342a07de9d5c9a9870253d1713517259339/conseal/coding/trellis.py
[conseal-manifest]: https://github.com/uibk-uncover/conseal/blob/7acae342a07de9d5c9a9870253d1713517259339/Cargo.toml
[stegolab]: https://github.com/daniellerch/stegolab/blob/d193262727a35aeead5f9387da4ccec91894b2c0/codes/STC.py
[simd]: https://emscripten.org/docs/porting/simd.html

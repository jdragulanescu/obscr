# Password processing and image-position generation

Research date: **2026-10-13**. Investigation for [Find supported password and map-generation building blocks](https://github.com/jdragulanescu/obscr/issues/14), under [Harden Obscr security and preserve repeatable attack checks](https://github.com/jdragulanescu/obscr/issues/11). **Findings, not an accepted product decision or image-format specification.**

Historical research: #70 removed the legacy implementation described below.
Its source links are pinned to the last pre-cutover tree; see the
[current operations](../../README.md#protected-image-operations) for the implemented format.

## TL;DR

- **A viable common implementation exists:** `libsodium-wrappers-sumo@0.8.4`, with `libsodium-sumo@0.8.4` explicitly locked, exposes Argon2id, separate-key derivation, and deterministic ChaCha20 generation in Node and browsers. Its password API fixes Argon2 parallelism to one lane; selecting it therefore does **not** select either four-lane RFC 9106 recommended profile unchanged. ISC licensing and the examined Argon2 code's CC0 notice are permissive, subject to preserving the applicable notices. [S-package][S-raw-package][S-readme][S-api][S-pwhash-source][S-license][S-core-license]
- **Other viable building blocks have different costs:** `@noble/hashes@2.4.0` offers dependency-free JavaScript Argon2id, scrypt and HKDF, but its maintainers caution against JavaScript Argon2 performance and explicitly exclude Argon2 from the cited independent audit. `hash-wasm@4.12.0` exposes tunable Argon2id lanes and embeds its WASM, but the latest release and default-branch commit observed were from November 2024; ongoing maintenance is unproven, and its embedded-source licensing needs more than the package's MIT label. No device-speed ranking was measured. [N-package][N-readme][N-release][H-package][H-readme][H-release][H-commit][H-license]
- **The necessary architectural change is upstream of both encryption and placement:** obtain a fresh public per-image salt before generating the map, run one expensive password KDF, derive distinct encryption/placement keys, then use the entire placement key with a cryptographic deterministic stream and unbiased sampling without replacement. Increasing only today's AES PBKDF2 iterations leaves the independent fast, at-most-32-bit placement search unchanged. This conclusion follows from the current code and the standard constructions; it is not a measured attack result. [R-utils][R-mt][R-core][R-node][RFC9106][RFC5869]
- **Authentication is available without changing AES-GCM:** require a 16-byte tag in the parser and Node cipher options, set Web Crypto `tagLength: 128`, and authenticate canonical metadata with Node `setAAD()` / Web Crypto `additionalData`. Bootstrap data must be bounded before it can be authenticated. [Node-crypto][WebCrypto][GCM]
- **Human choices remain:** supported devices/runtimes, tolerable delay and memory, maintenance/audit requirements, visible bootstrap versus external bootstrap, legacy-image policy, and payload/map limits. Experiments must establish responsiveness, memory peaks, interoperability and attacker costs; this investigation ran no application code, installations, tests, prototypes or benchmarks.

## Evidence and assumptions

**Observed facts** below come from the checked-out source, exact npm package metadata, pinned upstream source/license files, standards and original papers. Package metadata was read, not installed; published vectors were inspected, not executed. A README compatibility claim is not a tested Obscr browser matrix. Release dates are evidence of activity, not a support guarantee. Where a source is a moving documentation page, its access date is the research date; package-source links are pinned to npm `gitHead` or the recorded submodule revision.

**[INFERENCE]** identifies consequences derived from those facts. **Candidate** identifies a possible future composition, not an implemented or agreed design. Working assumptions for that analysis: an attacker can copy images, know the algorithm and make unlimited offline guesses; CLI/PWA must decode the same images; passwords may have low entropy; AES-256-GCM remains the payload cipher. No claim of steganographic undetectability, secure endpoint execution, FIPS validation or complete legal clearance is made.

### Current integration constraints

| Observed component | Relevant behavior |
|---|---|
| [`lib/crypto.js`][R-node] | AES-256-GCM; PBKDF2-HMAC-SHA512, 65,535 iterations, 32-byte output; random 32-byte salt and 12-byte nonce. Serializes `salt:nonce:ciphertext:tag[:compressed]`. No AAD call or explicit decryption tag-length restriction. |
| [`app/src/lib/webCrypto.js`][R-web] | Mirrors those KDF parameters with UTF-8 password bytes and Web Crypto; splits/joins ciphertext and tag. GCM uses the API's default 128-bit tag, but the separate parsed tag has no explicit exact-length check. Compression flag is outside ciphertext and no AAD is supplied. |
| [`lib/utils.js`][R-utils], [`lib/mersenne-twister.js`][R-mt] | Placement hashes only the password, sums absolute SHA-512 words and seeds MT with `s >>> 0`. It selects positions with `genrand_int32() % i`, removes each selected entry, and builds an entire order. |
| [`lib/steg-core.js`][R-core] | Synchronous placement/read preparation receives the password, not an expensive derived key. Domain is the image's RGB LSBs, excluding alpha. The encrypted envelope, including its salt, is inside that password-dependent map. |
| [`package.json`][R-package] | ESM project with Vite/React browser app and shared `lib/`; no declared Node engine minimum. A new engine floor would be a product/support change, not an existing constraint. |

**[INFERENCE]** For a fixed capacity, there are at most `2^32` seeded placement sequences, regardless of password length or AES key size; seeds need not be uniformly distributed. Equal password and capacity repeat the map because neither image salt nor nonce participates. Existing modulo selection introduces bias when the remaining interval does not divide `2^32`; the removal step already ensures uniqueness. These are separate issues: replacing MT with a cryptographic stream alone would not fix cheap password derivation, seed truncation or biased range reduction. [R-utils][R-mt][Lemire]

A salted shared root requires an integration cutover: salt/bootstrap extraction must precede root derivation and map generation, and the shared core must receive derived placement material or a deterministic stream rather than independently processing a password. No production interfaces were changed here.

## 1. Password constructions: fixed requirements versus tuning

### Argon2id

[RFC 9106 §§1, 3, 4, 7][RFC9106] is a CFRG/IRTF **Informational** specification of Argon2 version 1.3, not an Internet Standards Track RFC. Argon2id uses data-independent addressing for the first half of its first pass and data-dependent addressing thereafter. The original [Argon2 design paper][Argon-paper] explains the memory/time-area and side-channel tradeoffs; its historical performance figures are not Obscr measurements. Argon2id does not make compromised browser code safe or eliminate every side channel.

| Construction/interoperability requirement | Tunable choice and consequence |
|---|---|
| Pin variant `Argon2id`, version `0x13` / decimal 19, password/salt bytes, output length and optional-input semantics. BLAKE2b, 1,024-byte blocks and four synchronization slices are algorithm details, not tuning switches. | Choose a root output such as 32 bytes; use the raw output, not a stored password-verification string. Output length itself participates in Argon2, so “derive 64 bytes and truncate” is not equivalent to deriving 32. |
| `p` is a lane count in `1..2^24−1`; `m` is KiB, at least `8p`; `t` is at least one pass. Actual memory blocks are `4p × floor(m/(4p))`. | `m`, `t`, `p` determine both cost **and output**. Lanes are not a promise that a JS/WASM wrapper uses multiple OS threads. A decoder must use the encoded profile, not substitute its local CPU count. |
| Salt is an explicit input; RFC recommends 16 bytes and uniqueness for each password. Optional secret and associated data have defined length-prefixed semantics. | Fresh random salt for each encryption avoids reuse across images. For a portable baseline, empty optional secret/data is a candidate; a public value shipped in the app is not a secret pepper. |

RFC 9106 supplies two reference profiles; these are **standard recommendations, not selected Obscr settings or observed memory peaks**:

| RFC profile | Memory parameter | Passes | Lanes | Salt | Output |
|---|---:|---:|---:|---:|---:|
| First recommended | 2,097,152 KiB (2 GiB) | 1 | 4 | 16 bytes | 32 bytes |
| Second recommended, memory-constrained | 65,536 KiB (64 MiB) | 3 | 4 | 16 bytes | 32 bytes |

The RFC's tuning procedure chooses affordable memory and time, then measures passes. Neither profile demonstrates that mobile Safari can afford its total memory footprint alongside decoded images, pixel arrays, workers and map state. `p=1` is valid Argon2id but is a different profile, not an execution optimization preserving a `p=4` output. [RFC9106 §4][RFC9106]

### Appropriate alternatives

- **scrypt:** memory-hard password KDF specified by [RFC 7914][RFC7914]. `N > 1` must be a power of two within the RFC bound; `r` controls block size and `p` the independent work count. Its ROMix table has `N` entries of `128r` bytes per active instance; this is algorithmic storage, not total app memory. Higher `p` can increase computational work without requiring simultaneous execution or proportional resident memory. Noble and hash-wasm expose browser/Node implementations; Node also has native `crypto.scrypt()`. It is a credible alternative if JS/WASM/device measurements favor it, not a drop-in parameter translation from Argon2. [N-readme][H-readme][Node-crypto]
- **PBKDF2-HMAC-SHA256 or SHA512:** specified in [RFC 8018 §5.2][RFC8018], supported by Node and Web Crypto. Iterations increase serial PRF work but do not provide Argon2/scrypt's tunable memory hardness. It is the minimal-extra-dependency option for a native-API baseline; a new profile still needs measurement and must feed **both** encryption and placement. The RFC's old illustrative iteration counts are not contemporary deployment targets. [RFC7914 §1][RFC7914][WebCrypto][Node-crypto]
- **HKDF, SHA-512, AES or ChaCha alone are not expensive password processing.** HKDF separates/expands key material and expressly does not slow dictionary attacks; use it after the password KDF, not instead of one. No examined requirement justifies adding bcrypt or stacking multiple password KDFs. [RFC5869 §5][RFC5869]

Password-to-byte encoding must be identical on both platforms. Explicit UTF-8 and a recorded normalization policy are decision inputs; silently adding Unicode normalization would change which existing passwords are equal. RFC 8018 treats passwords as byte strings and calls out encoding interoperability. [RFC8018 §3][RFC8018]

## 2. Exact implementation candidates

The comparison centers on the newest releases actually observed in the queried release feeds, not versions inferred from the date. Initial historical spot-checks also examined Noble **2.0.1** (MIT, Node `>=20.19.0`, no runtime dependencies) and Sodium wrappers **0.7.15** (ISC, dependency `libsodium-sumo:^0.7.15`); their metadata/docs are not used to assert current behavior. [N-old][S-old]

| Candidate examined | Release/maintenance evidence | Runtime, dependency and build constraints | Integration cost / limitation |
|---|---|---|---|
| **`libsodium-wrappers-sumo@0.8.4` + `libsodium-sumo@0.8.4`** | Wrapper release published **2026-04-19**; preceding 0.8.3 release explicitly updated native libsodium to 1.0.22. The 0.8.4 source pins native revision `33cc75ab1565d9dcbe808354191bd572ad6b64d0`. These are positive release-maintenance observations. [S-release][S-submodule] | npm wrapper declares `libsodium-sumo:^0.8.0`, so lock the actual transitive release. ESM and CommonJS exports; await `sodium.ready` and access crypto functions through the default object. Prebuilt Emscripten WASM/pure-JS distributions; no consumer C compiler required. Rebuilding requires Emscripten, Binaryen, Bun, make and the native submodule. [S-package][S-raw-package][S-readme][S-build] | Only **sumo** includes password hashing. `crypto_pwhash` uses fixed-length salt, `opslimit` and memory **bytes**, and fixes `p=1`; explicitly request `ALG_ARGON2ID13`, not changeable `ALG_DEFAULT`. Initialization and synchronous KDF work need worker integration. Larger API surface includes low-level functions upstream warns can be easy to misuse. [S-pwhash][S-pwhash-source][S-readme] |
| **`@noble/hashes@2.4.0`** | Published **2026-08-27**; release describes correctness/security hardening and scheduler-yield changes, with earlier 2.2/2.3 releases in 2026. npm records provenance metadata; no signatures or artifacts were independently verified here. [N-release][N-package] | Pure JS distributed from TypeScript; ESM-only package and `.js` subpath imports; engine **Node >=20.19.0**; zero runtime dependencies; no WASM/native build requirement for consumers. Source build uses TypeScript. Browser use is documented without a precise tested browser-version floor. [N-package][N-readme] | Argon2 exposes `m` in KiB, `t`, `p`, `version`, `dkLen`, memory bound and async variants; scrypt/HKDF available in the same package. Maintainers recommend scrypt over their JS Argon2 for performance. Treat this as a reason to measure, not a transferable slowdown factor. Version 2.4 defaults to 1 GiB Argon2 memory; protocol profiles should set explicit costs, never inherit library defaults. [N-source][N-readme] |
| **`hash-wasm@4.12.0`** | Release and latest observed default-branch commit both **2024-11-19**. This does not prove abandonment, but there is **no observed recent release/commit evidence** sufficient to call it actively maintained in October 2026. [H-release][H-commit] | Zero runtime dependencies; ESM/UMD; C compiled to WASM embedded as base64; documented Node, Deno, modern browser and Web Worker use. No exact engine/browser floor is declared in the examined metadata/docs. Consumer uses prebuilt code; rebuilding invokes Docker/Clang, make, Node/Rollup and TypeScript. [H-package][H-readme][H-build] | Argon2id v1.3 with explicit `parallelism`, `iterations`, `memorySize` **KiB**, `hashLength` and binary output. Rejects empty password and salt shorter than eight bytes; optional secret supported, but associated-data length is hardcoded to zero. Promise-based API still calls the heavy WASM calculation synchronously; a Promise alone is not off-main-thread execution. [H-source][H-C] |

**Audit scope:** Noble's pinned README identifies a Cure53 audit of **1.0.0 in January 2022**, explicitly excluding `argon2` (and several other modules). This is not an independent audit of 2.4.0 Argon2, or of Obscr's composition. No independent audit covering the exact hash-wasm/Sodium wrapper-and-binary revisions was established by this investigation; absence of such evidence here is not a claim that no audit exists. [N-readme §Security][N-readme]

**Browser support:** Sodium's README lists Chrome 16+, Firefox 21+, Safari 6+, iOS Safari 8+, Edge, Opera, Node and Bun. These are upstream library claims, including its pure-JS route—not evidence that those browsers run Obscr's Vite/React build, ESM path, Web Crypto or intended KDF memory profile. For all candidates, test the actual supported Safari/iOS, Chromium and Firefox versions, worker startup, CSP/WASM allowance and PWA offline asset loading. `SubtleCrypto` is a secure-context API exposed to windows and workers. No cross-origin-isolation or WASM-thread requirement was established for the examined single-threaded paths. [S-readme][H-C][WebCrypto]

**Native Node alternative:** the observed **Node v24.21.0** documentation includes `crypto.argon2()` / `argon2Sync()`, added in **v24.7.0**; `memory` is KiB and `nonce` means the password salt. Native Node Argon2 or scrypt could pair with a browser library, at the cost of two implementations and cross-runtime vectors. Do not claim Node lacks Argon2, or infer browser Argon2 support from Node. The examined Web Crypto algorithm list does not establish a portable browser Argon2/scrypt baseline. No separate native-addon npm package was examined. [Node-crypto][WebCrypto]

### Licensing evidence and shipping obligations

- **Noble 2.4.0: MIT.** The examined license grants use, modification, distribution, sublicensing and sale, provided copyright and permission notices accompany copies/substantial portions; warranty is disclaimed. This supplies a permissive route for Obscr, whose package also declares MIT. [N-license][R-package]
- **Sodium wrappers/raw package 0.8.4: ISC.** Wrapper and pinned native root licenses permit use/copy/modification/distribution with or without fee, retaining copyright and permission notices. The examined native Argon2 core is separately marked **CC0 1.0**. Preserve component notices as well as the wrapper notice; the root license is not a complete bill of materials for every bundled sumo primitive. [S-license][S-core-license][S-argon-license]
- **hash-wasm 4.12.0: MIT wrapper, mixed embedded-source notices.** Its LICENSE explicitly directs consumers to C-file headers. The required BLAKE2b implementation offers **CC0 1.0 OR OpenSSL License OR Apache-2.0**; choosing CC0 is a permissive route, not a requirement to accept all three. Its Argon2 C header says it is based on Go's crypto implementation, without identifying a Go revision in that header; Go's crypto LICENSE is BSD-3-Clause-style, requiring source/binary notices and prohibiting endorsement. **Unresolved:** confirm exact derivation and completeness of attribution in the artifact selected for shipping; this observation is not a determination of infringement. [H-license][H-blake][H-C][Go-license]
- **CC0 is not a patent clearance:** the legal text includes a copyright waiver and fallback license, but expressly does not grant trademark or patent rights. This investigation establishes permissive copyright-license options, not jurisdiction-specific legal advice, a patent search or a verified artifact-to-source build. [CC0]

### Published vectors and interoperability evidence

| Source inspected | What it supplies; what remains |
|---|---|
| [RFC 9106 §5.3][RFC9106] | Argon2id v19 vector: `m=32 KiB`, `t=3`, `p=4`, 32-byte output, password `01` repeated 32 times, salt `02` repeated 16 times, secret `03` repeated eight times, associated data `04` repeated 12 times. Expected output `0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659`. This is a correctness vector, **not a secure deployment profile**. |
| [Noble 2.4.0 Argon2 tests][N-vectors] | Publishes reference-implementation/Argon2id expected outputs including the above expected value, older-version cases and additional inputs. Presence of tests is not evidence of execution here. |
| [hash-wasm 4.12.0 tests][H-vectors] | Publishes known expected outputs across lanes, memory, iterations, binary input and secret use. Example: password `a`, salt `abcdefgh`, `p=1,t=2,m=16 KiB,T=16` gives `f94aa50873d67fdd589d6774b87c0634`. Cannot feed the complete RFC §5.3 vector through this API because it lacks associated data. |
| [Pinned Sodium Argon2id tests][S-vectors] and [expected outputs][S-expected] | Publishes raw-password/salt/cost cases and expected hex output. High-level `crypto_pwhash` cannot represent the RFC vector's `p=4`, secret and associated data; use matching `p=1`/empty-optional-input vectors when comparing implementations. |
| [RFC 7914 §§8–12][RFC7914], [RFC 5869 Appendix A][RFC5869], [RFC 8439 §2.3.2 and Appendix A][RFC8439] | Independent reference vectors for scrypt's components/full KDF, HKDF and ChaCha20. Future integration must also pin stream byte order/counter, rejected sampling draws, positions and AEAD AAD/tag behavior; primitive vectors alone do not prove image interoperability. |

## 3. Candidate key and map composition

### Expensive root, separate child keys

**Candidate A — standard HKDF separation:** generate fresh random `S` for each encryption, obtain `R = Argon2id(passwordBytes, S, explicitProfile, outputLength=32)`, then use HKDF-SHA256 extract-and-expand to derive separate 32-byte `K_enc` and `K_map`. Example domain labels are `obscr/<version>/encryption` and `obscr/<version>/placement`; a precisely encoded public context can bind the version, suite, image geometry and channel-domain definition. Specify the HKDF salt and info bytes, including field lengths, rather than concatenating ambiguous strings. A distinct fixed HKDF extraction context is possible; its role is different from the random password salt. [RFC5869 §§2–3][RFC5869]

HKDF can be provided by Noble or the Node/Web Crypto APIs. Expanding a pseudorandom root directly with HKDF-Expand is also described by RFC 5869, but full extract-and-expand keeps one conventional interface. HKDF does not create password entropy. Do not publish `R` or a password-hash string containing `R`: it is secret key material, not an authentication-server record. [N-readme][Node-crypto][WebCrypto][RFC5869]

**Candidate B — Sodium-only separation:** derive a 32-byte Argon2id root with `crypto_pwhash`, then use `crypto_kdf_derive_from_key` with distinct subkey IDs and an exact eight-byte application context for encryption and placement. This is Sodium's documented BLAKE2b-based KDF, **not HKDF**. It reduces extra implementation dependencies but makes the protocol specify Sodium's KDF and `p=1` password profile; arbitrary longer context needs a deliberately specified encoding/derivation strategy. [S-kdf][S-api][S-pwhash-source]

One expensive root is sufficient for both branches: two independent password-KDF runs would cost legitimate users twice while an attacker could target the cheaper useful verifier. GCM requires its key to be used exclusively for GCM, further supporting separation from map generation. **[INFERENCE]** With a fresh random salt, the same password normally yields different root/placement keys per image; that is per-image freshness, not an additional secret. [GCM §5.1][GCM][RFC8018 §3][RFC8018]

### Full-key deterministic generation

“Full-strength” here means **no deliberate small seed/search bottleneck**: consume all 32 placement-key bytes. It does not promise 256 bits of password entropy, 256-bit GCM authentication, or `N!` equally reachable maps from a finite keyspace.

- **ChaCha20 IETF:** use the 256-bit placement key, a specified 96-bit map nonce, initial block counter and byte order. Sodium sumo exports `crypto_stream_chacha20_ietf_xor_ic`; XORing zero bytes obtains the stream. Its parameter called `nonce_increment` is the **initial block counter**, not a request to increment the nonce. Counter blocks are 64 bytes; the 32-bit block counter must never wrap. Starting at zero permits at most `2^32` blocks (`2^38` bytes); later initial counters reduce that budget. Buffering must preserve unused bytes across calls and produce the same sequence independent of chunk sizes. This is protocol composition needing vectors, not a recommendation to write ChaCha rounds. [S-api][S-chacha][RFC8439]
- **Sodium deterministic helper:** `randombytes_buf_deterministic(length, seed)` is documented to return the same bytes for the same seed, with a `2^38`-byte ceiling. The pinned source uses ChaCha20-IETF with the fixed nonce `LibsodiumDRG`. It is chiefly documented for tests and exposes no seek/continuation state: repeated calls with the same seed **restart the stream**, not extend it. Whole-stream allocation or explicitly domain-separated chunk seeds have costs. A counter-addressable stream is the clearer candidate for incremental large maps. Do not use ordinary `randombytes_uniform()` for decoding; it draws fresh randomness, not the password-derived stream. [S-random][S-random-source]
- **AES-256-CTR alternative:** encrypt zeros under a separate placement key using Node `aes-256-ctr` / Web Crypto `AES-CTR`. The browser API requires a 16-byte initial counter and explicit counter-bit `length`; for example a specified 128-bit big-endian counter domain can be shared. Fix the initial block, chunk-boundary handling, maximum output and no-wrap behavior. This avoids adding a ChaCha implementation when the KDF library lacks one, but adds native/browser adapter interoperability work. CTR is being used as a generator, **not as an unauthenticated replacement for GCM payload encryption**. [Node-crypto][WebCrypto §AES-CTR][WebCrypto]

Different purposes—payload encryption, map generation, optional filler, chunks or a second embedded record—need distinct keys or non-overlapping explicitly defined nonce/counter domains. Never reset a generator at each rejected draw or reuse GCM's encryption key as the map key. Fresh per-image root keys allow a fixed map nonce for one stream per root if that invariant is explicit; a stored map nonce is another possible design, not a substitute for fresh salt. Reproducing the same stream to read the **same image** is intended. [RFC5869][RFC8439][GCM]

### Unbiased positions without replacement

[Lemire's original paper][Lemire] explains modulo bias, rejection sampling and Fisher–Yates. A simple candidate for `1 <= b <= 2^32` is:

1. Read an unsigned 32-bit word `x` from the deterministic stream using a specified byte order.
2. Compute `limit = floor(2^32 / b) * b`; reject `x >= limit` and consume another word.
3. Use `x % b` only after acceptance.

The accepted interval contains exactly the same number of representatives of every remainder. This is **unbiased range reduction under uniform input**; with a cryptographic generator the output is computationally pseudorandom, not information-theoretically uniform over every permutation. The `2^32` sentinel must not be truncated with JS bitwise operators. Zero bounds must be rejected; larger domains need a specified wider exact-integer method or an explicit image limit. [Lemire §§2–3][Lemire]

For unique positions, use the accepted index to select and remove an entry from the remaining position pool, as in Fisher–Yates. The current swap-with-last removal structure can be retained conceptually while replacing its randomness and bounding logic. Full permutation needs `O(N)` state/work; a lazy sparse representation of the same swaps can emit a prefix of `k` positions using `O(k)` stored swaps and expected dictionary access, although JS Map overhead must be measured. **[INFERENCE]** This follows from storing only deviations from the identity pool; it is not a measured optimization or a new security primitive. [R-utils][Lemire]

Reserve/exclude bootstrap positions before defining the sampled domain; define geometry, RGB order, alpha handling, bit depth, rejection consumption, and traversal direction identically in both apps. Reject payload demand beyond the eligible domain. Drawing arbitrary indices and discarding duplicates is not the same algorithm; it becomes increasingly wasteful near capacity. Sorting short random keys introduces tie handling and is unnecessary. No examined package supplies an Obscr-ready, format-aware permutation API—some carefully specified shared sampling logic remains necessary.

## 4. Bootstrap, freshness and offline-verifier economics

### The salt must be recoverable first

Today's encryption salt is inside the password-selected payload. **[INFERENCE]** Reusing that arrangement for a salted expensive map KDF is circular: the reader needs the salt to find the salt. The following are distinct product choices, not fixes already accepted:

- **(a) Read a small public bootstrap at known locations.** It supplies salt, suite/profile identifier and whatever bounded routing information is necessary; reserve those bits from the payload map. This preserves a self-contained image but makes those locations identifiable and easy to corrupt. A recognizable magic/version gives a detector additional evidence; exact detectability is not quantified here.
- **(b) Obtain bootstrap data outside the image.** A sidecar or explicitly supplied salt/profile avoids a fixed in-image header, but users must retain and transfer it; the image alone no longer suffices.
- **(c) Derive bootstrap material from image features guaranteed not to change during embedding.** This can avoid dedicated header positions, but requires a canonical definition and robust decoding. Reusing the same cover/features repeats the salt and can repeat the map; features have no guaranteed randomness. Hashing an entire image that embedding changes is circular. This is not an established substitute for fresh random per-encryption salt.

A fast password-derived bootstrap map would restore a password-dependent cheap path if its output can be recognized or checked; hiding a salt does not itself provide password strength. Authentication cannot make bootstrap parsing safe retroactively: cap KDF cost, lengths, image dimensions, allocations and accepted profiles **before** expensive work. Authenticate the original canonical bootstrap bytes later, and reject rather than silently falling back to a weaker algorithm. [RFC8018 §4][RFC8018][GCM]

### What an offline attacker pays

- **Old map shortcut:** password candidates can be converted to maps without PBKDF2; alternatively the attacker can enumerate the bounded seed space without recovering the password. The extracted textual/base64/colon envelope and termination/redundancy structure provide potential cheap recognition filters. **[INFERENCE]** A recognized map/envelope is not necessarily a unique password and does not decrypt AES. False-positive rates and practical attack throughput remain unmeasured. [R-utils][R-mt][R-node]
- **New salted-root map:** all password-dependent map output and password-checking metadata should depend on the expensive root. A public version/salt is not a password verifier. But a MAC or recognizable inner header derived after the root can let an attacker reject a guess after only a small map prefix; do not count full-image extraction or GCM decryption as guaranteed work on every guess. **[INFERENCE]** The defensible cost floor is the chosen root computation (subject to cryptanalytic/time-memory optimizations), not the sum of all legitimate app work. [RFC9106 §7][RFC9106]
- **Offline checks remain possible:** successful AEAD authentication is a verifier. Removing an explicit password-check field does not prevent offline guessing. A KDF increases cost; it does not repair weak passwords or place a server rate limit on copied images. Do not store the root itself to “verify” a password. [RFC8018][GCM]
- **Precomputed or reused layouts:** a fixed public layout permits extraction without a password; confidentiality can still rest on correctly used AEAD, but placement secrecy is absent. A secret map reused across images can amortize learning/search and correlate positions. A fixed public lookup table indexed by a small seed preserves that seed-space ceiling. Increasing only AES iterations leaves these placement properties unchanged. **[INFERENCE]** Fresh random salt at the root prevents direct password-to-map precomputation across different salts, but many images with one password still allow attacking the cheapest acceptable image profile and reusing the recovered password elsewhere. [R-utils][RFC8018 §§3–4][RFC8018]

Random-looking or password-keyed placement is not a proof of steganographic security. A known original cover or statistical image analysis may disclose modifications independently of passwords. No detection experiment or claim about resistance to resizing/recompression is made here.

## 5. AES-GCM: full tags and authenticated metadata

[NIST SP 800-38D][GCM] separates confidential plaintext from **authenticated but unencrypted** additional data and requires IV uniqueness per key. A candidate Obscr suite can fix a 12-byte IV and **128-bit authentication tag**; this is a conservative protocol constraint, not a claim that the API or original standard permits no shorter tags.

| Interface | Exact integration requirements supported by the API |
|---|---|
| Node `node:crypto` | Use `createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 })` and the corresponding `createDecipheriv(..., { authTagLength: 16 })`. Pass canonical bytes to `cipher.setAAD()` / `decipher.setAAD()` **before** `update()`. Encryption retrieves the tag after `final()`; decryption supplies `setAuthTag(tag)` before `final()`. Explicitly check decoded tag length is 16; the documented default during **encryption** is not a decryption restriction. Do not release/interpret/decompress bytes from `decipher.update()` until `final()` succeeds. [Node-crypto] |
| Browser Web Crypto | Import raw 32-byte encryption key for `AES-GCM`, with only necessary usages and non-extractable status where possible. Use `{ name: 'AES-GCM', iv, additionalData: aadBytes, tagLength: 128 }` on **both** encrypt and decrypt. Input/output is `ciphertext || tag`, not separate API arguments. Validate the format's separate tag as exactly 16 bytes before joining; successful API authentication is still required. Failure rejects with `OperationError`. [WebCrypto §AES-GCM][WebCrypto] |

**Candidate authenticated fields:** format/suite version, KDF identifier and exact parameters, salt, map algorithm/domain/nonce if present, ciphertext length and compression/encoding flags. Geometry belongs in AAD if it is part of the intended decoding contract. Both platforms need the **same canonical byte encoding**, not language-specific JSON serialization. This lists inputs needing a decision, not a completed header layout.

Metadata necessary for key derivation and placement must be usable before final authentication; treat it as untrusted until GCM verifies it. Altering it should lead to rejection, not an authenticated message interpreted under altered flags. Current compression flags sit outside ciphertext and AAD, so changing only the cryptographic primitive would not authenticate those flags. [R-node][R-web][GCM]

GCM tag enforcement does not fix nonce reuse or weak passwords. Fresh per-image root keys reduce cross-image nonce-sharing scope, but retry/re-encryption behavior must still avoid repeating an IV with the same encryption key. Neither successful authentication nor a fresh nonce is an anti-replay policy. [GCM §§8, Appendix D][GCM]

## 6. Viable choices, costs and dependent human decision

When someone hides a message in the PWA and later opens the image in the CLI, the receiver must reproduce the same expensive root and map on its supported device:

- **(a) Use Sodium sumo on both platforms for Argon2id, subkeys and ChaCha20; retain native AES-GCM.** Gains common maintained primitives and a permissive license route. Costs a larger WASM/pure-JS distribution, initialization/worker integration, `p=1` restriction, exact transitive locking and ownership of deterministic sampling/metadata rules.
- **(b) Use Noble scrypt + HKDF on both platforms, and native AES-CTR for the map stream.** Gains zero-runtime-dependency JS KDF code and no WASM requirement. Costs selecting a different memory-hard construction, a Node >=20.19 support floor, measured JS/device tradeoffs and AES-CTR adapter vectors. Noble Argon2 is also functional, but its maintainer caution and audit exclusion remain relevant.
- **(c) Use hash-wasm Argon2id + native HKDF/AES-CTR.** Gains explicit Argon2 lane settings and embedded WASM without runtime dependencies. Costs unresolved current maintenance, embedded-license attribution checking, worker/CSP integration and multiple cryptographic API boundaries.
- **(d) Use native PBKDF2 + HKDF + AES-CTR/GCM throughout.** Gains a minimal-extra-package native-API route. Costs giving up tunable memory hardness; it still must replace the cheap map password path. It is an explicit compatibility/security tradeoff, never an automatic fallback when Argon2 allocation fails.

**Research recommendation, not selection:** take **(a)** and **(b)** to a bounded cross-device experiment first, because observed maintained releases and documented browser/Node primitives make them concrete choices with materially different deployment costs. Keep **(c)** conditional on maintenance/licensing clarification; consider **(d)** only if the human explicitly accepts its non-memory-hard tradeoff. A `p=4` requirement would change this shortlist. No option is approved for production by this report.

### Precise unresolved inputs

**Human decisions required before a format/profile is fixed:**

1. Minimum Node version, supported browsers/devices, minimum available RAM, and whether rejecting low-memory devices is acceptable.
2. Maximum acceptable per-operation delay, cancellation expectation and concurrency; whether one profile or explicit versioned strength tiers are allowed.
3. Whether self-contained images and the salt bootstrap's visibility are requirements; acceptable detectable metadata, capacity loss and behavior when bootstrap is damaged.
4. Whether old images must remain readable, whether old writing ends, and how downgrade/legacy selection is explicit. New KDF/map parameters cannot reinterpret old images transparently.
5. Required independent-audit scope, maintenance expectations, third-party-notice obligations and whether any regulatory/FIPS requirement applies. No candidate is established here as a validated module.

**Measured experiments needed later; none executed here:**

- Known-answer/cross-library root checks with exact bytes, profile units, output lengths, Unicode policy and optional inputs; both directions of CLI/PWA encryption/decryption.
- Map vectors including counter boundaries, chunk sizes, rejection draws, one-element/non-power-of-two domains, bootstrap exclusions and full-capacity uniqueness. Check that changing salt changes the stream and same inputs reproduce it; this is correctness, not a statistical security proof.
- Cold/warm initialization, KDF time, peak resident/WASM/JS/image memory, worker message costs, cancellation and UI responsiveness on the agreed slowest devices. Measure whole operations rather than copying upstream speed tables.
- Actual Vite production/PWA offline bundling, worker/CSP policy and secure-context behavior. The npm tarball/source correspondence and native submodule version should be checked for the final locked artifacts.
- Negative authentication cases: truncated/extended tags, altered metadata or compression flag, wrong nonce, corrupted pixels, excessive KDF requests and no plaintext use before authentication.
- Repeatable attack checks: cost and false-positive rate of the old seed/envelope shortcut, the earliest useful verifier after the new root, amortization across images and malformed-input resource limits. Do not assume attackers run the application's whole decode path.

**Facts still not established:** real Obscr performance/memory on any candidate; exact supported browser floor; exact-version independent audit coverage beyond Noble's stated exclusion; hash-wasm maintainer responsiveness and Go-derived attribution completeness; artifact reproducibility; final cost profile, bootstrap encoding, serialization, map limits or legacy policy. These are explicit limits of this investigation, not unimplemented promises.

## Source provenance

[R-node]: https://github.com/jdragulanescu/obscr/blob/cd896ffc7915683ba3b3807eac4b5483617c1be2/lib/crypto.js
[R-web]: https://github.com/jdragulanescu/obscr/blob/cd896ffc7915683ba3b3807eac4b5483617c1be2/app/src/lib/webCrypto.js
[R-utils]: https://github.com/jdragulanescu/obscr/blob/cd896ffc7915683ba3b3807eac4b5483617c1be2/lib/utils.js
[R-mt]: https://github.com/jdragulanescu/obscr/blob/cd896ffc7915683ba3b3807eac4b5483617c1be2/lib/mersenne-twister.js
[R-core]: https://github.com/jdragulanescu/obscr/blob/cd896ffc7915683ba3b3807eac4b5483617c1be2/lib/steg-core.js
[R-package]: https://github.com/jdragulanescu/obscr/blob/cd896ffc7915683ba3b3807eac4b5483617c1be2/package.json

[RFC9106]: https://www.rfc-editor.org/rfc/rfc9106.html
[RFC7914]: https://www.rfc-editor.org/rfc/rfc7914.html
[RFC8018]: https://www.rfc-editor.org/rfc/rfc8018.html
[RFC5869]: https://www.rfc-editor.org/rfc/rfc5869.html
[RFC8439]: https://www.rfc-editor.org/rfc/rfc8439.html
[Argon-paper]: https://www.cryptolux.org/images/0/0d/Argon2.pdf
[Lemire]: https://arxiv.org/html/1805.10941v4
[GCM]: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
[WebCrypto]: https://w3c.github.io/webcrypto/
[Node-crypto]: https://nodejs.org/docs/latest-v24.x/api/crypto.html
[CC0]: https://creativecommons.org/publicdomain/zero/1.0/legalcode.en
[Go-license]: https://raw.githubusercontent.com/golang/crypto/master/LICENSE

The Web Crypto page observed was the **2026-08-11 Editor's Draft**, revision `811c24c69eb22d477af5f1678cb70dbc611c7c40`; it is a work in progress, not proof of browser implementation. The established interfaces also appear in the [2017 Web Crypto Recommendation](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/). Node documentation observed identified itself as **v24.21.0**. No future release or browser capability is assumed from either document.

[N-package]: https://registry.npmjs.org/@noble/hashes/2.4.0
[N-release]: https://github.com/paulmillr/noble-hashes/releases/tag/2.4.0
[N-readme]: https://github.com/paulmillr/noble-hashes/blob/663c2aeeffc308ac0cded59bd32f7c212adacfc2/README.md
[N-license]: https://github.com/paulmillr/noble-hashes/blob/663c2aeeffc308ac0cded59bd32f7c212adacfc2/LICENSE
[N-source]: https://github.com/paulmillr/noble-hashes/blob/663c2aeeffc308ac0cded59bd32f7c212adacfc2/src/argon2.ts
[N-vectors]: https://github.com/paulmillr/noble-hashes/blob/663c2aeeffc308ac0cded59bd32f7c212adacfc2/test/argon2.test.ts
[N-old]: https://registry.npmjs.org/@noble/hashes/2.0.1

[H-package]: https://registry.npmjs.org/hash-wasm/4.12.0
[H-release]: https://github.com/Daninet/hash-wasm/releases/tag/v4.12.0
[H-commit]: https://api.github.com/repos/Daninet/hash-wasm/commits?per_page=1
[H-readme]: https://github.com/Daninet/hash-wasm/blob/373b796205ab55fb4a657374dad6ea589bf75815/README.md
[H-license]: https://github.com/Daninet/hash-wasm/blob/373b796205ab55fb4a657374dad6ea589bf75815/LICENSE
[H-source]: https://github.com/Daninet/hash-wasm/blob/373b796205ab55fb4a657374dad6ea589bf75815/lib/argon2.ts
[H-C]: https://github.com/Daninet/hash-wasm/blob/373b796205ab55fb4a657374dad6ea589bf75815/src/argon2.c
[H-blake]: https://github.com/Daninet/hash-wasm/blob/373b796205ab55fb4a657374dad6ea589bf75815/src/blake2b.c
[H-build]: https://github.com/Daninet/hash-wasm/blob/373b796205ab55fb4a657374dad6ea589bf75815/scripts/build.sh
[H-vectors]: https://github.com/Daninet/hash-wasm/blob/373b796205ab55fb4a657374dad6ea589bf75815/test/argon2.test.ts

[S-package]: https://registry.npmjs.org/libsodium-wrappers-sumo/0.8.4
[S-raw-package]: https://registry.npmjs.org/libsodium-sumo/0.8.4
[S-release]: https://api.github.com/repos/jedisct1/libsodium.js/releases?per_page=3
[S-readme]: https://github.com/jedisct1/libsodium.js/blob/2830fcf2ce8cefd3fdc7e1efc9fc1cee1d2d95b7/README.md
[S-api]: https://github.com/jedisct1/libsodium.js/blob/2830fcf2ce8cefd3fdc7e1efc9fc1cee1d2d95b7/API_sumo.md
[S-build]: https://github.com/jedisct1/libsodium.js/blob/2830fcf2ce8cefd3fdc7e1efc9fc1cee1d2d95b7/Makefile
[S-submodule]: https://api.github.com/repos/jedisct1/libsodium.js/contents/libsodium?ref=2830fcf2ce8cefd3fdc7e1efc9fc1cee1d2d95b7
[S-license]: https://github.com/jedisct1/libsodium.js/blob/2830fcf2ce8cefd3fdc7e1efc9fc1cee1d2d95b7/LICENSE
[S-core-license]: https://github.com/jedisct1/libsodium/blob/33cc75ab1565d9dcbe808354191bd572ad6b64d0/LICENSE
[S-argon-license]: https://github.com/jedisct1/libsodium/blob/33cc75ab1565d9dcbe808354191bd572ad6b64d0/src/libsodium/crypto_pwhash/argon2/argon2-core.c
[S-pwhash]: https://doc.libsodium.org/password_hashing/default_phf
[S-pwhash-source]: https://github.com/jedisct1/libsodium/blob/33cc75ab1565d9dcbe808354191bd572ad6b64d0/src/libsodium/crypto_pwhash/argon2/pwhash_argon2id.c
[S-vectors]: https://github.com/jedisct1/libsodium/blob/33cc75ab1565d9dcbe808354191bd572ad6b64d0/test/default/pwhash_argon2id.c
[S-expected]: https://github.com/jedisct1/libsodium/blob/33cc75ab1565d9dcbe808354191bd572ad6b64d0/test/default/pwhash_argon2id.exp
[S-random]: https://doc.libsodium.org/generating_random_data
[S-random-source]: https://github.com/jedisct1/libsodium/blob/33cc75ab1565d9dcbe808354191bd572ad6b64d0/src/libsodium/randombytes/randombytes.c
[S-kdf]: https://doc.libsodium.org/key_derivation
[S-chacha]: https://doc.libsodium.org/advanced/stream_ciphers/chacha20
[S-old]: https://registry.npmjs.org/libsodium-wrappers-sumo/0.7.15

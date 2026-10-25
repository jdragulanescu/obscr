# Adaptive codec source, rights and raw ABI

This is a disposable implementation for [Prove adaptive message coding and salt discovery across browser and CLI](https://github.com/jdragulanescu/obscr/issues/35), not a production codec or a concealment claim. The native coding algorithm is real. This document records source inspection and the interface; execution results belong in the spike's findings.

## Pinned source and permitted adaptation

- Upstream: Stenoxide 3.24.3, commit `91a7322e83310a1a9577353f14cf7ad7f884e3c8`.
- [Original coding module](https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/src/stego/stc/native.rs): retained verbatim as `vendor/stenoxide/native.rs`, SHA-256 `f9435e7f274d1aaf1734e3c72ee2265769b556380169a65c7ab5d06ca1c0c352`.
- [Upstream license](https://github.com/stenoxide/stenoxide/blob/91a7322e83310a1a9577353f14cf7ad7f884e3c8/stenoxide-core/LICENSE): Apache-2.0, retained as `vendor/stenoxide/LICENSE`, including “Copyright 2025 stenoxide contributors.” The pinned repository tree contains no separate NOTICE file.
- `rust/src/native.rs` retains the original implementation through `Keystream::refill`, without algorithm, generator, tie-breaking, sign, rate, or segmentation changes. Its header marks the modification. Only the upstream test-only module is omitted, and two bounded ABI helper functions are appended. The verbatim source retains those original tests for inspection; this crate does not import their `rand` dependencies.
- `rust/src/lib.rs` supplies fixed buffers, argument bounds, errors and public matrix-column access. No DDE source, optional FFI build, upstream application protocol, image mapping, KDF, encryption or permutation is imported.
- Upstream comments about invisibility, detector behavior, secret seeds and eight-MiB segments are retained as source attribution, not adopted as Obscr claims. This spike uses a public seed and checks the actual segment width. Apache-2.0 is source-license evidence, not independent originality or universal patent clearance.

## Selected dependency notices

`rust/Cargo.toml` pins `chacha20 = 0.10.1` with `zeroize` and `zeroize = 1.9.0` with `derive`. `rust/Cargo.lock` preserves the matching upstream locked versions and checksums, with unrelated packages removed by Cargo during source download. Build with `--locked`; do not regenerate the lock or upgrade a dependency silently.

Published crate archives from crates.io are the primary sources for this audit. `vendor/dependency-notices.json` records each selected package's download URL, published archive SHA-256, repository, declared license and SHA-256 of retained files. `vendor/notices/<name>-<version>/` retains the normalized source manifest and all root license files, including copyright notices. No separate NOTICE or COPYRIGHT file was present in the downloaded selected sources.

| Selection | Exact packages | Terms retained |
| --- | --- | --- |
| WASM coding dependency graph | chacha20 0.10.1; zeroize 1.9.0; cfg-if 1.0.4; cipher 0.5.2; block-buffer 0.12.1; crypto-common 0.2.2; inout 0.2.2; hybrid-array 0.4.14; typenum 1.20.1 | MIT and Apache-2.0 alternatives, with original notices |
| Build-time derive graph | zeroize_derive 1.5.0; proc-macro2 1.0.107; quote 1.0.47; syn 2.0.119 | MIT and Apache-2.0 alternatives, with original notices |
| Build-time identifier tables | unicode-ident 1.0.24 | `(MIT OR Apache-2.0) AND Unicode-3.0`; all three texts retained |

For the dual-licensed dependencies, this distribution selects the MIT permission and preserves both supplied alternatives. Unicode-3.0 additionally requires its copyright and permission notice in copies or associated documentation; `LICENSE-UNICODE` is retained. The core remains Apache-2.0. These grants permit the copied source/notices and selected dependency use subject to their terms. This audit covers the selected crate graph, not every optional feature or unrelated upstream dependency. It is not a security certification.

`cpufeatures 0.3.0` and its conditional `libc 0.2.189` entry remain in Cargo's cross-target lock. They are not selected for this WASM graph: the pinned chacha20 manifest restricts cpufeatures to x86/x86_64. Native builds are outside this artifact's contract. The optional random-number, XChaCha and legacy features are not selected.

### Yanked chacha20 release

A fresh unlocked source fetch refused chacha20 0.10.1 because the release is yanked. Source download succeeded with the accepted upstream lock entry and its checksum; no dependency was upgraded.

[Upstream PR 583](https://github.com/RustCrypto/stream-ciphers/pull/583) states that versions 0.10.0 and 0.10.1 contain undefined behavior in the SSE2 backend. [Fix PR 580](https://github.com/RustCrypto/stream-ciphers/pull/580) removes an SSE4.1 intrinsic used there, following [issue 579](https://github.com/RustCrypto/stream-ciphers/issues/579). The published 0.10.1 `src/backends.rs` includes SSE2 only in the x86/x86_64 branch; wasm32 selects the `soft` module. **[INFERENCE]** The named yank defect is not compiled into this WASM-only artifact. This is not a claim that the release has no other defects, and the pin must not be used to justify a native release.

## Fixed codec profile

- One ordered scalar sample is one carrier byte. `n <= 262144`; no relabeling of grouped samples.
- Payload is at most 655 bytes, packed most-significant-bit first. Its entire byte count is charged to the upstream ceiling: `payloadBits <= floor(f32(n) * f32(0.02))`. At maximum `n`, capacity is 5242 bits, of which 5240 form 655 complete bytes.
- Trellis height is always 10. The seed is always 32 zero bytes and is public. It adds no secret, consumes no placement bytes and has no password dependence.
- Matrix nonce is twelve `0x01` bytes; sign nonce is twelve `0x02` bytes. Upstream ChaCha20 generation is unchanged. Columns use masked little-endian u32 draws, reject a zero masked draw, then force bits 0 and 9 on.
- The upstream sign stream advances only for changed nonsaturated samples. At 0 the result is 1; at 255 it is 254. Other selected samples move by one in the generated direction. Sign bits are consumed least-significant-bit first.
- Costs are one finite nonnegative f32 per sample. Infinity is rejected, not a hard-wet marker. Finite costs can still overflow a path sum; a solver failure is an error, not a fallback or partial encode.
- Extraction uses only the supplied carrier, fixed profile and message length. It neither reads costs nor receives a cover.

For `m > 0` message bits, the unchanged layout is:

```text
u = min(n, 64*m)
blockStart(b) = floor(b*u/m), for b in 0..m
averageWidth = floor(u/m)
blocksPerSegment = floor(65536/averageWidth)
segment [first,last) uses blockStart(last)-blockStart(first) columns
```

The last segment can be shorter. The ABI calculates every actual segment width before encode and rejects any width above 66816. It does not assume the upstream nominal 65536 is the actual maximum. At h10 this checked limit is `66816 * 1024 / 8 = 8552448` survivor bytes. `max_segment_columns` returns the exact largest width for that call, not a rounded estimate.

## Node and browser raw WASM interface

Instantiate the same `obscr_adaptive_codec.wasm` bytes in both runtimes. No wasm-bindgen, WASI or host imports are required by this interface. Use exported `memory`. Calls are synchronous, single-instance and serialized; a host must not access the regions concurrently or re-enter a call.

| Export | Contract |
| --- | --- |
| `init() -> i32` | Lazily allocate all four fixed regions once; return 0. The pointer getters also initialize them if needed. Allocation failure traps. |
| `carrier_ptr() -> pointer` | Stable region of 262144 bytes; encoder input/output and decoder input. |
| `costs_ptr() -> pointer` | Stable, f32-aligned region of 262144 little-endian f32 values; encoder input only. |
| `payload_ptr() -> pointer` | Stable region of 655 bytes; encoder input, decoder output. |
| `columns_ptr() -> pointer` | Stable, u32-aligned region of 262144 little-endian u32 values; inspect only the prefix returned by `matrix_prepare`. |
| `encode(n, byteLength) -> i32` | Validate bounds and actual segment width, then encode. Nonnegative return is the changed-sample count. On an ordinary negative return, carrier bytes have not been changed. |
| `decode(n, byteLength) -> i32` | Extract that many bytes into the payload prefix, returning 0 or a negative status. Ignore payload output after error and ignore its unused suffix. |
| `max_segment_columns(n, byteLength) -> i32` | Return the exact maximum actual segment width, 0 for an empty payload, or a negative status. No solver run. |
| `matrix_prepare(n, messageBits) -> i32` | Fill the public columns prefix and return `u`, or a negative status. Uses bit count, not byte count, bounded to 5240 bits and the same rate. No cover or costs are read. |

Statuses: `-1` sample/payload bounds; `-2` rate capacity; `-3` nonfinite/negative cost; `-4` invalid or oversized segment; `-5` upstream codec failure. Allocation failure or an internal panic traps instead of returning a status. Stop the operation on any error/trap; do not release stale output, choose another seed, shorten the payload or retry a weaker profile.

Before calling WASM, JavaScript must reject nonintegers, negative values and out-of-range numbers; WASM i32 parameter conversion alone is not host validation. Interpret pointers as unsigned (`pointer >>> 0`). After `init`, use `Uint8Array(memory.buffer, carrier_ptr(), n)`, `Float32Array(memory.buffer, costs_ptr(), n)` and `Uint8Array(memory.buffer, payload_ptr(), byteLength)`. Use `Uint32Array` for columns. On a non-little-endian host, use explicit little-endian `DataView` operations for f32/u32. Copy result bytes before the next operation overwrites the shared buffers.

### Independent matrix rank reconstruction

Call `matrix_prepare(n,m)`, read its `u` columns and calculate the layout above. Column index `j` belongs to the unique block `b` with `blockStart(b) <= j < blockStart(b+1)`. Its bit `t` contributes to matrix row `b+t` only if that row is less than both `m` and the end of `b`'s segment. Discard higher bits because the decoder resets its register at that segment boundary. Columns with `j >= u` are zero. A host can build GF(2) rows and perform its own elimination without a solver-derived rank assertion. For salt, require measured rank 128 for the chosen `n` and `m=128` before accepting the candidate.

## Memory, build and cancellation boundary

`rust/.cargo/config.toml` sets target `wasm32-unknown-unknown` and these linker arguments:

```text
-C link-arg=--initial-memory=67108864
-C link-arg=--max-memory=67108864
-C link-arg=-zstack-size=1048576
```

The initial and maximum memory are both 64 MiB. There is no permitted memory growth, so a successful allocation cannot detach host views through growth. The four stable regions contain 2359951 data bytes in total. The checked solver survivor bound is 8552448 bytes; columns, stego bits, unpacked payload and two 1024-element f32 state arrays are additional bounded allocations. These are source-derived allocation sizes, not observed peak memory. Allocator overhead and any trap remain part of the parent gate.

Run Cargo from `rust/`, since Cargo configuration lookup depends on the working directory. Set `CARGO_HOME` and `CARGO_TARGET_DIR` to absolute paths under this spike's `.scratch` directory. Build with `cargo build --release --locked`. The artifact path is `$CARGO_TARGET_DIR/wasm32-unknown-unknown/release/obscr_adaptive_codec.wasm`. The crate has an empty `[workspace]`; it does not join production Rust code or builds. No global cache or environment change is required by this crate.

The core does not add a cancellation callback inside upstream loops. The parent owns worker termination: cancel by terminating the worker/instance, then discard its incomplete result. A synchronous call must not run on the browser UI thread if cancellation and responsiveness are required. Destroy an instance when its buffer contents must be discarded; the host-owned fixed buffers are not automatically cleared between calls.

The source/notices task ran source downloads only. It did not run a build, test, linter or formatter. The parent must establish real Node/browser extraction, rank, malformed-input handling, memory bounds and artifact identity before any success claim. Temporary Cargo sources and caches remain under `.scratch/cargo` for the parent build and must be removed with the parent-owned scratch tree after evidence capture.

## JavaScript and retained-reference provenance

`reference/key-chain.mjs`, `reference/codec.mjs`, `reference/rs.mjs`, `reference/rs-vectors.mjs`, the complete `reference/vendor/` tree, and `controls.mjs` were copied from this repository's prior `spikes/rgb-message/` at commit `e0e7ed81c2790f608029cad76289f79935904f29`. That retained vendor tree includes its upstream, license and vector records. These are historical experiment controls, not newly selected production libraries.

The spike's private npm lock pins `libsodium-wrappers-sumo` and `libsodium-sumo` at 0.8.4, and browser bundler `esbuild` at 0.25.12. Their package-distributed notices are retained under `notices/`. The two sodium packages use ISC notices naming Ahmad BenMrad, Frank Denis and Ryan Lester; esbuild's MIT notice names Evan Wallace. npm tarball integrity is recorded in `package-lock.json`. Installed dependencies and generated browser bundles are not committed.

The final build and observed Node/Chromium results are in [FINDINGS.md](FINDINGS.md); the source-only task status above is not the completed pilot's status.

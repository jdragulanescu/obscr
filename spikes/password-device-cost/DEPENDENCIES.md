# Dependency evidence for the disposable password-cost experiment

Checked **2026-10-23** against exact npm version records, pinned upstream sources, release records and the [accepted research report](../../docs/research/obscr-password-and-placement.md). This note supports the experiment, not a production dependency approval. No builds, tests, benchmarks or security scans were run for this note.

## Packages and purpose

| Exact package | Experiment role | Verified package facts |
| --- | --- | --- |
| `libsodium-wrappers-sumo@0.8.4` | Argon2id wrapper | ISC; ESM and CommonJS exports. Declares `libsodium-sumo:^0.8.0`, so pinning the wrapper alone does not pin its raw implementation. npm `gitHead`: `2830fcf2ce8cefd3fdc7e1efc9fc1cee1d2d95b7`. [S-package] |
| `libsodium-sumo@0.8.4` | Raw Sodium implementation used by the wrapper | ISC; ESM and CommonJS exports; no runtime dependencies declared. Same npm `gitHead` as the wrapper. The source submodule is native Sodium `33cc75ab1565d9dcbe808354191bd572ad6b64d0`. This identifies the source tree, not proof that published binaries were built from it. [S-raw][S-submodule] |
| `@noble/hashes@2.4.0` | JavaScript scrypt; separate Argon2 implementation for vector comparison | MIT; no runtime dependencies; ESM `.js` subpath exports; Node `>=20.19.0`. npm `gitHead`: `663c2aeeffc308ac0cded59bd32f7c212adacfc2`. Its README documents `scryptAsync` and Argon2, but warns about JavaScript Argon2 speed. That warning is not a measured result for this experiment. [N-package][N-readme] |
| `esbuild@0.25.12` | **Build-only** browser bundler; not a password or placement primitive | MIT; Node `>=18`; `postinstall` runs `node install.js`. Platform-specific optional binary packages are pinned to `0.25.12`. npm `gitHead`: `208f539945b145e7c9d6d844290f81c3fe5af320`. [E-package][E-license] |

The experiment contract uses native Web Crypto for PBKDF2-SHA256, HKDF-SHA256 and AES-CTR, rather than adding npm implementations for those operations. Browser and Node support must be established by the integrated experiment; package metadata alone does not establish it. `hash-wasm` is not selected here; the accepted report records its separate maintenance and attribution questions.

The pinned Sodium Argon2id source calls `argon2id_hash_raw` with one lane and converts its memory argument from bytes to KiB. Thus these are one-lane profiles, not unchanged four-lane RFC 9106 recommended profiles. [S-pwhash]

## License and notice handling

- **Sodium wrappers/raw package:** preserve the ISC copyright and permission notice. The wrapper notice names Ahmad Ben Mrad, Frank Denis and Ryan Lester (2015–2026); the native root notice names Frank Denis (2013–2026). Retain both notices when distributing those components. [S-license][S-core-license]
- **Native Argon2:** the examined `argon2-core.c` header names Daniel Dinu and Dmitry Khovratovich (2015) and states CC0 1.0. Keep this component notice and the linked dedication with redistributed source/artifacts. The native root ISC label is not a complete inventory of every primitive bundled into sumo. This check is not a complete bundled-component license audit. [S-argon-license]
- **Noble:** its MIT license names Paul Miller (2022). Include the copyright and permission notice in copies or substantial portions. [N-license]
- **esbuild:** its MIT license names Evan Wallace (2020), with the same copyright/permission notice condition. Build-only use is distinct from redistribution: distributing the tool or its binaries must retain their applicable notices. Using esbuild does not remove the notice obligations of the libraries in its output. [E-license]

All cited root licenses include warranty disclaimers. The links identify the examined license texts; this note is not a substitute for including required notices with a distributed bundle, nor a patent clearance or legal opinion. Preservation of final bundle notices and complete bundled-component attribution remain checks for any future shipping decision.

## Maintenance and independent review evidence

- **Sodium 0.8.4:** the upstream release record gives **2026-04-19**. This is concrete release activity, not a support or response-time guarantee. The exact npm versions and native source pointer were checked again for this note. [S-release][S-package][S-raw][S-submodule]
- **Noble 2.4.0:** the upstream release record gives **2026-08-27**. Its notes describe security/correctness changes, improved zeroization and scheduler-yield changes. This is maintenance evidence, not proof that every security issue is absent. [N-release]
- **esbuild 0.25.12:** the release record gives **2025-11-01** and describes bug fixes and syntax support changes. This verifies the chosen build-tool release; it does not establish that it is the latest release or promise continuing support. [E-release]
- **Noble audit scope:** the pinned README identifies Cure53's independent review as version **1.0.0**, January 2022, and explicitly excludes Argon2, BLAKE3, SHA3 additions and SHA1. The original report says fieldwork occurred in December 2021; its summary records **zero vulnerabilities found in noble-hashes** within that assessment. Other libraries' findings in that report must not be relabeled as Noble findings. The README's historical audit claim does not establish independent coverage of the exact 2.4.0 scrypt code, its Argon2 implementation or this experiment's composition. [N-readme][N-audit]
- **Sodium and esbuild:** neither the accepted report nor the sources examined here establish an independent audit of these exact wrapper/binary/build-tool versions. This is an evidence gap, not a claim that no such audit exists.

No new package vulnerability is asserted by this evidence check.

## Artifact and verification boundaries

Exact versions plus the experiment's `package-lock.json` are the intended install inputs; the lock records resolved tarballs and integrity values. The npm records expose integrity values and registry signatures; Noble also exposes provenance metadata. **This note did not verify signatures, provenance attestations, installed-byte integrity or source-to-tarball correspondence.** Those checks must be reported separately if performed. [S-package][S-raw][N-package][E-package]

Version pins and integrity hashes do not establish a reproducible source build. No rebuild of Sodium's Emscripten output, Noble's published JavaScript or esbuild's native binary was performed here. No reproducible-build guarantee, exact-version audit guarantee, supported browser floor, device-memory limit or runtime performance result follows from this note. The parent experiment owns installed-artifact checks, vectors and measurements.

## Pinned sources

Versioned registry records identify package metadata. Commit links pin source content. Release records below identify the observed publication dates; release descriptions can be edited by upstream.

[S-package]: https://registry.npmjs.org/libsodium-wrappers-sumo/0.8.4
[S-raw]: https://registry.npmjs.org/libsodium-sumo/0.8.4
[S-submodule]: https://api.github.com/repos/jedisct1/libsodium.js/contents/libsodium?ref=2830fcf2ce8cefd3fdc7e1efc9fc1cee1d2d95b7
[S-license]: https://github.com/jedisct1/libsodium.js/blob/2830fcf2ce8cefd3fdc7e1efc9fc1cee1d2d95b7/LICENSE
[S-core-license]: https://github.com/jedisct1/libsodium/blob/33cc75ab1565d9dcbe808354191bd572ad6b64d0/LICENSE
[S-argon-license]: https://github.com/jedisct1/libsodium/blob/33cc75ab1565d9dcbe808354191bd572ad6b64d0/src/libsodium/crypto_pwhash/argon2/argon2-core.c
[S-pwhash]: https://github.com/jedisct1/libsodium/blob/33cc75ab1565d9dcbe808354191bd572ad6b64d0/src/libsodium/crypto_pwhash/argon2/pwhash_argon2id.c
[S-release]: https://api.github.com/repos/jedisct1/libsodium.js/releases/310855793
[N-package]: https://registry.npmjs.org/@noble/hashes/2.4.0
[N-readme]: https://github.com/paulmillr/noble-hashes/blob/663c2aeeffc308ac0cded59bd32f7c212adacfc2/README.md
[N-license]: https://github.com/paulmillr/noble-hashes/blob/663c2aeeffc308ac0cded59bd32f7c212adacfc2/LICENSE
[N-release]: https://api.github.com/repos/paulmillr/noble-hashes/releases/377825254
[N-audit]: https://github.com/paulmillr/noble-hashes/blob/663c2aeeffc308ac0cded59bd32f7c212adacfc2/audit/2022-01-05-cure53-audit-nbl2.pdf
[E-package]: https://registry.npmjs.org/esbuild/0.25.12
[E-license]: https://github.com/evanw/esbuild/blob/208f539945b145e7c9d6d844290f81c3fe5af320/LICENSE.md
[E-release]: https://api.github.com/repos/evanw/esbuild/releases/259033064

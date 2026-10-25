# Adaptive message codec pilot

Disposable evidence for [Prove adaptive message coding and salt discovery across browser and CLI](https://github.com/jdragulanescu/obscr/issues/35). Start with [FINDINGS.md](FINDINGS.md). This is not production software, a supported format, a secrecy tool, or a confirmation study. Use only synthetic messages and the supplied development photographs.

## Quick run

From the repository root, with Node 24:

```sh
npm run spike-adaptive-codec
```

This runs the real WASM codec prerequisite gate with the checked-in `codec.wasm`. No Rust installation or npm dependency download is needed for that gate. It checks exact extraction without the cover/cost map, salt-matrix rank, sample changes and bounded rejection. It writes `evidence/node-gate.json`, so copy recorded evidence elsewhere before repeating a measurement you want to preserve.

## Complete message measurements

Install the repository and isolated spike dependencies first:

```sh
npm ci
npm ci --prefix spikes/adaptive-codec --ignore-scripts --cache spikes/adaptive-codec/.scratch/npm
npm run spike-adaptive-codec -- initial
npm run spike-adaptive-codec -- repair
npm run spike-adaptive-codec -- controls
npm run spike-adaptive-codec -- boundaries
npm run spike-adaptive-codec -- frame-bounds
```

`initial`, `repair` and `controls` write separate evidence ledgers. Fresh salts and nonces mean repeated runs are new development observations, not byte-identical reproduction of the recorded scores. Do not tune settings against a confirmation set. [CONTRACT.md](CONTRACT.md), [EXPERIMENT.md](EXPERIMENT.md) and [repair-selection.json](repair-selection.json) record the profile, bounds, damage operations and the selection made before repair scoring.

The two large recorded error-index ledgers are losslessly compressed as `evidence/initial.json.gz` and `evidence/repair.json.gz`; `evidence/archive.json` records byte counts, SHA-256 and successful decompression equality. Read them with `gzip -dc <path>`. Measurement commands regenerate the ignored uncompressed `.json` files. Archiving removed no rows or fields and did not change the frozen comparison parameters.

## Actual CLI

Paths after `cli` are relative to this spike directory:

```sh
npm run spike-adaptive-codec -- cli encode photos/vandusen-2015.png .scratch/example.png 'Synthetic message' raw
npm run spike-adaptive-codec -- cli decode .scratch/example.png raw
npm run spike-adaptive-codec -- cli decode evidence/browser-512-adaptive.png adaptive 16 byte-round-robin
```

Create `.scratch` first if it is absent. Default password: `synthetic-adaptive-codec-password`. The decode command accepts an optional password after salt route, parity and byte order. The encode command deliberately exposes only this synthetic default; it is not a private-message CLI. Salt route is `raw` or `adaptive`; parity is `0`, `16` or `32` in the measured menu; byte order is `none` or `byte-round-robin`. The profile is agreed out-of-band in this experiment; the decoder never guesses another profile. Ctrl-C terminates the worker without releasing output. Wrong-password failure exits 2; cancellation exits 130.

## Browser

```sh
npm run spike-adaptive-codec -- build-browser
npm run dev -- --host 127.0.0.1 --port 5197 --strictPort
```

Open `http://127.0.0.1:5197/@fs/<absolute-repository-path>/spikes/adaptive-codec/browser.html`, replacing `<absolute-repository-path>` with this checkout path. The measured path was `/Users/skylight/workspaces/worktrees/obscr/adaptive-codec`.

Choose a supplied PNG, select the exact salt/repair/byte-order profile, and use **Encode PNG**, **Download encoded PNG**, or **Decode PNG**. Encode/download in one runtime and decode in the other. The recorded 512-byte exchange uses parity16 and round-robin bytes. Use **Cancel message operation** while work is running. Each operation owns one worker and has a 30-second deadline. Stop the Vite process after the walkthrough.

The browser evidence includes both exact Blob captures and a completed download into a dedicated temporary directory. The actual CLI recovered the downloaded PNG, and its bytes matched the exported Blob. See [BROWSER.md](BROWSER.md) for the steps and observation limits.

## Rebuild the WASM source

The committed binary is identified in `evidence/build.json`. Rebuild only when source/build verification is wanted:

```sh
rustup target add wasm32-unknown-unknown
cd spikes/adaptive-codec/rust
CARGO_HOME="$PWD/../.scratch/cargo" cargo fetch --locked --target wasm32-unknown-unknown
cd ../../..
npm run spike-adaptive-codec -- build
```

`build.mjs` uses an offline, locked build and isolated Cargo source/target directories. The pinned chacha20 release is yanked for a native SSE2 defect; retain the lock and read [PROVENANCE.md](PROVENANCE.md). This artifact is WASM-only. Do not silently upgrade the pin or build a native codec as a substitute.

## Files and evidence

- `rust/`, `codec.wasm`, `vendor/`: real pinned codec, bounded ABI, source and notices.
- `codec.mjs`, `placement.mjs`, `costs.mjs`, `png.mjs`: experimental complete envelope, scalar sampler, named HILL-like RGB costs and bounded PNG path.
- `reference/`, `controls.mjs`: retained historical RGB and legacy controls; not production candidates adopted by this pilot.
- `photos/`: four CC0 development crops, source/license/crop manifest. Not a representative or independent confirmation corpus.
- `evidence/`: codec gates, complete-file attempt/error ledgers, CLI/browser exchange PNGs, boundaries and runtime measurements.
- `STUDY-PLAN.md`: proposed acquisition, detector, split, uncertainty and scoring plan. No confirmation study ran.

Production code never imports this spike. The root package's `files` list includes only `bin/` and `lib/`; Jest matches `test/**/*.test.js`; Vite starts from `app/`. The spike has its own private npm package and empty Rust workspace. No permanent tests, glossary terms, ADRs or product settings are introduced.

## Cleanup

Temporary Cargo/npm caches, build products and malformed fixtures stay under `.scratch`; isolated npm installs stay in this spike's `node_modules` and the dedicated worktree's root `node_modules`. Remove only those exact directories created for the run, plus its generated `codec.bundle.js`. Remove `wasm32-unknown-unknown` with `rustup target remove` only if that run installed it. Keep the committed source, licenses, WASM, photographs and evidence as the review artifact. The authoring run also removes its temporary worktree after publishing; the branch and pull request retain the artifact.

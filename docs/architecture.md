# Architecture

> One line per file or folder directly under each source root:
> `lib/`, `bin/`, and `app/src/`. List other top-level folders too.
> Keep entries under 200 characters. Flows live in code and tests.

## Shared engine

- `lib/crypto.js`: Node encryption: AES-256-GCM, PBKDF2-SHA512 keys, and optional gzip compression.
- `lib/steg-core.js`: platform-free steganography shared by CLI and PWA: LSB bits, password-scrambled order, and capacity.
- `lib/png.js`: shared bounded PNG validation, raw-sample admission and serialization.
- `lib/png-diff.js`: shared native-sample comparison; bounded admission, in-place overlay and visual-only statistics.
- `lib/steg.js`: Node operation owner: bounded file reads, cancellable workers and atomic output publication.
- `lib/steg-worker.js`: Node worker boundary for PNG admission, the existing carrier and encryption.
- `lib/protected-image.js`: shared next-format preparation, recovery dispatch, detail ranking, exact capacity and worker-owned state.
- `lib/protected-transport.js`: retained worker transport, opaque preparations, cancellation and stale-response suppression.
- `lib/protected-node.js`: Node preparation/recovery/discard adapter; owns the worker thread.
- `lib/protected-worker.js`: Node request gate for the shared protected-image operation.
- `lib/protected-recovery.js`: bounded matrix/frame extraction, repair, authentication and exact raw/gzip text recovery.
- `lib/protected-keys.js`: private fixed Argon2id/HKDF schedule and continuous bounded sparse position source.
- `lib/protected-native-node.js`, `lib/protected-native-browser.js`: native HKDF, full-counter AES-CTR and authenticated AES-GCM adapters.
- `lib/protected-repair.js`: pinned ZXing-derived shortened Reed–Solomon decoder; adjacent LICENSE and NOTICE preserve provenance.
- `lib/image-operation.js`: per-tab/process heavyweight-operation lease shared by image worker adapters.
- `lib/utils.js`: password-seeded pixel order and string/bit conversion.
- `lib/mersenne-twister.js`: vendored seeded PRNG used by pixel ordering.

## CLI

- `bin/index.js`: the obscr command: encrypt, decrypt, examples, and the inquirer interactive mode.

## PWA

- `app/`: web entry in `index.html`, static assets and offline service worker in `public/`, React source in `src/`.
- `app/src/main.jsx`: React mount.
- `app/src/App.jsx`: task navigation, active-operation locks and confirmed discard of entered data.
- `app/src/components/`: admission forms, cancellable status, accessible controls and result previews.
- `app/src/lib/`: browser worker adapter, operation revisions, Web Crypto and UI helpers; workers use the shared PNG policy.
- `app/src/styles.css`: Tailwind styles and the app theme.

## Other folders and configuration

- `test/`: Jest unit and integration tests, PNG fixtures, and checkout-local scratch output.
- `docs/`: agent instructions, architecture, research, security guide, and ADRs when written.
- `.github/`: release-triggered npm publishing in `workflows/publish.yml`.
- `.claude/`: local Claude configuration.
- `.vercel/`: local Vercel project metadata.
- `package.json`, `package-lock.json`: npm commands, dependencies, and locked versions.
- `vite.config.mts`, `postcss.config.js`, `tailwind.config.js`, `vercel.json`: PWA build and deployment configuration.

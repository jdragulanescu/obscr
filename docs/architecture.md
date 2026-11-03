# Architecture

> One line per file or folder directly under each source root:
> `lib/`, `bin/`, and `app/src/`. List other top-level folders too.
> Keep entries under 200 characters. Flows live in code and tests.

## Shared engine

- `lib/png.js`: shared bounded PNG validation, raw-sample admission and serialization.
- `lib/png-diff.js`: shared native-sample comparison; bounded admission, in-place overlay and visual-only statistics.
- `lib/steg.js`: Node file adapter: bounded reads, retained preparation and atomic complete-output publication.
- `lib/protected-image.js`: shared preparation, encode/recovery dispatch, detail ranking, exact capacity and worker-owned state.
- `lib/protected-transport.js`: retained worker transport, opaque preparations, cancellation and stale-response suppression.
- `lib/protected-node.js`: Node preparation/encode/recovery/discard adapter; owns the worker thread.
- `lib/protected-worker.js`: Node request gate for the shared protected-image operation.
- `lib/protected-encoding.js`: fixed authenticated framing, repair/interleave, in-place matrix writes and complete PNG serialization.
- `lib/protected-recovery.js`: bounded matrix/frame extraction, repair, authentication and exact raw/gzip text recovery.
- `lib/protected-keys.js`: private fixed Argon2id/HKDF schedule and continuous bounded sparse position source.
- `lib/protected-native-node.js`, `lib/protected-native-browser.js`: native CSPRNG, HKDF, full-counter AES-CTR and authenticated AES-GCM adapters.
- `lib/protected-repair.js`: pinned ZXing-derived shortened Reed–Solomon encoder/decoder; adjacent LICENSE and NOTICE preserve provenance.
- `lib/image-operation.js`: per-tab/process heavyweight-operation lease shared by image worker adapters.

## CLI

- `bin/index.js`: the obscr command: encrypt, decrypt, examples, and the inquirer interactive mode.

## PWA

- `app/`: web entry in `index.html`, static assets and offline service worker in `public/`, React source in `src/`.
- `app/src/main.jsx`: React mount.
- `app/src/App.jsx`: task navigation, active-operation locks and confirmed discard of entered data.
- `app/src/components/`: admission forms, cancellable status, accessible controls and result previews.
- `app/src/lib/`: browser protected-operation, PNG/Diff and bounded-file adapters, operation revisions and UI helpers.
- `app/src/styles.css`: Tailwind styles and the app theme.

## Other folders and configuration

- `test/`: Jest unit and integration tests, PNG fixtures, and checkout-local scratch output.
- `docs/`: agent instructions, architecture, research, security guide, and ADRs when written.
- `.github/`: release-triggered npm publishing in `workflows/publish.yml`.
- `.claude/`: local Claude configuration.
- `.vercel/`: local Vercel project metadata.
- `package.json`, `package-lock.json`: npm commands, dependencies, and locked versions.
- `vite.config.mts`, `postcss.config.js`, `tailwind.config.js`, `vercel.json`: PWA build and deployment configuration.

# Architecture

> One line per top-level folder and file under `bin/`, `lib/` and `app/`, and per other top-level folder, saying what it is for in under 200 characters. How a flow works lives in the code and its tests.

## Shared engine

- `lib/crypto.js`: Node encryption: AES-256-GCM with PBKDF2-SHA512 keys and optional gzip compression.
- `lib/steg-core.js`: platform-free steganography shared by CLI and PWA: LSB bit read/write, password-scrambled bit order, image capacity.
- `lib/steg.js`: Node adapter over `steg-core.js`: reads and writes PNG files with pngjs, validates image paths.
- `lib/utils.js`: password-seeded pixel order (hashed order) and string/bit conversion.
- `lib/mersenne-twister.js`: vendored seeded PRNG behind the hashed order.

## CLI

- `bin/index.js`: the `obscr` command: `encrypt`, `decrypt`, `examples` and the inquirer `interactive` mode.

## PWA

- `app/index.html`: the web app's HTML entry, registers the manifest and service worker.
- `app/public/`: PWA static assets: icons, `manifest.json`, and `sw.js`, the offline cache.
- `app/src/main.jsx`, `app/src/App.jsx`: React mount and the Encrypt / Decrypt / Image diff tabs.
- `app/src/components/`: the forms and widgets of each tab: image upload, password strength, results, image comparison.
- `app/src/components/ui/`: shared styled primitives: button, card, input, label, tabs, textarea.
- `app/src/lib/`: browser adapters: `steg.js` over `steg-core.js`, `webCrypto.js` mirroring `lib/crypto.js` with Web Crypto, `cn` class helper.
- `app/src/styles.css`: the app's Tailwind styles and theme.

## Other top-level folders

- `test/unit/`: Jest unit tests for `lib/`; `test/integration/`: the CLI run as a child process; `test/fixtures/`: PNG fixtures; `test/output/`: test scratch output.
- `docs/`: agent docs (`docs/agents/`), this map, and ADRs when written.
- `.github/workflows/`: `publish.yml`, npm publish on a GitHub release.
- `vite.config.mts`, `postcss.config.js`, `tailwind.config.js`, `vercel.json`: PWA build and Vercel deploy config.

# Architecture

> One line per file or folder directly under each source root:
> `lib/`, `bin/`, and `app/src/`. List other top-level folders too.
> Keep entries under 200 characters. Flows live in code and tests.

## Shared engine

- `lib/crypto.js`: Node encryption: AES-256-GCM, PBKDF2-SHA512 keys, and optional gzip compression.
- `lib/steg-core.js`: platform-free steganography shared by CLI and PWA: LSB bits, password-scrambled order, and capacity.
- `lib/steg.js`: Node PNG adapter: image paths, reading, and writing through pngjs.
- `lib/utils.js`: password-seeded pixel order and string/bit conversion.
- `lib/mersenne-twister.js`: vendored seeded PRNG used by pixel ordering.
- `lib/candidate-validation.js`: read-only candidate bundle, source and artifact identity checks, bounded reads and cancellation.
- `lib/evidence-record.js`: clause/category coverage, retained evidence, review dispositions and reviewed carry-forward.
- `lib/release-checklist.json`: versioned accepted-clause catalogue, source links and explicit scope precedence for release validation.

## CLI

- `bin/index.js`: the obscr command: encrypt, decrypt, examples, and the inquirer interactive mode.
- `bin/release-check.js`: manifest selection, safe terminal output and exit codes for read-only release validation.

## PWA

- `app/`: web entry in `index.html`, static assets and offline service worker in `public/`, React source in `src/`.
- `app/src/main.jsx`: React mount.
- `app/src/App.jsx`: Encrypt & Hide, Decrypt & Reveal, and Image Diff tabs.
- `app/src/components/`: forms, upload, password strength, results, image comparison, and shared UI primitives.
- `app/src/lib/`: browser steganography and Web Crypto adapters, plus styling helpers.
- `app/src/styles.css`: Tailwind styles and the app theme.

## Other folders and configuration

- `test/`: Jest unit and integration tests, PNG fixtures, and checkout-local scratch output.
- `docs/`: agent instructions, architecture, research, security guide, and ADRs when written.
- `.github/`: release-triggered npm publishing in `workflows/publish.yml`.
- `.claude/`: local Claude configuration.
- `.vercel/`: local Vercel project metadata.
- `package.json`, `package-lock.json`: npm commands, dependencies, and locked versions.
- `vite.config.mts`, `postcss.config.js`, `tailwind.config.js`, `vercel.json`: PWA build and deployment configuration.

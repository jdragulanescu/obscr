# Testing

- [Commands](#commands): before running checks or starting the app.
- [Isolation](#isolation): before starting a server or the TUI.
- [Browser tool](#browser-tool): before a browser check.
- [E2E shape](#e2e-shape): before choosing or adding e2e checks.
- [CI](#ci): when changing CI or checking its result.

This file records how to run checks here.
Check selection follows the global `~/.agents/docs/testing.md`,
`~/.agents/docs/definition-of-done.md`, and `/to-spec` for acceptance.

A missing command reads `none`; skip that check and report it.
A field waiting on an issue reads `pending #<n>`.
Keep command lines short; put details beside the tool or in
`docs/agents/testing/`, following
`~/.agents/skills/setup-repo/TESTING-DOC.md`.

## Commands

- **Typecheck**: none
- **Lint**: none
- **Format**: none
- **Fast suite**: `npm test`: Jest over `test/unit/` and `test/integration/`, with coverage. Always run it whole. Never includes e2e.
- **One test file**: `npm test -- <path>`: while iterating on one module.
- **One e2e file**: none
- **Mutation testing**: none
- **Unit only**: `npm run test:unit`: while iterating on `lib/`.
- **Integration only**: `npm run test:integration`: real CLI/worker checks and engine workflows. Terminal tests need Python 3's standard `pty` module on macOS/Linux; fixtures are in `test/fixtures/`.
- **Watch tests**: `npm run test:watch`: interactive Jest watch mode.
- **PWA build**: `npm run build`: Vite builds `app/` into `dist/`, as Vercel does. Run when changing `app/` or `lib/`.
- **Install dependencies**: `npm ci`: prepare a fresh checkout.
- **Dev server**: `npm run dev`: read its printed `Local:` URL; the port may not be 5173.
- **PWA preview**: `npm run preview`: serve the built PWA after `npm run build`.

Component tests run in the same Jest suite with real React DOM and jsdom.
`test/jsx-transform.cjs` compiles JSX for Jest. Worker-adapter fakes control
cancellation and late replies; separate tests exercise the real workers.

## Isolation

File-writing tests use unique system temporary directories and remove only their own files.
Vite takes the next free port when 5173 is busy.
Stop only the `npm run dev` process this run started.

- **Shared**: none
- **Approach**: checkout-local files; Vite selects a free port. Use the printed URL.
- **Setup**: `npm ci`
- **Start**: `npm run dev`: keep its process handle and use the printed `Local:` URL.
- **Stop**: send Ctrl-C to the Start process for this checkout; leave other servers running.
- **TUI**: `node bin/index.js interactive`, 80x24, keyboard only; inquirer does not use mouse input.

## Browser tool

- **Tool**: `agent-browser`: installed; use it for browser checks.

Use a fresh browser session after source changes, or clear that session's service
worker caches before checking changed code. The offline cache can otherwise serve
an older worker module during development.

## E2E shape

Follow the E2E shape rules in the global `~/.agents/docs/testing.md`.
There is no e2e harness. A spec that adds one must fill these fields.

- **E2E layout**: none
- **E2E budget**: none
- **Shared UI code**: none
- **Core journey**: none

## CI

- **On pull requests**: none
- **Drafts**: skipped: no workflow runs on pull requests.
- **By hand**: none: `publish.yml` has no `workflow_dispatch` trigger.

`.github/workflows/publish.yml` runs `npm ci` and `npm publish`
when a GitHub release is created. It runs no tests or e2e suite.
Do not run the full e2e suite locally if one is added.

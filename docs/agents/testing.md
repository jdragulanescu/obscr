# Testing

- [Commands](#commands): every run; the everyday commands come first.
- [Isolation](#isolation): before starting a server or the TUI.
- [Browser tool](#browser-tool): before a browser check.
- [E2E shape](#e2e-shape): before writing or running an e2e file, or choosing which ones a change runs.
- [CI](#ci): when a change touches CI, or a criterion needs CI's result.

The commands and facts every skill reads before running a check. The rules for choosing a check live in the global `~/.agents/docs/testing.md` and `~/.agents/docs/definition-of-done.md` and, for a spec's acceptance check, in `/to-spec`; this file only says how to run them here. A command this project does not have reads `none`; skip that check and say so in the closeout. A field waiting on an issue reads `pending #<n>`. Each check is one line here, and how a tool works lives beside it or in `docs/agents/testing/`, as `~/.agents/skills/setup-repo/TESTING-DOC.md` describes.

## Commands

- **Typecheck**: none
- **Lint**: none
- **Format**: none
- **Fast suite**: `npm test`: Jest over `test/unit/` and `test/integration/`, with coverage. Always run it whole. Never includes e2e.
- **One test file**: `npm test -- <path>`: while iterating on one module.
- **One e2e file**: none
- **Unit only**: `npm run test:unit`: while iterating on `lib/`.
- **Integration only**: `npm run test:integration`: runs the CLI in `bin/index.js` as a child process against `test/fixtures/`.
- **PWA build**: `npm run build`: Vite builds `app/` into `dist/`, as Vercel does. Run it when a change touches `app/` or `lib/`.

## Isolation

What two worktrees of this repo would collide on, and how each gets its own copy.

- **Shared**: none: tests write only to `test/output/` in the checkout, and Vite takes the next free port when 5173 is busy.
- **Approach**: none
- **Setup**: `npm ci`
- **Start**: `npm run dev`: prints its `Local:` URL; read the port from it, since it may not be 5173.
- **Stop**: none: stop the `npm run dev` process this run started.
- **TUI**: `node bin/index.js interactive`, 80x24, no mouse (inquirer reads only keys): what `tui-check` launches.

## Browser tool

- **Tool**: `agent-browser`: what `browser-check` drives the dev server with; `none` when the project has no UI.

## E2E shape

The rules for these are under "E2E shape" in the global `~/.agents/docs/testing.md`.

- **E2E layout**: none
- **E2E budget**: none
- **Shared UI code**: none
- **Core journey**: none

## CI

- **On pull requests**: none; `.github/workflows/publish.yml` runs `npm publish` only when a GitHub release is created. Whatever CI runs, agents still never run the full e2e suite locally.
- **Drafts**: skipped: no workflow runs on pull requests.
- **By hand**: none: `publish.yml` has no `workflow_dispatch` trigger.

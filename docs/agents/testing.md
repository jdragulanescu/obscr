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
- **Fast suite**: `npm test`: Jest over `test/unit/` and `test/integration/`, with coverage and at most two workers. Always run it whole. Never includes e2e.
- **One test file**: `npm test -- <path>`: while iterating on one module.
- **One e2e file**: none
- **Mutation testing**: none
- **Unit only**: `npm run test:unit`: while iterating on `lib/`.
- **Integration only**: `npm run test:integration`: child-process checks of `bin/index.js` and full engine workflows using `test/fixtures/`.
- **Watch tests**: `npm run test:watch`: interactive Jest watch mode.
- **PWA build**: `npm run build`: Vite builds `app/` into `dist/`, as Vercel does. Run when changing `app/` or `lib/`.
- **Install dependencies**: `npm ci`: prepare a fresh checkout.
- **Dev server**: `npm run dev`: read its printed `Local:` URL; the port may not be 5173.
- **PWA preview**: `npm run preview`: serve the built PWA after `npm run build`.
- **Candidate check**: `npm run release:candidate -- --request check --output <new-directory> --run <id>`: builds committed HEAD with Node 24.x and retains baseline evidence; does not publish.

## Isolation

Tests write to `test/output/` inside each checkout.
Vite takes the next free port when 5173 is busy.
Stop only the `npm run dev` process this run started.

- **Shared**: none
- **Approach**: none
- **Setup**: none
- **Start**: none
- **Stop**: none
- **TUI**: `node bin/index.js interactive`, 80x24, keyboard only; inquirer does not use mouse input.

## Browser tool

- **Tool**: `agent-browser`: installed; use it for browser checks.

## E2E shape

Follow the E2E shape rules in the global `~/.agents/docs/testing.md`.
There is no e2e harness. A spec that adds one must fill these fields.

- **E2E layout**: none
- **E2E budget**: none
- **Shared UI code**: none
- **Core journey**: none

## CI

- **On pull requests**: `.github/workflows/publish.yml` runs Node 24.x clean install, the full Jest suite, PWA build and package checks for non-draft PRs; retains candidate files and raw evidence.
- **Drafts**: GitHub Actions skips the whole candidate job; conversion to draft requests cancellation of an earlier PR run. Vercel Git deployments are disabled in `vercel.json`, and the real `obscr` project's Git connection was disconnected on 2026-10-25 to cover older branches too. The PR #61 walkthrough compared actual provider records across draft creation, updates and ready/draft transitions: no new deployment or active build appeared. Automatic ready-PR previews and Git-driven production updates also stop; existing deployments stay. See the release guide for the retained evidence and account control.
- **By hand**: `gh workflow run publish.yml --ref <branch-or-tag> -f request=check`: safe candidate checks on a ref with the new workflow. GitHub must know `publish.yml` on the default branch. `-f request=release` intentionally requests full release validation; missing evidence refuses it. Neither mode publishes.

Release creation enters the same checks and full evidence validation. The direct
`npm publish` step is removed. No publication credentials enter these jobs.
See [release checks](../release-check.md#workflow-entries-and-external-draft-controls)
for retained artifacts, manual-entry prerequisites and the recorded real
GitHub/Vercel walkthrough. Do not run the full e2e suite locally if one is added.

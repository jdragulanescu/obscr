# obscr

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `jdragulanescu/obscr`, used through `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

The default five triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Testing

Jest, with unit tests in `test/unit/` and integration tests in `test/integration/`; no e2e suite yet. See `docs/agents/testing.md`.

### Codebase map

A shared engine in `lib/`, used by the CLI in `bin/` and the React PWA in `app/`. Read `docs/architecture.md` first to find which folder owns a behaviour.

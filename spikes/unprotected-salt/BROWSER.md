# Browser and CLI exchange observations

Run on the same Mac15,8 / Apple M3 Max / 64 GiB host as the Node matrix, macOS 26.6.2 (25G83). Node 24.13.0; desktop Chromium **150.0.7871.24**, read from the managed browser's version API. Its reduced user-agent reports Chrome/150.0.0.0, MacIntel and 16 logical processors; that user-agent does not identify the host CPU architecture. This is not an iPhone, Android, Safari or production-app check.

The worktree Vite server used port 5199 and served `browser.html` plus its locally built shared codec. No product module imports the spike. The server and managed browser tab were stopped after this run.

Browser check — http://127.0.0.1:5199/@fs/Users/skylight/workspaces/worktrees/obscr/unprotected-salt/spikes/unprotected-salt/browser.html — managed Chromium via browser tool, session unprotected-salt
1. Select **Profile** `no-repair`, click **Load CLI example**, then **Decode message** → seen: `exact-ready`, `CLI to browser: café 日本語 🔒` → pass
2. Click **Encode message** with `Browser to CLI: café 日本語 🔒`; save the PNG bytes from **Save browser PNG** and run the spike CLI decoder with `no-repair` → seen: the exact browser text, matching SHA-256 `4fc67f62c74aca02baffa8b08ab5d6207161593f5ad6b564029abdd3003d6ae4` → pass
3. Click **Try wrong password** → seen: `safe-failure`, common failure reason, `message: null` → pass
4. Click **Change one salt bit**, then **Decode message** → seen: `safe-failure`, common failure reason, `message: null` → pass
5. Select **Profile** `grouped-p32`, click **Load CLI example**, then **Decode message** → seen: `exact-ready`, `CLI to browser: café 日本語 🔒` → pass
6. Click **Encode message**; save the PNG bytes from **Save browser PNG** and run the spike CLI decoder with `grouped-p32` → seen: the exact browser text and the same message SHA-256 → pass
7. Click **Try wrong password** → seen: `safe-failure`, common failure reason, `message: null` → pass
8. Click **Change one salt bit**, then **Decode message** → seen: `safe-failure`, common failure reason, `message: null` → pass
Console: none
Errors: none
Failed requests: none; all four observed document/script/PNG requests returned HTTP 200
Screenshots: `/var/folders/y8/gg0_s4gd53v5msnxvcp240cm0000gn/T/omp-sshots-15b1ee45983981b6.webp` (final repair-profile salt-failure screen; local visual evidence, not committed)
Videos: none
Verdict: pass — both PNG exchange directions and both failure paths passed for both explicit profiles

## Artifact and instrumentation limits

`evidence/browser.json` contains DOM state, measured elapsed times, user-agent and request diagnostics. `evidence/cli-exchange.json` contains the actual CLI results. The four `cli-*.png` and `browser-*.png` assets retain the exchanged files. Browser PNGs came from the actual canvas-generated download-link data URL and were saved by the harness, not reconstructed by Node. The operating-system Save dialog was not exercised.

The first attempt to read `window.currentState` through the automation evaluation context failed because that context did not expose the page function. The page had already shown the correct decoded text. Observation collection then used the visible `#state` DOM text. No codec change or page-error suppression was made; application console/error lists were empty.

Browser JavaScript heap values exclude WASM, canvas, image-decoder, GPU and other process memory. They are not whole-browser memory evidence. The first no-repair decode includes first key processing; the later repair decode is warm in the same page. Do not compare those two timings as a repair-cost benchmark. The independent Node cost command uses fresh processes per profile.

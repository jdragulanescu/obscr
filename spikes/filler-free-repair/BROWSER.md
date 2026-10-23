# Browser walkthrough

Browser check — http://127.0.0.1:5198/@fs/Users/skylight/workspaces/worktrees/obscr/filler-free-repair/spikes/filler-free-repair/browser.html — managed Chromium via browser helpers, session filler-repair
1. Open the URL; click **Load CLI example**, then **Decode message** → seen: `exact-ready`, `CLI to browser: café 日本語 🔒` → pass
2. Click **Encode message** → seen: `encoded`, storedBytes 36, payload codedBytes 116 (296 bytes including initial data) → pass
3. Read the **Save browser PNG** link's actual PNG bytes and run the spike CLI on that file → seen: `exact-ready`, `Browser to CLI: café 日本語 🔒` → pass
4. Click **Change RGB at 1% of pixels**, then **Decode message** → seen: 655 selected pixels, seed 2801, then `exact-ready` with the exact browser text → pass
5. Click **Try wrong password** → seen: `safe-failure`, `message: null` → pass
Console: none
Errors: none
Failed requests: GET http://127.0.0.1:5198/favicon.ico 404; favicon-only exception, no failed application request
Screenshots: /var/folders/y8/gg0_s4gd53v5msnxvcp240cm0000gn/T/ (omp-sshots-15b1e30c04d7e970.webp, omp-sshots-15b1e313b357e971.webp, omp-sshots-15b1e3223a97e972.webp, omp-sshots-15b1e3227bd7e973.webp)
Videos: none
Verdict: pass — every interaction passed; only the favicon request failed

The actual browser was Chrome 150 on the M3 Max host. `evidence/browser.json` records the exact user agent, observations and diagnostics. The UI ran the candidate modules, not the unchanged production PWA. The browser-generated canvas PNG was decoded by the actual `cli.mjs` command; the CLI-generated PNG was decoded through the page's controls.

The browser also ran all 18 independent RS encoder vectors and 216 boundary observations. Every encoder/shortening comparison matched, and every within-radius observation recovered exactly. Eighteen deliberately ambiguous beyond-radius inputs demonstrated RS miscorrection, which is why the envelope must still authenticate.

The initial automation attempt to call a page-global PNG helper from an isolated evaluation context failed. It did not change the image or fail a UI step. Reading the PNG download link supplied the actual browser bytes without rerunning encoding. HTTP 304 cache responses are not counted as failed requests.

Timing samples here were collected while the matrix was running. They are interaction observations, not isolated cold/warm benchmarks. Browser JavaScript heap samples are not whole-browser peak memory. Phone, Safari and Firefox results are absent. Local screenshot files are not portable publication assets; the original, encoded and transformed PNG files are preserved under `evidence/`.

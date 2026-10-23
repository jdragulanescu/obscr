# Password device-cost spike

Disposable evidence for [Measure password-processing cost on supported devices](https://github.com/jdragulanescu/obscr/issues/27). No production dependency, algorithm, profile, support floor or memory limit is selected. Read [PLAN.md](PLAN.md), recorded before measurement, and [FINDINGS.md](FINDINGS.md).

This question needs a real bundled worker, Web Crypto, WASM and offline assets. A single file opened with `file://` cannot check those constraints. The spike therefore uses its own package and local server instead of the prototype skill's ordinary single-file logic demo.

## Run locally

From the repository root, with Node 24 LTS and npm installed:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm --prefix spikes/password-device-cost ci --ignore-scripts --no-audit --no-fund
npm run spike-password-device-cost
```

Open `http://127.0.0.1:5187`. This command builds only the spike and starts its loopback-only server. Stop it with Ctrl-C. To use another port: `PORT=5190 npm run spike-password-device-cost`. The production app never imports this directory. Root Jest matches only `test/**/*.test.js`; the spike has no test files. Generated `dist/` and `node_modules/` stay untracked; raw evidence stays in `results/`.

On this workstation, run checked code through `agent-local`, for example `agent-local npm run spike-password-device-cost`. It is a local policy tool, not a project dependency.

For Node evidence, from `spikes/password-device-cost/`:

```sh
npm run vectors
npm run measure -- --device 'EXACT MODEL; RAM; OS VERSION; POWER AND RUN CONDITIONS'
node artifacts.mjs
node compare.mjs results/chromium.json
```

Replace the device text before running. `measure` prints each completed cold/warm pair and saves `results/node-measurements.json`. Keep terminal output if a run fails before the final file is written. `vectors` writes `results/node-vectors.json`; it uses fixed PUBLIC passwords, salts and keys. `compare` checks all recorded chain bytes and boundary/GCM vectors against a browser export, then writes `results/comparison.json`. It requires a completed sweep and reference vectors. It exits with an error on a mismatch, not a weaker profile.

`node artifacts.mjs` records the installed packages, lock integrity values and per-file SHA-256. It does not verify registry signatures, attestations, or reproducible source builds. `npm ci` enforces the lock and npm's tarball integrity check. No installation scripts are needed on the measured darwin-arm64 platform; other platforms must verify their matching esbuild optional package is present.

## Human-run device checklist

Still required: a physical iPhone with Safari, a physical Android phone with Chrome, desktop Safari and desktop Firefox. No emulator or desktop WebKit result fills a phone row. The measured desktop Chrome-for-Testing row is distinct from an ordinary installed Chrome release.

1. **Name the device before measurement.** Record physical model, RAM if available (otherwise `unknown`), exact OS version, browser version from its About page, power source/battery level, low-power mode, foreground/background state and other load. For Node also record `node --version` and `node -p process.release.lts`. Do not call an unnamed device “current”. These observations define the tested boundary; a final support policy still needs agreement.
2. **Prepare the exact bundle.** Run the install/build command above from this branch. On the same desktop, use the printed localhost URL. For a phone, copy the entire `spikes/password-device-cost/dist/` directory to an HTTPS static origin you control, retaining every filename. Serve `.js` as JavaScript, `.css` as CSS and the entry as HTML. Serve both the page and worker with the CSP below. Do not put passwords, credentials or private data in this tool. This checklist does not authorize a public deployment or a paid service.
3. **For Android USB access without hosting**, if Android SDK `adb` and USB debugging are already available, run `adb reverse tcp:5187 tcp:5187`, then open `http://localhost:5187` in Chrome on the phone. After the run, use `adb reverse --remove tcp:5187`. This path was not exercised here; record whether it works. iPhone needs a trusted HTTPS origin; a plain LAN HTTP address is not a secure context.
4. **Enter device details in the page.** Click **Run reference vectors**. Expected: `Vectors complete`, all `vectors.checks[].pass` true, 11 chains. No timing from this step is a benchmark: it runs independent, sometimes slower reference implementations.
5. **Run one full sweep, with the page visible.** Click **Run full sweep**. Expected: `Sweep complete`, 120 samples (10 profiles × 2 images × 3 repeats × cold/warm), followed by guard results. Do not run vectors, other benchmarks or the project suite at the same time. A run that exceeds three seconds is evidence, not a reason to change settings. If a step fails, export the error and completed pairs; do not retry it until it appears to pass. Current code keeps `completedSamples` on interruption; an incomplete pair may be absent.
6. **Export before further actions.** Click **Download results** and rename the JSON with physical model, browser and date. This preserves the main sweep before later probes change page metadata. Attach that JSON to the findings PR or its linked ticket. Include any crash, reload, allocation error, or visible freeze and the last shown profile/case/repeat. If the OS kills the page before export, report that and rerun only to collect a diagnostic trace, not to erase the failed outcome.
7. **Check cancellation and guards.** Click **Check limits and cancellation**. Expected: `Guards complete`; unsupported profile, excess pixels/demand/draws rejected before worker creation; injected allocation failure with `fallback:false`; worker cancellation. Then start a sweep and click **Cancel**. Expected: `Cancelled; no weaker fallback`, controls enabled, no complete-sweep claim. Export the result. Cancellation stops workers; it does not promise secure memory erasure or stop the separate reference-vector calculation.
8. **Check offline operation.** Wait for `Offline assets cached`, reload once while online, then disable network on the device. Reload again and click **Run offline probe**. Expected: the page loads and `Offline probe complete` with Argon2 cold/warm samples. Export separately. Record actual network-off conditions and any missing asset. Re-enable network after the check.
9. **Record total resource limits honestly.** Capture browser process/worker memory with the platform profiler where available, including the scope and sampling interval. Record responsiveness, foreground state, OS kills and allocation failures. The page's `sampledPeakMemory` may describe only main-thread JS heap; null is unavailable, not zero. Do not substitute 64/128 MiB KDF workspace for whole-operation memory. Real allocation-failure behavior remains unproven by the injected error check.
10. **Return evidence, not a selected profile.** Supply raw exports, device details, profiler output if collected, and the exact branch/commit. On a desktop run `node compare.mjs path/to/phone-export.json` to compare complete exports with the committed Node vectors. State every missing result. Human agreement that the evidence is sufficient resolves this experiment; final profile selection remains in [Choose password processing and image-position generation](https://github.com/jdragulanescu/obscr/issues/18).

Required response header (not a meta tag; the worker must receive it too):

```text
Content-Security-Policy: default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; object-src 'none'; frame-ancestors 'none'
```

The build writes `THIRD-PARTY-NOTICES.txt` into the distributable and offline cache, combining installed notices with the examined native notices. Keep it with the assets. [DEPENDENCIES.md](DEPENDENCIES.md) explains the remaining review scope.

For a deliberate CSP denial check, build once, then run from the spike directory:

```sh
DENY_WASM=1 PORT=5189 npm start
```

Open `http://127.0.0.1:5189`, enter device details and run the offline probe. Chromium here reported an explicit WASM/CSP compilation error and did not select another KDF. Stop this separate server with Ctrl-C. Safari WebDriver here refused a session because **Safari Settings → Developer → Allow remote automation** was off. A human may run the page manually without changing that setting.

## Output schema

Browser export: `{schema:1, metadata, vectors?, measurements?, guards?, probe?, error?, completedSamples?}`. A completed `measurements` value has `{schema, recordedAt, profiles, cases, samples}`. Each sample records profile, image case, repeat, cold/warm mode, `keyMs`, receipt latency, retained-context elapsed time, separate image allocation time, pixel-copy bytes, sampler time/state/draws, output and generator bytes, heartbeat gap and memory values. `withinTarget` means only `keyMs <= 3000` for that sample. `receivedMs` is not a separate transfer-only benchmark.

Node measurement JSON contains the same measurements plus hardware/runtime metadata, guards and the separate maximum-demand sampler observation. Browser vectors have fewer checks because Node-only native comparisons are not run in the browser. Compare chain bytes, not the number of checks.

No real passwords are accepted by the page; its text field is device metadata. Do not enter private data there. All vector roots/keys in the committed JSON are public reference material.

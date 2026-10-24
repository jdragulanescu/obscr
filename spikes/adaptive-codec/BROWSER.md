# Observed browser and CLI workflows

Host: Apple M3 Max MacBook Pro, 16 CPU cores, 64 GB RAM, macOS 26.6.2 build 25G83. Browser: managed Chromium 150; Node 24.13.0. These are desktop observations, not physical-phone support or release approval. JSON evidence is in `evidence/browser-gate.json`, `browser-workflows.json`, `browser-download.json`, `cli-workflows.json` and `cli-repaired-exchange.json`.

Browser check — http://127.0.0.1:5197/@fs/Users/skylight/workspaces/worktrees/obscr/adaptive-codec/spikes/adaptive-codec/browser.html — Chromium through the harness browser tool, sessions adaptive-codec-pilot and adaptive-download-check
1. Click **Run codec gate** → seen: `Codec gate passed`; exact blind recovery at 16/64/512/655 bytes, expected 2048-byte refusal, rank 128 and five input-bound refusals → pass
2. Upload `cli-to-browser-raw.png`, select **Raw random salt**, click **Decode PNG** → seen: `Authenticated exact message`, exactly `CLI to browser: café é — exact bytes` → pass
3. Upload `cli-to-browser-adaptive.png`, select **Adaptive random salt**, click **Decode PNG** → seen: the same exact authenticated Unicode message → pass
4. Upload `photos/vandusen-2015.png`, enter `Browser to CLI: café é — exact bytes`, encode under each salt route → seen: `Encoded PNG ready` and **Download encoded PNG**; exact exported Blob bytes were saved for CLI recovery → pass
5. In the download-check session, encode `Downloaded browser PNG: exact bytes` with adaptive salt and click **Download encoded PNG** → seen: Chromium download completed, 736,469 bytes saved; file bytes equal the export Blob; actual CLI recovered the exact message from the downloaded file → pass
6. Upload the adaptive CLI file, enter `wrong-password`, click **Decode PNG** → seen: `Safe failure; no plaintext released`, diagnostic header failure, no message field → pass
7. Restore the synthetic password, click **Decode PNG**, then **Cancel message operation** after 150 ms → seen: `Cancelled; worker terminated; no plaintext released`; no late result after 800 ms → pass
8. Run the shared PNG reader/writer in Chromium on both browser exports → seen: all decoded RGB samples equal after rewrite; rewritten bytes saved for CLI recovery → pass
9. Upload a 50-byte malformed PNG and click **Decode PNG** → seen: `Safe failure; no plaintext released`, `PNG source bound or signature` → pass
10. Select parity 16 and **Round-robin bytes**, upload each `cli-512-<salt>.png`, click **Decode PNG** → seen: exactly 512 `C` bytes authenticated under both salt routes → pass
11. Encode 512 `B` bytes with parity 16/round-robin under both salt routes → seen: `Encoded PNG ready`, useful 512/total 640 bytes; exported bytes saved for CLI → pass
12. Enter 2048 bytes and click **Encode PNG** → seen: `Safe failure; no plaintext released`, `All-overhead capacity rejection` → pass
Console: none
Errors: none
Failed requests: GET http://127.0.0.1:5197/favicon.ico 404 only in the first session; no other 4xx/5xx. The download-check session had none. Cached 304 responses are not failures.
Screenshots: temporary `/var/folders/y8/gg0_s4gd53v5msnxvcp240cm0000gn/T/` captures `omp-sshots-15b1fe5bcfd1d5b7.webp`, `omp-sshots-15b2008c1491d5b8.webp`, `omp-sshots-15b2009d0ed1d5b9.webp`, `omp-sshots-15b200b82811d5ba.webp`, `omp-sshots-15b201b99451d5bb.webp`; observed during the run, removed during requested cleanup, not committed.
Videos: none
Verdict: pass — every step passed; the favicon-only 404 is excluded by the browser-check rule. Both browser sessions were closed.

The first automation session's download registry returned no records, so its exchange used exact Blob captures. A separate download-check session then enabled a dedicated temporary download directory and observed Chromium's actual completion event. The actual Node CLI consumed that downloaded PNG, not browser-returned plaintext or a simulator. `evidence/browser-download.json` records completion, byte equality, file hash and CLI output. The temporary download setting was reset afterward.

## CLI observations

The CLI is noninteractive, so it was launched directly under `agent-local`, not through a TUI or tmux. No TUI layout is claimed.

- `cli.mjs encode` created both Unicode CLI-to-browser PNGs. The browser recovered them exactly.
- `cli.mjs decode` consumed both original browser exports and both browser-written sample-preserving rewrites. All returned the exact Unicode string and SHA-256 `f2e61d90bb8218f77c1b09f0f1c168fbd0cacc667d3d70c7f31a4d1e42b121cc`.
- Both 512-byte repaired browser exports decoded to exactly 512 `B` bytes, SHA-256 `4391da166394eb9d592a66cdb937c0aa011b9fd54cb2fa0e7f5c7a6648c6625a`.
- SIGINT during an encode exited 130, printed no stdout, reported `Cancelled; no output released`, and created no output PNG. Wrong-password decoding exited 2 with safe failure and no message field.
- `npm run spike-adaptive-codec -- cli decode evidence/browser-512-adaptive.png adaptive 16 byte-round-robin` exercised the indexed root command and recovered the same 512-byte message.

## Measurement scope

The browser no-repair Unicode exchange took 644.8–680.1 ms to decode and 1329.0–1402.7 ms to encode. The 512-byte parity 16/round-robin exchange took 1019.3–1098.0 ms to decode and 3111.8–3334.9 ms to encode, including PNG/worker/library work. These are individual observations under Vite development serving, not benchmark distributions. Complete-operation times are not key-ready times.

The shared codec's measured linear memory was 67,108,864 bytes in both runtimes; the build fixes that maximum. Browser main-page heap values in the gate record do not include worker/KDF/decoder/browser-process peaks. Whole-browser peak RSS was not measured, and no mobile memory-safety claim follows. Node process peak RSS and timings are recorded separately; they are not substituted for browser measurements.

## Final wrapper-lifetime smoke

Before publication, the CLI and browser wrappers were changed to release their input RGB reference before the PNG writer allocates scanlines. A fresh `adaptive-final-ownership` browser session decoded the final CLI's 512-byte parity16/round-robin output, encoded another 512-byte message, completed an actual PNG download, and passed that downloaded file to the final CLI. Both messages matched exactly. `evidence/buffer-lifetime-smoke.json` records the results. Console/errors/failed requests were all empty; the download setting was reset and the tab closed. This proves file behavior after the ownership change, not garbage-collector timing.

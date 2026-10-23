# Hiding with an unprotected random salt

Disposable evidence for [Measure hiding with an unprotected random salt](https://github.com/jdragulanescu/obscr/issues/31). This is not a product format. Do not use it to protect real messages. The matrix uses explicitly seeded synthetic secrets; the interactive adapters use fresh random salt and nonce but retain a public synthetic default password. Neither production app reads this format.

## Run

Use Node 24.13.0, or a compatible runtime with Web Crypto, `String.isWellFormed`, CompressionStream and DecompressionStream. Install root dependencies, then the isolated spike dependencies:

```sh
npm ci
npm ci --prefix spikes/unprotected-salt
npm run spike-unprotected-salt
node spikes/unprotected-salt/boundaries.mjs
node spikes/unprotected-salt/key-chain.mjs
node spikes/unprotected-salt/cost.mjs
node --input-type=module -e 'import {rsChecks} from "./spikes/unprotected-salt/rs.mjs"; console.log(JSON.stringify(await rsChecks()))'
```

The matrix checks `evidence/freeze.json` before scoring. It writes `evidence/results.json` and `evidence/raw.json`, plus representative PNGs. `--quick` runs one training cover and does not supply detection findings. Candidate fixture seeds and damage are deterministic. Legacy encryption uses real random salts/nonces, so a new run is a new realization; raw hashes and retained representative files identify the recorded run. Do not replace the checked-in findings with a new run without recording that distinction.

The two explicit profiles are `no-repair` and `grouped-p32`. Both use raw 16-byte salt, the same accepted provisional expensive key schedule and grouped placement. The second repairs the password-located header and payload, not the salt. Select the same profile at both ends; there is no fallback or salt guessing. `CODEC.md` gives exact bytes, overhead and bounds.

## Browser and CLI PNG exchange

Build the browser codec, then start a server only in this worktree:

```sh
node spikes/unprotected-salt/build.mjs
npm run dev -- --host 127.0.0.1 --port 5199 --strictPort
```

Open `http://127.0.0.1:5199/@fs/<absolute-worktree-path>/spikes/unprotected-salt/browser.html`. The worktree server serves this disposable page outside the production app. Stop only the server you started. The one-file business-state demo shape does not fit this experiment: actual shared cryptography and PNG exchange are the evidence being requested, so the browser imports a local bundle.

After the matrix writes `evidence/original.png`, prepare both CLI examples:

```sh
node spikes/unprotected-salt/cli.mjs encode spikes/unprotected-salt/evidence/original.png spikes/unprotected-salt/evidence/cli-no-repair.png 'CLI to browser: café 日本語 🔒' no-repair
node spikes/unprotected-salt/cli.mjs encode spikes/unprotected-salt/evidence/original.png spikes/unprotected-salt/evidence/cli-grouped-p32.png 'CLI to browser: café 日本語 🔒' grouped-p32
```

For each profile:

1. Select **Profile**, click **Load CLI example**, then **Decode message**. Expect `CLI to browser: café 日本語 🔒` exactly.
2. Click **Encode message**, then **Save browser PNG**. Decode the saved file: `node spikes/unprotected-salt/cli.mjs decode <saved-file.png> <profile>`. Expect `Browser to CLI: café 日本語 🔒` exactly.
3. Click **Try wrong password**. Expect `safe-failure`, the common failure meaning and `message: null`.
4. Click **Change one salt bit**, then **Decode message**. Expect the same safe failure, including with repair enabled.

## Evidence

- `EXPERIMENT.md`, `CODEC.md`, `DETECTORS.md`, `CORPUS.md`: frozen protocol and source-separated, previously used corpus limits.
- `vendor/`, `REPAIR.md`, `photos/manifest.json`, `DEPENDENCIES.md`, `notices/`: source, rights, pins and attribution.
- `evidence/freeze.json`: exact pre-scoring source/protocol hashes.
- `evidence/raw.json`: every end-to-end case, separate damage diagnostics, feature rows, visual and cost observations.
- `evidence/results.json`: ROC curves, achieved rates, source-grouped uncertainty, paired comparisons and capacity boundaries.
- `evidence/boundaries.json`, `evidence/key-chain.json`, `evidence/rs-vectors.json`: executable boundary and primitive observations.
- `evidence/cost.json`, `evidence/browser.json`, `BROWSER.md`: named runtime/device cost and actual PNG exchange.
- `FINDINGS.md`: measured verdict, limits and the decision returned to the human.

The prototype changes no production module. The root task command and spike index are its only integration points. The root Jest pattern excludes spike files; Vite builds the `app/` root, which never imports the spike. No permanent tests were added.

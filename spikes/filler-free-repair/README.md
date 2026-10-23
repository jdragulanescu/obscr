# Filler-free hiding and bounded pixel repair

Disposable evidence for [Measure filler-free hiding and bounded pixel repair](https://github.com/jdragulanescu/obscr/issues/28). This is not a product format. Do not use it to protect real messages: fixture salts and nonces are deterministic. Neither the production CLI nor the PWA reads this format.

## Run

Use Node 24.13.0 or another runtime with Web Crypto, Blob, CompressionStream, DecompressionStream and `String.isWellFormed`. Install root dependencies with `npm ci`. No new runtime package is needed by the candidate codec; the controls and corpus use the root's locked dependencies.

```sh
npm run spike-filler-free-repair
node spikes/filler-free-repair/boundaries.mjs
node spikes/filler-free-repair/cost.mjs
node spikes/filler-free-repair/key-chain.mjs
node --input-type=module -e 'import {rsChecks} from "./spikes/filler-free-repair/rs.mjs"; console.log(JSON.stringify(await rsChecks()))'
```

The main command writes `evidence/results.json` and `evidence/raw.json`, plus representative original, encoded and transformed PNGs. It runs the declared matrix, not a benchmark on live services. `--quick` selects one cover and does not supply held-out detection evidence. Re-running legacy controls changes their cryptographically random salts/nonces; the retained PNGs identify the exact observed run. Fixture damage, candidate material and source splits are deterministic.

## Browser and CLI exchange

Start the worktree server with `npm run dev -- --host 127.0.0.1 --port 5198 --strictPort`. Open Vite's `/@fs/<absolute-worktree-path>/spikes/filler-free-repair/browser.html` URL. The prototype page imports its local codec; it is not part of the product bundle. Stop only the server you started.

Prepare the CLI example after the main command writes the cover:

```sh
node spikes/filler-free-repair/cli.mjs encode spikes/filler-free-repair/evidence/original.png spikes/filler-free-repair/evidence/cli-encoded.png 'CLI to browser: café 日本語 🔒'
```

1. Click **Load CLI example**, then **Decode message**. The page must show the exact authenticated CLI text.
2. Click **Encode message**, then **Save browser PNG**. Decode that saved PNG with `node spikes/filler-free-repair/cli.mjs decode <saved-file.png> grouped-p64`. It must print the exact browser text.
3. Click **Change RGB at 1% of pixels**, then **Decode message**. The result is an observation, not a survival promise.
4. Click **Try wrong password**. It must show a safe failure with `message: null`.

The default synthetic password is exported as `PASSWORD` by `codec.mjs`. Profile selection is explicit. The codec also bounds discovery to six experimental profiles; this is not a silent weaker fallback.

## Evidence layout

- `EXPERIMENT.md`: matrix and rejection criteria declared before scoring.
- `CODEC.md`: every experimental byte, key/placement rule, parser bound and capacity calculation.
- `REPAIR.md`, `vendor/`, `rs-vectors.mjs`: pinned source, license, changes, hashes and independent mathematical RS checks.
- `CORPUS.md`, `photos/`: photograph rights, source groups and fixed splits.
- `CONTROLS.md`: precise existing-code and five-copy controls, fixture damage generator.
- `evidence/`: raw observations, detector training/thresholds/ROC, grouped uncertainty, costs and representative PNGs.
- `FINDINGS.md`: measured verdict, limitations and the decision returned to the human.

No permanent tests were added. The spike is fenced off by the root Jest testMatch and the Vite `app` root. Production code never imports it. The root task command and the spike index are its only integration points.

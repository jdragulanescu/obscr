// Question: what do matched raw-salt profiles cost on this measured desktop?
// https://github.com/jdragulanescu/obscr/issues/31. Run after the main matrix, without concurrent benchmarks.
import fs from 'node:fs/promises';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
if (process.argv[2] === '--child') {
  const { encode, decode } = await import('./codec.mjs');
  const { covers } = await import('./corpus.mjs');
  const { message, hash } = await import('./controls.mjs');
  const cover = (await covers()).find(c => c.width === 512), bytes = message(2048), profile = process.argv[3];
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const before = process.memoryUsage(), t = performance.now();
    const encoded = await encode(cover.rgb, cover.width, cover.height, bytes, profile);
    const encodeMs = performance.now() - t, td = performance.now();
    const decoded = await decode(encoded.rgb, cover.width, cover.height, profile);
    rows.push({ iteration: i, phase: i ? 'warm' : 'cold-codec-first-use', encodeMs, decodeMs: performance.now() - td, outcome: decoded.outcome, exact: decoded.message && hash(decoded.message) === hash(bytes), totalCodedBytes: encoded.totalCodedBytes, memoryBefore: before, memoryAfter: process.memoryUsage(), peakRssBytes: process.resourceUsage().maxRSS * 1024 });
  }
  console.log(JSON.stringify({ profile, width: cover.width, height: cover.height, usefulBytes: bytes.length, rows }));
} else {
  const results = [];
  for (const profile of ['no-repair', 'grouped-p32']) {
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--child', profile], { encoding: 'utf8' });
    if (child.status !== 0) throw Error(child.stderr || `Cost child failed: ${child.status}`);
    results.push(JSON.parse(child.stdout));
  }
  const result = { device: { node: process.version, cpu: os.cpus()[0]?.model, platform: os.platform(), release: os.release(), arch: os.arch(), totalMemoryBytes: os.totalmem() }, note: 'Each profile has a fresh Node process. First encode includes first Sodium initialization/KDF; decode follows it and is not a cold derivation. Process RSS is not browser/device memory. No phone observed.', results };
  await fs.writeFile(`${here}evidence/cost.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (results.some(r => r.rows.some(x => !x.exact))) process.exitCode = 1;
}

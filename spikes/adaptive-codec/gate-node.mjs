// Question: can the real adaptive WASM codec pass the prerequisite gate?
// https://github.com/jdragulanescu/obscr/issues/35. Controls: npm run gate; no secrets.
import fs from 'node:fs/promises';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { runGate } from './gate.mjs';
if (!isMainThread) {
  const result = await runGate(await fs.readFile(new URL('./codec.wasm', import.meta.url)), row => parentPort.postMessage({ progress: row }));
  parentPort.postMessage({ result });
} else {
  const worker = new Worker(new URL(import.meta.url));
  const timeout = setTimeout(() => { worker.terminate(); console.error('STOP: 30-second codec gate deadline'); process.exitCode = 1; }, 30000);
  worker.on('message', async ({ result, progress }) => {
    if (progress) console.log(JSON.stringify(progress));
    if (result) {
      clearTimeout(timeout);
      result.peakRssBytes = process.resourceUsage().maxRSS * 1024;
      result.platform = { platform: process.platform, arch: process.arch, versions: process.versions };
      await fs.mkdir(new URL('./evidence/', import.meta.url), { recursive: true });
      await fs.writeFile(new URL('./evidence/node-gate.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
      console.log(JSON.stringify(result, null, 2));
      if (!result.passed) process.exitCode = 1;
    }
  });
  worker.on('error', error => { clearTimeout(timeout); console.error(error); process.exitCode = 1; });
  worker.on('exit', code => { clearTimeout(timeout); if (code) process.exitCode = 1; });
}

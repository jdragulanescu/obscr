// Build only the disposable browser codec for https://github.com/jdragulanescu/obscr/issues/31.
// Run: node spikes/unprotected-salt/build.mjs; production never imports this bundle.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
await build({ entryPoints: [`${here}codec.mjs`], outfile: `${here}codec.bundle.js`, bundle: true, platform: 'browser', format: 'esm', target: 'es2022', external: ['node:*'], legalComments: 'eof' });
console.log('Built spike browser codec; see browser.html through this worktree Vite server.');

// Question: can bounded adaptive messages cross Node and browser intact?
// https://github.com/jdragulanescu/obscr/issues/35 — disposable, synthetic data only.
// Controls: gate (default), initial, repair, controls, boundaries, frame-bounds,
// workflow-cli, cli <args>, build, build-browser. See README.md before measurements.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const [mode='gate',...args]=process.argv.slice(2),here=fileURLToPath(new URL('.',import.meta.url));
const scripts={gate:'gate-node.mjs',initial:'run.mjs',repair:'run.mjs',controls:'run.mjs',boundaries:'boundaries.mjs','frame-bounds':'frame-bounds.mjs','workflow-cli':'workflow-cli.mjs',cli:'cli.mjs',build:'build.mjs'};
if(mode==='build-browser'){
  const { build }=await import('esbuild');
  await build({entryPoints:[here+'codec.mjs'],outfile:here+'codec.bundle.js',bundle:true,platform:'browser',format:'esm',target:'es2022',external:['node:*'],legalComments:'eof'});
}else{
  if(!scripts[mode])throw Error('Unknown spike command');
  const runArgs=['initial','repair','controls'].includes(mode)?[mode,...args]:args;
  const result=spawnSync(process.execPath,[scripts[mode],...runArgs],{cwd:here,stdio:'inherit'});
  process.exitCode=result.status??1;
}

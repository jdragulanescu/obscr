// Disposable KDF cost experiment: https://github.com/jdragulanescu/obscr/issues/27
// npm run measure -- --device 'model; RAM; OS; power conditions' or npm run vectors.
import {Worker} from 'node:worker_threads';
import {writeFile,mkdir} from 'node:fs/promises';
import os from 'node:os';
import {runSweep,runGuards} from './experiment.mjs';
import {runVectors} from './vectors.mjs';
import {positions} from './core.mjs';
const factory=()=>{
  const worker=new Worker(new URL('./worker.mjs',import.meta.url));
  const handle={send:(d,t=[])=>worker.postMessage(d,t),stop:()=>worker.terminate()};
  worker.on('message',d=>handle.onMessage?.(d));worker.on('error',e=>handle.onError?.(e));return handle;
};
await mkdir(new URL('./results/',import.meta.url),{recursive:true});
if(process.argv.includes('--vectors')) {
  const vectors=await runVectors();
  await writeFile(new URL('./results/node-vectors.json',import.meta.url),JSON.stringify(vectors,null,2)+'\n');
  console.log(JSON.stringify({checks:vectors.checks,chains:vectors.chains?.length}));
} else {
  const device=process.argv[process.argv.indexOf('--device')+1];
  if(!process.argv.includes('--device')||!device) throw new Error('Supply --device with exact model, RAM, OS and conditions before measurement');
  const metadata={device,node:process.version,os:os.release(),arch:os.arch(),ram:os.totalmem(),cpu:os.cpus()[0].model,startedAt:new Date().toISOString()};
  console.log(JSON.stringify(metadata));
  const results=await runSweep(factory,pair=>console.log(pair.map(s=>`${s.profileId} ${s.case} ${s.mode}: ${s.keyMs.toFixed(1)} ms`).join('\n')));
  const guards=await runGuards(factory);
  const start=performance.now();
  const stress=await positions(new Uint8Array(32),4032*3024*3-4096,1048576,{maxDraws:2098176});
  const stressResult={demand:1048576,elapsedMs:performance.now()-start,draws:stress.draws,peakEntries:stress.peakEntries,processMemory:process.memoryUsage()};
  await writeFile(new URL('./results/node-measurements.json',import.meta.url),JSON.stringify({...results,metadata,guards,stress:stressResult},null,2)+'\n');
  console.log('Saved results/node-measurements.json');
}

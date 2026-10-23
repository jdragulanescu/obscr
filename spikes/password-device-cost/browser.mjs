// Controls for https://github.com/jdragulanescu/obscr/issues/27. Public inputs only.
import {runSweep,runGuards,measurePair,CASES} from './experiment.mjs';
import {runVectors} from './vectors.mjs';
const output=document.querySelector('#output'),status=document.querySelector('#status');
const workers=new Set();let cancelled=false;
function factory(){
  const worker=new Worker('./worker.js',{type:'module'});
  const handle={send:(d,t=[])=>worker.postMessage(d,t),stop:()=>{worker.terminate();workers.delete(handle);}};
  workers.add(handle);
  worker.onmessage=e=>handle.onMessage?.(e.data);worker.onerror=e=>handle.onError?.(new Error(e.message));return handle;
}
let report={schema:1,metadata:null};
function metadata(){
  const device=document.querySelector('#device').value.trim();
  if(!device)throw new Error('Enter physical device, RAM, OS and power conditions first');
  if(!isSecureContext||!crypto.subtle)throw new Error('A secure context is required; use HTTPS or localhost');
  return {device,userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,deviceMemoryGB:navigator.deviceMemory??null,secureContext:isSecureContext,crossOriginIsolated,startedAt:new Date().toISOString()};
}
function show(){output.textContent=JSON.stringify(report,null,2);}
async function action(name,fn){
  status.textContent=name+' running';cancelled=false;
  document.querySelectorAll('[data-run]').forEach(b=>b.disabled=true);
  try {delete report.error;report.metadata=metadata();await fn();status.textContent=name+' complete';show();}
  catch(error){report.error=error.message;status.textContent=cancelled?'Cancelled; no weaker fallback':name+' failed: '+error.message;show();}
  finally {document.querySelectorAll('[data-run]').forEach(b=>b.disabled=false);}
}
async function vectors(){return action('Vectors',async()=>{report.vectors=await runVectors();});}
async function sweep(){return action('Sweep',async()=>{
  delete report.measurements;
  report.completedSamples=[];
  report.measurements=await runSweep(factory,pair=>{
    report.completedSamples.push(...pair);
    if(cancelled)throw new Error('cancelled');
    status.textContent=`${pair[0].profileId} / ${pair[0].case} / repeat ${pair[0].repeat+1}`;
    show();
  });
  delete report.completedSamples;
  report.guards=await runGuards(factory);
});}
async function guards(){return action('Guards',async()=>{report.guards=await runGuards(factory);});}
async function quick(){return action('Offline probe',async()=>{report.probe=await measurePair(factory,'a64t2',CASES[0],0);});}
document.querySelector('#vectors').onclick=vectors;
document.querySelector('#sweep').onclick=sweep;
document.querySelector('#guards').onclick=guards;
document.querySelector('#probe').onclick=quick;
document.querySelector('#cancel').onclick=()=>{cancelled=true;for(const handle of workers){handle.stop();handle.onError?.(new Error('cancelled'));}status.textContent='Cancelled; no weaker fallback';};
document.querySelector('#download').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}));a.download='password-device-cost.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
window.spike={vectors,sweep,guards,quick,get report(){return report;}};
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{document.querySelector('#offline').textContent='Offline assets cached; reload once before disconnecting';}).catch(error=>{document.querySelector('#offline').textContent='Offline cache failed: '+error.message;});
show();

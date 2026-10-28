// Disposable measurement harness for issue 27. Fixed public inputs only.
import { PROFILES, validateRequest } from './core.mjs';
export const CASES = [
  {name:'small', width:1024, height:768, demand:4096},
  {name:'photo', width:4032, height:3024, demand:262144},
];
export function request(profileId, image = CASES[0]) {
  return {profileId, password:'public experiment — e\u0301 🔒', salt:Uint8Array.from({length:16},(_,i)=>i), ...image};
}
const memory = () => typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() :
  (globalThis.performance.memory ? {mainHeapUsed:performance.memory.usedJSHeapSize, mainHeapTotal:performance.memory.totalJSHeapSize} : null);
export async function measurePair(factory, profileId, image, repeat) {
  const req = request(profileId,image);
  validateRequest(req);
  const allocStart=performance.now();
  const source=new Uint8Array(image.width*image.height*4); source.fill(127);
  const transfer=source.slice();
  const allocationMs=performance.now()-allocStart;
  let worker, baseline=memory(), peak=baseline && {...baseline}, last=performance.now(), maxHeartbeatGapMs=0;
  const heartbeat=setInterval(()=>{
    const now=performance.now(); maxHeartbeatGapMs=Math.max(maxHeartbeatGapMs,now-last); last=now;
    const m=memory(); if(m) for(const k of Object.keys(m)) peak[k]=Math.max(peak[k]||0,m[k]);
  },10);
  const samples=[];
  try {
    for(const mode of ['cold','warm']) {
      maxHeartbeatGapMs=0; last=performance.now();
      const started=performance.now();
      if(!worker) worker=factory();
      const result=await new Promise((resolve,reject)=>{
        let keyMs=null, receivedMs=null;
        const deadline=setTimeout(()=>reject(new Error('operation exceeded 120 seconds')),120000);
        worker.onError=e=>{clearTimeout(deadline);reject(e);};
        worker.onMessage=data=>{
          if(data.type==='received') receivedMs=performance.now()-started;
          if(data.type==='keys') keyMs=performance.now()-started;
          if(data.type==='error') {clearTimeout(deadline);reject(new Error(data.error));}
          if(data.type==='complete') {clearTimeout(deadline);resolve({...data,keyMs,receivedMs,totalMs:performance.now()-started});}
        };
        worker.send({type:'run',req,pixels:mode==='cold'?transfer:null},mode==='cold'?[transfer.buffer]:[]);
      });
      const m=memory(); if(m) for(const k of Object.keys(m)) peak[k]=Math.max(peak[k]||0,m[k]);
      samples.push({profileId,case:image.name,repeat,mode,...result,allocationMs,mainSourceBytes:source.byteLength,workerPixelsBytes:source.byteLength,baselineMemory:baseline,sampledPeakMemory:peak&&{...peak},maxHeartbeatGapMs,withinTarget:result.keyMs<=3000});
    }
  } finally { clearInterval(heartbeat); if(worker) await worker.stop(); source.fill(0); }
  return samples;
}
export async function runSweep(factory,onSample=()=>{}) {
  const samples=[];
  for(const profile of PROFILES) for(const image of CASES) for(let repeat=0;repeat<3;repeat++) {
    const pair=await measurePair(factory,profile.id,image,repeat);
    samples.push(...pair); onSample(pair);
  }
  return {schema:1,recordedAt:new Date().toISOString(),profiles:PROFILES,cases:CASES,samples};
}
export async function runGuards(factory) {
  const checks=[];
  for(const [name,patch] of [['unknown profile',{profileId:'unknown'}],['excess pixels',{width:4097}],['excess demand',{demand:1048577}],['excess draws',{maxDraws:2098177}]]) {
    let rejected=false; try {validateRequest({...request('p600k'),...patch});} catch {rejected=true;}
    if(!rejected) throw new Error(name+' accepted'); checks.push({name,rejected,beforeWorker:true});
  }
  const failure=factory();
  try {
    const error=await new Promise((resolve,reject)=>{
      const deadline=setTimeout(()=>reject(new Error('injection timed out')),10000);
      failure.onError=reject; failure.onMessage=d=>{if(d.type==='error'){clearTimeout(deadline);resolve(d);}};
      failure.send({type:'run',req:request('a128t3'),injectAllocationFailure:true});
    });
    if(error.error!=='injected allocation failure') throw new Error('unexpected injection result');
    checks.push({name:'injected allocation failure',...error,realOOM:false});
  } finally {await failure.stop();}
  const cancel=factory();
  try {
    await new Promise((resolve,reject)=>{
      const deadline=setTimeout(()=>reject(new Error('cancel start timed out')),10000);
      cancel.onError=reject; cancel.onMessage=d=>{if(d.type==='deriving'){clearTimeout(deadline);resolve();}};
      cancel.send({type:'run',req:request('a128t3'),pixels:new Uint8Array(1024*768*4)});
    });
    const start=performance.now(); await cancel.stop();
    checks.push({name:'cancel cold worker during derivation',terminationMs:performance.now()-start,noFallback:true,erasureGuaranteed:false});
  } catch(e) {await cancel.stop();throw e;}
  return checks;
}

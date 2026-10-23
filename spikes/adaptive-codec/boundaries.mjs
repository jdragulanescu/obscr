// Throwaway boundary observations, not permanent tests. Run node boundaries.mjs.
import fs from 'node:fs/promises';
import { Worker,isMainThread,parentPort } from 'node:worker_threads';
import { createCodec,PASSWORD } from './codec.mjs';
import { loadCodec,equal } from './gate.mjs';
import { parsePng,makePng } from './png.mjs';
import { createPlacement,bootstrap } from './placement.mjs';
import { deriveKeys,keyChainObservations } from './reference/key-chain.mjs';
import { rsChecks } from './reference/rs.mjs';
const root=new URL('.',import.meta.url);
if(isMainThread){
  const worker=new Worker(new URL(import.meta.url)),timer=setTimeout(()=>{worker.terminate();console.error('STOP boundary operation deadline');process.exitCode=1;},30000);
  worker.on('message',async result=>{clearTimeout(timer);result.peakRssBytes=process.resourceUsage().maxRSS*1024;await fs.writeFile(new URL('evidence/boundaries.json',root),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;});
  worker.on('error',e=>{clearTimeout(timer);console.error(e);process.exitCode=1;});
}else{
  const start=performance.now(),wasm=await fs.readFile(new URL('codec.wasm',root)),codec=await createCodec(wasm),raw=await fs.readFile(new URL('photos/vandusen-2015.png',root)),image=await parsePng(raw),checks=[];
  const check=(name,passed,details={})=>{checks.push({name,passed,...details});if(!passed)throw Error('STOP '+name);};
  const rejected=async fn=>{try{await fn();return false;}catch{return true;}};
  const chain=await keyChainObservations();check('accepted independent KDF/HKDF/stream vectors',chain.passed);
  const repair=await rsChecks();check('retained independent RS vectors',repair.vectors.every(v=>v.independentMatch&&v.shorteningMatch)&&repair.boundaries.filter(v=>v.errors<=v.radius).every(v=>v.outcome==='exact')&&repair.inputBounds.every(v=>v.rejected),{report:repair});
  const keys=await deriveKeys(Uint8Array.from({length:16},(_,i)=>i),PASSWORD),n=12000,k=1300,sampler=createPlacement(n,keys.placement),actual=await sampler.take(k),reserved=new Set(bootstrap(n)),pool=Array.from({length:n},(_,i)=>i).filter(i=>!reserved.has(i));
  const stream=new DataView(await crypto.subtle.encrypt({name:'AES-CTR',counter:new Uint8Array(16),length:128},keys.placement,new Uint8Array(12288))),expected=new Uint32Array(k);let at=0,left=pool.length;
  for(let i=0;i<k;i++){let w;const ceiling=Math.floor(2**32/left)*left;do{w=stream.getUint32(at,true);at+=4;}while(w>=ceiling);const pick=w%left;expected[i]=pool[pick];pool[pick]=pool[--left];}
  const split=createPlacement(n,keys.placement),a=await split.take(256),b=await split.take(k-256),joined=new Uint32Array(k);joined.set(a);joined.set(b,256);
  check('scalar sampler matches independent full-domain reference',equal(actual,expected));check('scalar sampler stream survives split calls',equal(actual,joined));check('scalar sampler excludes bootstrap without duplicates',new Set(actual).size===k&&actual.every(i=>!reserved.has(i)));
  for(const salt of ['raw','adaptive']){
    const p={salt,parity:0,interleave:'none'},text=' café e\u0301 — exact UTF-8 ',message=new TextEncoder().encode(text),encoded=await codec.encode(image,message,p),decoded=await codec.decode(encoded,p);
    check(salt+' Unicode exact authenticated round trip',decoded.outcome==='exact-ready'&&equal(decoded.message,message));
    const compressedMessage=new TextEncoder().encode('compressible fixture '.repeat(3000)),compressed=await codec.encode(image,compressedMessage,p,{compressed:true}),unpacked=await codec.decode(compressed,p);check(salt+' bounded authenticated decompression',unpacked.outcome==='exact-ready'&&equal(unpacked.message,compressedMessage));
    const wrong=await codec.decode(encoded,p,'wrong-password');check(salt+' wrong password releases no plaintext',wrong.outcome==='safe-failure'&&!('message'in wrong),{stage:wrong.diagnosticStage});
    const fresh=await codec.encode(image,message,p);check(salt+' fresh salt and nonce',!equal(encoded.salt,fresh.salt)&&!equal(encoded.headerCode.subarray(0,12),fresh.headerCode.subarray(0,12)));
    for(const part of ['salt','header','payload']){
      const damaged={...encoded,rgb:encoded.rgb.slice()},ids=part==='salt'?encoded.saltPositions:part==='header'?encoded.headerPositions:encoded.payloadPositions;damaged.rgb[ids[0]]^=1;
      const result=await codec.decode(damaged,p);check(salt+' directed '+part+' damage rejects without plaintext',result.outcome==='safe-failure'&&!('message'in result),{stage:result.diagnosticStage});
    }
    // Re-encode explicitly corrupted/truncated body through the real STC, not raw PNG corruption.
    for(const variant of ['changed-full-tag','shortened-tag']){
      const tampered={...encoded,rgb:encoded.rgb.slice()},core=await loadCodec(wasm),payload=encoded.payloadCode.slice();
      if(variant==='changed-full-tag')payload[payload.length-1]^=128;else{payload.copyWithin(payload.length-16,payload.length-15);payload[payload.length-1]=0;}
      core.samples().set(Uint8Array.from(encoded.payloadPositions,i=>tampered.rgb[i]));core.costs().fill(1);core.payload().set(payload);
      if(core.api.encode(encoded.payloadPositions.length,payload.length)<0)throw Error('Tamper construction failed');const samples=core.samples();for(let i=0;i<encoded.payloadPositions.length;i++)tampered.rgb[encoded.payloadPositions[i]]=samples[i];
      const answer=await codec.decode(tampered,p);check(salt+' '+variant+' rejects at authentication',answer.outcome==='safe-failure'&&answer.diagnosticStage==='authentication'&&!('message'in answer));
    }
    for(const bad of ['', '\ud800', 'x'.repeat(1025)])check(salt+' invalid password bytes '+bad.length,await rejected(()=>codec.encode(image,message,p,{password:bad})));
    check(salt+' over-capacity no fallback',await rejected(()=>codec.encode(image,new Uint8Array(2048),p)));
    check(salt+' over-decompression input limit',await rejected(()=>codec.encode(image,new Uint8Array(1048577),p,{compressed:true})));
  }
  for(const [name,bytes] of [['truncated',raw.subarray(0,raw.length-1)],['wrong-signature',new Uint8Array(50)],['over-source-limit',new Uint8Array(16*1024*1024+1)]])check('PNG '+name,await rejected(()=>parsePng(bytes)));
  const badCrc=raw.slice();badCrc[30]^=1;check('PNG CRC corruption',await rejected(()=>parsePng(badCrc)));
  check('PNG over-dimension rejected before allocation',await rejected(()=>makePng({width:1025,height:1,rgb:new Uint8Array(1)})));
  check('PNG exact sample rewrite',equal((await parsePng(await makePng(image))).rgb,image.rgb));
  parentPort.postMessage({passed:checks.every(c=>c.passed),checks,elapsedMs:performance.now()-start,runtime:process.version});
}

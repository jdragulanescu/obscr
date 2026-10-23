// Disposable desktop cost observations, not the pending production KDF profile.
// https://github.com/jdragulanescu/obscr/issues/28
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {encode,decode,profiles} from './codec.mjs';
import {covers} from './corpus.mjs';
import {message,png} from './controls.mjs';
const c=(await covers()).find(c=>c.width===512&&c.kind!=='stress'), msg=message(2048), rows=[];
for(const p of profiles){
  const input=new URL(`./evidence/cost-${p.name}.png`,import.meta.url);
  const e=await encode(c.rgb,c.width,c.height,msg,p,{seed:`cost/${p.name}`});await fs.writeFile(input,png(e.rgb,c.width,c.height));
  for(let repeat=0;repeat<3;repeat++){
    const t=performance.now(), child=spawnSync(process.execPath,[new URL('./cli.mjs',import.meta.url).pathname,'decode',input.pathname,p.name],{encoding:'utf8'});
    if(child.status!==0)throw Error(child.stderr||child.stdout);
    const result=JSON.parse(child.stdout);rows.push({profile:p.name,mode:'cold-process-decode',repeat,wallMs:performance.now()-t,operationMs:result.elapsedMs,peakRssBytes:result.peakRssBytes,outcome:result.outcome});
  }
  for(let repeat=0;repeat<3;repeat++){
    const t=performance.now(), encoded=await encode(c.rgb,c.width,c.height,msg,p,{seed:`cost/${p.name}/warm/${repeat}`});const encodedAt=performance.now();const d=await decode(encoded.rgb,c.width,c.height,p);rows.push({profile:p.name,mode:'warm-encode-decode',repeat,encodeMs:encodedAt-t,decodeMs:performance.now()-encodedAt,processPeakRssBytes:process.resourceUsage().maxRSS*1024,outcome:d.outcome,exact:d.message?.every((x,i)=>x===msg[i])&&d.message.length===msg.length});
  }
}
await fs.writeFile(new URL('./evidence/cost.json',import.meta.url),JSON.stringify({node:process.version,dimensions:[c.width,c.height],payloadBytes:msg.length,rows,scope:'One M3 Max desktop; cold-process timings include module/PNG startup. Memory is process peak RSS, not isolated codec allocation. No phone or production-profile claim.'},null,2));
console.log(JSON.stringify({measurements:rows.length,failures:rows.filter(r=>r.outcome!=='exact-ready'||r.exact===false)}));

// Question: can filler-free repair meet concealment and recovery priorities?
// https://github.com/jdragulanescu/obscr/issues/28 — disposable, synthetic secrets only.
// Run: npm run spike-filler-free-repair; --quick exercises one cover, not full evidence.
import fs from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { profiles, PASSWORD, encode, decode, capacity, readSaltCode } from './codec.mjs';
import { rsEncode, rsDecode } from './rs.mjs';
import { covers } from './corpus.mjs';
import { features, analyze } from './detection.mjs';
import { controls, controlEncode, controlDecode, message, damage, visual, extractedByteErrors, png, parsePng, hash } from './controls.mjs';
const dir = fileURLToPath(new URL('./evidence/', import.meta.url));
await fs.mkdir(dir, { recursive: true });
const quick = process.argv.includes('--quick');
const corpus = await covers();
const selected = quick ? corpus.slice(0,1) : corpus;
const rows = [], detection = [], edges = [], costs = [], capacities = [];
const start = performance.now();
const equal = (a,b) => a && a.length===b.length && a.every((x,i)=>x===b[i]);
function outcome(result, expected) { return result.outcome === 'exact-ready' ? equal(result.message,expected) ? 'exact' : 'incorrect-authenticated-output' : 'safe-failure'; }
function publicScore(rgb,width,height) {
  try { const code = readSaltCode(rgb,width,height); const data = rsDecode(code,64); return equal(rsEncode(data,64),code) ? 1 : 0; }
  catch { return 0; }
}
async function recordDecode(cover,p,encoded,expected,kind,seed,changed,legacy=false,password=PASSWORD) {
  const before=performance.now();
  const result=legacy ? await controlDecode(changed.rgb,cover.width,cover.height,p,password) : await decode(changed.rgb,cover.width,cover.height,p,password);
  const row={source:cover.id,sourceGroup:cover.sourceGroup,split:cover.split,coverKind:cover.kind,width:cover.width,height:cover.height,method:p.name,load:expected.length,damage:kind,seed,selectedPixels:changed.selectedPixels??0,outcome:outcome(result,expected),reason:result.reason??null,decodeMs:performance.now()-before,erroneousBytesPerWord:extractedByteErrors(encoded,changed.rgb)};
  rows.push(row); return row;
}
for (const cover of selected) {
  console.log(`source ${cover.id} ${cover.width}x${cover.height}`);
  const coverFeatures=features(cover.rgb,cover.width,cover.height), coverPublicScore=publicScore(cover.rgb,cover.width,cover.height);
  for (const size of quick ? [64] : [64,512,2048]) {
    const msg=message(size);
    for (const p of [...profiles,...controls]) {
      const legacy=!!p.copies;
      const t=performance.now();
      let encoded;
      try { encoded=legacy ? await controlEncode(cover,msg,p,PASSWORD) : await encode(cover.rgb,cover.width,cover.height,msg,p,{seed:`${cover.id}/${size}/${p.name}`}); }
      catch(error) { edges.push({source:cover.id,method:p.name,load:size,case:'encode',outcome:'rejected',reason:String(error)}); continue; }
      costs.push({source:cover.id,method:p.name,load:size,encodeMs:performance.now()-t,rss:process.memoryUsage().rss,...visual(cover.rgb,encoded.rgb),codedBytes:encoded.totalCodedBytes??encoded.codedBytes,storedBytes:encoded.storedBytes});
      detection.push({sourceGroup:cover.sourceGroup,id:cover.id,source:cover.id,split:cover.split,kind:cover.kind,width:cover.width,height:cover.height,method:p.name,load:size,coverFeatures,encodedFeatures:features(encoded.rgb,cover.width,cover.height),publicScore:publicScore(encoded.rgb,cover.width,cover.height),coverPublicScore});
      await recordDecode(cover,p,encoded,msg,'unchanged',0,{rgb:encoded.rgb},legacy);
      for(const seed of quick ? [2801] : [2801,2802,2803]) for(const kind of ['one-channel-1pct','rgb-replace-1pct']) {
        await recordDecode(cover,p,encoded,msg,kind,seed,damage(encoded.rgb,cover.width,cover.height,kind,seed),legacy);
      }
      if(size===64 && cover===selected[0]) {
        await fs.writeFile(`${dir}${p.name}.png`,png(encoded.rgb,cover.width,cover.height));
        await fs.writeFile(`${dir}${p.name}-damaged.png`,png(damage(encoded.rgb,cover.width,cover.height,'rgb-replace-1pct',2801).rgb,cover.width,cover.height));
      }
    }
  }
}
await fs.writeFile(`${dir}original.png`,png(selected[0].rgb,selected[0].width,selected[0].height));
// A representative cover at each geometry; edges are separate from declared target scores.
const representatives=[...new Map(selected.map(c=>[`${c.width}x${c.height}`,c])).values()];
for(const cover of representatives) for(const p of profiles) {
  const msg=new TextEncoder().encode('Exact Unicode: café, Ελληνικά, 日本語, 🔒. '.repeat(20));
  for(const compressed of [false,true]) {
    const encoded=await encode(cover.rgb,cover.width,cover.height,msg,p,{compressed,seed:`edge/${cover.id}/${p.name}/${compressed}`});
    const label=compressed?'compressed':'utf8';
    const decoded=await decode(encoded.rgb,cover.width,cover.height,p);
    edges.push({source:cover.id,method:p.name,case:label,outcome:outcome(decoded,msg),storedBytes:encoded.storedBytes,plainBytes:msg.length});
    const rewrite=parsePng(png(encoded.rgb,cover.width,cover.height));
    edges.push({source:cover.id,method:p.name,case:`${label}-png-rewrite`,pixelsEqual:equal(rewrite.rgb,encoded.rgb),outcome:outcome(await decode(rewrite.rgb,rewrite.width,rewrite.height,p),msg)});
    if(compressed) continue;
    for(const kind of ['patch','stripe']) await recordDecode(cover,p,encoded,msg,kind,2801,damage(encoded.rgb,cover.width,cover.height,kind,2801));
    await recordDecode(cover,p,encoded,msg,'wrong-password',0,{rgb:encoded.rgb},false,'different synthetic password');
    await recordDecode(cover,p,encoded,msg,'plain-cover',0,{rgb:cover.rgb});
    for(const [part,positions,radius] of [['salt',encoded.saltPositions,32],['metadata',encoded.metadataPositions,32],['payload',encoded.payloadPositions,p.parity/2]]) {
      for(const badBytes of [radius,radius+1]) {
        const altered=encoded.rgb.slice();
        for(let i=0;i<badBytes;i++) altered[positions[i][0]]^=1;
        const row=await recordDecode(cover,p,encoded,msg,`${part}-${badBytes}-byte-errors`,0,{rgb:altered});
        edges.push({source:cover.id,method:p.name,case:`${part}-boundary`,badBytes,radius,outcome:row.outcome});
      }
    }
    for(const [name,raw] of [['truncated-rgb',encoded.rgb.subarray(0,encoded.rgb.length-1)],['empty-rgb',new Uint8Array()]]) {
      try { edges.push({source:cover.id,method:p.name,case:name,outcome:outcome(await decode(raw,cover.width,cover.height,p),msg)}); }
      catch(error) { edges.push({source:cover.id,method:p.name,case:name,outcome:'safe-failure',reason:String(error)}); }
    }
    const bytes=png(encoded.rgb,cover.width,cover.height);
    try { parsePng(bytes.subarray(0,Math.floor(bytes.length/2))); edges.push({case:'truncated-container',outcome:'unexpected-parse'}); }
    catch { edges.push({case:'truncated-container',outcome:'container-rejected-not-pixel-repair'}); }
  }
  const cap=capacity(cover.width,cover.height,p); capacities.push({width:cover.width,height:cover.height,method:p.name,maxStoredBytes:cap});
  for(const size of [cap,cap+1]) {
    try {
      const data=message(size), enc=await encode(cover.rgb,cover.width,cover.height,data,p,{seed:`capacity/${p.name}/${size}`});
      edges.push({method:p.name,width:cover.width,height:cover.height,case:'physical-capacity',size,capacity:cap,outcome:outcome(await decode(enc.rgb,cover.width,cover.height,p),data)});
    } catch(error) { edges.push({method:p.name,width:cover.width,height:cover.height,case:'physical-capacity',size,capacity:cap,outcome:'rejected',reason:String(error)}); }
  }
}
const groups={};
for(const r of rows) { const k=`${r.method}/${r.damage}`; groups[k]??={exact:0,'safe-failure':0,'incorrect-authenticated-output':0}; groups[k][r.outcome]++; }
const sourceHashes={};
for(const name of ['codec.mjs','controls.mjs','corpus.mjs','detection.mjs','rs.mjs','run.mjs','EXPERIMENT.md']) sourceHashes[name]=hash(await fs.readFile(new URL(name,import.meta.url)));
const report={quick,device:{platform:os.platform(),release:os.release(),arch:os.arch(),cpu:os.cpus()[0]?.model,node:process.version,memory:os.totalmem()},elapsedMs:performance.now()-start,peakRssBytes:process.resourceUsage().maxRSS*1024,sourceHashes,corpus:selected.map(({rgb,...c})=>({...c,pixelHash:hash(rgb)})),capacities,groups,detection:analyze(detection),edges};
await fs.writeFile(`${dir}${quick?'quick-':''}results.json`,JSON.stringify(report,null,2));
await fs.writeFile(`${dir}${quick?'quick-':''}raw.json`,JSON.stringify({rows,detection,costs},null,2));
console.log(JSON.stringify({cases:rows.length,edges:edges.length,elapsedMs:report.elapsedMs,groups,peakRssBytes:report.peakRssBytes},null,2));
if(rows.some(r=>r.outcome==='incorrect-authenticated-output')) process.exitCode=1;

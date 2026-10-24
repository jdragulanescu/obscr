// Question: does bounded adaptive transport carry complete authenticated messages?
// https://github.com/jdragulanescu/obscr/issues/35. Run: node run.mjs initial|repair|controls.
// Development pilot only. No tests, confirmation scoring, product settings or secret data.
import fs from 'node:fs/promises';
import { Worker,isMainThread,parentPort } from 'node:worker_threads';
import { createHash } from 'node:crypto';
import { createCodec,PASSWORD } from './codec.mjs';
import { parsePng,makePng } from './png.mjs';
import { equal } from './gate.mjs';
import { message,damage,errors,scores,changes } from './measure.mjs';
import * as old from './reference/codec.mjs';
import * as legacy from './controls.mjs';
const mode=process.argv[2]??'initial';
if(!['initial','repair','controls'].includes(mode))throw Error('Choose initial, repair or controls');
const kinds=['random-0.0001','random-0.001','random-0.01','patch','stripe'];
const root=new URL('.',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex');
if(isMainThread){
  const worker=new Worker(new URL(import.meta.url),{argv:[mode]});let deadline,rows=[];
  const arm=()=>{clearTimeout(deadline);deadline=setTimeout(()=>{worker.terminate();console.error('STOP: 30-second operation deadline');process.exitCode=1;},30000);};arm();
  worker.on('message',async event=>{
    if(event.operation){arm();return;}
    if(event.row){rows.push(event.row);console.log(JSON.stringify({id:event.row.id,profile:event.row.profile,size:event.row.size,outcome:event.row.outcome}));arm();}
    if(event.result){clearTimeout(deadline);const result={...event.result,rows,peakRssBytes:process.resourceUsage().maxRSS*1024};await fs.mkdir(new URL('evidence/',root),{recursive:true});await fs.writeFile(new URL(`evidence/${mode}.json`,root),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({mode,passed:result.passed,attempts:rows.length,elapsedMs:result.elapsedMs,peakRssBytes:result.peakRssBytes,failure:result.failure}));if(!result.passed)process.exitCode=1;}
  });
  worker.on('error',async error=>{clearTimeout(deadline);await fs.writeFile(new URL(`evidence/${mode}-failure.json`,root),JSON.stringify({error:String(error),rows},null,2));console.error(error);process.exitCode=1;});
  worker.on('exit',code=>{clearTimeout(deadline);if(code)process.exitCode=1;});
}else{
  const started=performance.now(),codec=await createCodec(await fs.readFile(new URL('codec.wasm',root)));
  const manifest=JSON.parse(await fs.readFile(new URL('photos/manifest.json',root),'utf8')),covers=[];
  for(const source of manifest){const bytes=await fs.readFile(new URL(`photos/${source.id}.png`,root));covers.push({id:source.id,photo:true,...await parsePng(bytes),fileHash:hash(bytes)});}
  if(mode==='initial')for(const name of ['flat','gradient']){const width=512,height=512,rgb=new Uint8Array(width*height*3);for(let i=0;i<rgb.length;i++)rgb[i]=name==='flat'?128:Math.floor(i/3)%width%256;covers.push({id:name,photo:false,width,height,rgb});}
  const profiles=mode==='controls'?[...old.profiles.map(p=>({name:'rgb-'+p.name,old:p})),...legacy.controls.map(p=>({name:p.name,legacy:p}))]:mode==='initial'?['raw','adaptive'].map(salt=>({name:`${salt}-none`,salt,parity:0,interleave:'none'})):JSON.parse(await fs.readFile(new URL('repair-selection.json',root),'utf8')).profiles;
  const tick=operation=>parentPort.postMessage({operation});
  let passed=true,failure;
  outer:for(const cover of covers)for(const profile of profiles)for(const size of [64,512,2048]){
    const msg=message(size),row={id:cover.id,photo:cover.photo,profile:profile.name,size,coverScores:scores(cover.rgb),damage:[]};
    tick('encode');const t=performance.now();let encoded;
    try{
      encoded=profile.old?await old.encode(cover.rgb,cover.width,cover.height,msg,profile.old,{password:PASSWORD}):profile.legacy?await legacy.controlEncode(cover,msg,profile.legacy,PASSWORD):await codec.encode(cover,msg,profile);
    }catch(error){row.outcome=String(error).toLowerCase().includes('capacity')?'capacity-rejection':'STOP';row.reason=String(error);row.encodeMs=performance.now()-t;parentPort.postMessage({row});if(row.outcome==='STOP'){passed=false;failure=row.reason;break outer;}continue;}
    row.encodeMs=performance.now()-t;row.overhead=encoded.overhead;row.placement=encoded.placement;row.changes=changes(cover.rgb,encoded.rgb);row.scores=scores(encoded.rgb);
    const image={rgb:encoded.rgb,width:cover.width,height:cover.height};tick('PNG rewrite');
    const png=await makePng(image),rewritten=await parsePng(png);row.outputBytes=png.length;row.pngSha256=hash(png);row.samplePreserving=equal(rewritten.rgb,encoded.rgb);
    const decode=async image=>profile.old?old.decode(image.rgb,image.width,image.height,profile.old,PASSWORD):profile.legacy?legacy.controlDecode(image.rgb,image.width,image.height,profile.legacy,PASSWORD):codec.decode(image,profile,PASSWORD);
    tick('decode');const td=performance.now(),decoded=await decode(rewritten);row.decodeMs=performance.now()-td;row.outcome=decoded.outcome;row.exact=decoded.outcome==='exact-ready'&&equal(decoded.message,msg);
    if(!row.samplePreserving||!row.exact){row.outcome='STOP';passed=false;failure='Admitted unchanged PNG failed exact authenticated recovery';parentPort.postMessage({row});break outer;}
    if(cover.photo){
      if(cover.id===manifest[0].id&&size===64&&!profile.old&&!profile.legacy){await fs.writeFile(new URL(`evidence/cli-${profile.name}.png`,root),png);}
      for(const kind of kinds)for(const seed of mode==='controls'?[35]:[35,3501]){
        tick('damage decode');const damaged=damage(image,kind,seed),diagnostics={...damaged.damage};
        if(!profile.old&&!profile.legacy){diagnostics.salt=errors(encoded.salt,codec.saltRead(damaged.rgb,profile));diagnostics.header=errors(encoded.headerCode,codec.read(damaged.rgb,encoded.headerPositions,encoded.headerCode.length));diagnostics.payload=errors(encoded.payloadCode,codec.read(damaged.rgb,encoded.payloadPositions,encoded.payloadCode.length));}
        const t=performance.now(),answer=await decode(damaged);diagnostics.decodeMs=performance.now()-t;diagnostics.outcome=answer.outcome;diagnostics.stage=answer.diagnosticStage;diagnostics.exact=answer.outcome==='exact-ready'&&equal(answer.message,msg);
        if(answer.outcome==='exact-ready'&&!diagnostics.exact){passed=false;failure='Incorrect authenticated plaintext';row.outcome='STOP';row.damage.push(diagnostics);parentPort.postMessage({row});break outer;}
        row.damage.push(diagnostics);
      }
    }
    parentPort.postMessage({row});
  }
  parentPort.postMessage({result:{mode,passed,failure,runtime:process.version,platform:process.platform,arch:process.arch,elapsedMs:performance.now()-started,wasmMemoryBytes:codec.memoryBytes(),damageKinds:kinds,sourceCount:manifest.length,scope:'development observations, not confirmation'}});
}

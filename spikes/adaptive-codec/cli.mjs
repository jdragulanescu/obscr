// Question: can CLI exchange adaptive authenticated PNG messages with the browser?
// https://github.com/jdragulanescu/obscr/issues/35. Synthetic data only.
// encode input.png output.png text raw|adaptive [parity] [interleave]
// decode input.png raw|adaptive [parity] [interleave] [password]
import fs from 'node:fs/promises';
import { Worker,isMainThread,parentPort } from 'node:worker_threads';
import { createHash } from 'node:crypto';
import { createCodec,PASSWORD } from './codec.mjs';
import { parsePng,makePng } from './png.mjs';
const args=process.argv.slice(2);
if(isMainThread){
  const worker=new Worker(new URL(import.meta.url),{argv:args});
  const timeout=setTimeout(()=>{worker.terminate();console.error('Operation timed out; no output released');process.exitCode=2;},30000);
  process.once('SIGINT',()=>{clearTimeout(timeout);worker.terminate();console.error('Cancelled; no output released');process.exitCode=130;});
  worker.on('message',async({result,png,output})=>{clearTimeout(timeout);if(png)await fs.writeFile(output,png);console.log(JSON.stringify({...result,peakRssBytes:process.resourceUsage().maxRSS*1024}));if(!['encoded','exact-ready'].includes(result.outcome))process.exitCode=2;});
  worker.on('error',error=>{clearTimeout(timeout);console.error(String(error));process.exitCode=2;});
  worker.on('exit',code=>{clearTimeout(timeout);if(code&&process.exitCode===undefined)process.exitCode=2;});
}else{
  const [action,input,...rest]=args,start=performance.now();
  if(!input||!['encode','decode'].includes(action))throw Error('Usage: encode input.png output.png text raw|adaptive [parity] [interleave] | decode input.png raw|adaptive [parity] [interleave] [password]');
  if((await fs.stat(input)).size>16*1024*1024)throw Error('Source-file bound');
  const image=await parsePng(await fs.readFile(input)),codec=await createCodec(await fs.readFile(new URL('codec.wasm',import.meta.url)));
  if(action==='encode'){
    const [output,text,salt,parity='0',interleave='none']=rest;
    if(!output||text===undefined)throw Error('Output and text required');
    const message=new TextEncoder().encode(text),encoded=await codec.encode(image,message,{salt,parity:Number(parity),interleave});
    image.rgb=null; // Release the cover before the PNG writer allocates its scanline buffer.
    const png=await makePng(encoded);
    parentPort.postMessage({output,png,result:{outcome:'encoded',output,usefulBytes:message.length,overhead:encoded.overhead,elapsedMs:performance.now()-start,wasmMemoryBytes:codec.memoryBytes()}});
  }else{
    const [salt,parity='0',interleave='none',password=PASSWORD]=rest,decoded=await codec.decode(image,{salt,parity:Number(parity),interleave},password);
    parentPort.postMessage({result:{...decoded,message:decoded.message?new TextDecoder('utf-8',{fatal:true}).decode(decoded.message):undefined,messageHash:decoded.message?createHash('sha256').update(decoded.message).digest('hex'):undefined,elapsedMs:performance.now()-start,wasmMemoryBytes:codec.memoryBytes()}});
  }
}

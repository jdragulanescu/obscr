// Disposable authenticated file exchange worker; owns the KDF, PNG and codec state.
import { createCodec,PASSWORD } from './codec.bundle.js';
import { parsePng,makePng } from './png.mjs';
self.onmessage=async({data})=>{
  const start=performance.now();
  try{
    const image=await parsePng(new Uint8Array(data.png)),response=await fetch('./codec.wasm');if(!response.ok)throw Error('WASM load');
    const codec=await createCodec(await response.arrayBuffer());
    if(data.action==='encode'){
      const bytes=new TextEncoder().encode(data.text),encoded=await codec.encode(image,bytes,data.profile,{password:data.password||PASSWORD,compressed:Boolean(data.compressed)});
      image.rgb=null; // Release the cover before the PNG writer allocates its scanline buffer.
      const png=await makePng(encoded);
      self.postMessage({result:{outcome:'encoded',usefulBytes:bytes.length,overhead:encoded.overhead,elapsedMs:performance.now()-start,wasmMemoryBytes:codec.memoryBytes()},png:png.buffer},[png.buffer]);
    }else{
      const answer=await codec.decode(image,data.profile,data.password||PASSWORD);
      self.postMessage({result:{...answer,message:answer.message?new TextDecoder('utf-8',{fatal:true}).decode(answer.message):undefined,elapsedMs:performance.now()-start,wasmMemoryBytes:codec.memoryBytes()}});
    }
  }catch(error){self.postMessage({result:{outcome:'safe-failure',error:String(error),elapsedMs:performance.now()-start}});}
};

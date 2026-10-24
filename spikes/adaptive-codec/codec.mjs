// Disposable complete message transport; https://github.com/jdragulanescu/obscr/issues/35.
// Controls are explicit pre-agreed experimental profiles, never decoder fallback.
import { deriveKeys } from './reference/key-chain.mjs';
import { rsEncode, rsDecode } from './reference/rs.mjs';
import { bootstrap, createPlacement, MAX_POSITIONS, BOOTSTRAP } from './placement.mjs';
import { costs } from './costs.mjs';
import { loadCodec } from './gate.mjs';
import { geometry } from './png.mjs';
export const PASSWORD='synthetic-adaptive-codec-password';
const MAX_PLAIN=1024*1024, HEADER=32;
const concat=(...parts)=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;};
const fresh=n=>crypto.getRandomValues(new Uint8Array(n));
function profile(p){if(!p||!['raw','adaptive'].includes(p.salt)||![0,16,32,64].includes(p.parity)||!['none','byte-round-robin'].includes(p.interleave))throw Error('Unknown explicit experiment profile');return p;}
function headerBytes(p){return HEADER+(p.parity?16:0);}
function codedLength(n,p){return n+(p.parity?Math.ceil(n/(255-p.parity))*p.parity:0);}
function bodySamples(samples,p,n){const available=Math.min(MAX_POSITIONS,samples-BOOTSTRAP)-headerBytes(p)*512;return Math.min(available,n*512);}
export function capacity(samples,p){profile(p);const n=bodySamples(samples,p,655);return Math.floor(Math.fround(Math.fround(n)*Math.fround(.02))/8);}
function lengths(n,parity){const result=[];for(let left=n;left>0;){const size=Math.min(left,255-parity);result.push(size+parity);left-=size;}if(result.length>4)throw Error('Repair block bound');return result;}
function protect(bytes,p){if(!p.parity)return bytes;const parts=[],k=255-p.parity;for(let i=0;i<bytes.length;i+=k)parts.push(rsEncode(bytes.subarray(i,i+k),p.parity));if(parts.length>4)throw Error('Repair block bound');if(p.interleave==='none')return concat(...parts);const out=new Uint8Array(parts.reduce((n,b)=>n+b.length,0));let at=0;for(let i=0;i<255;i++)for(const b of parts)if(i<b.length)out[at++]=b[i];return out;}
function unprotect(bytes,p,plainLength){
  if(!p.parity)return bytes;
  const lens=lengths(plainLength,p.parity),parts=lens.map(n=>new Uint8Array(n));let at=0;
  if(p.interleave==='none'){for(const b of parts){b.set(bytes.subarray(at,at+b.length));at+=b.length;}}
  else for(let i=0;i<255;i++)for(const b of parts)if(i<b.length)b[i]=bytes[at++];
  return concat(...parts.map(b=>rsDecode(b,p.parity)));
}
async function transform(bytes,compress,limit){const reader=new Blob([bytes]).stream().pipeThrough(compress?new CompressionStream('gzip'):new DecompressionStream('gzip')).getReader(),parts=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('Compression/decompression bound');parts.push(value);}return concat(...parts);}catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}}
function aad(salt,header,width,height,p){const dims=new Uint8Array(9),v=new DataView(dims.buffer);v.setUint32(0,width);v.setUint32(4,height);dims[8]=p.salt==='adaptive'?1:0;return concat(salt,header,dims);}
function wipe(keys){keys?.root.fill(0);keys?.encryptionBytes.fill(0);keys?.placementBytes.fill(0);}
export async function createCodec(wasm){
  const core=await loadCodec(wasm);
  function gather(rgb,ids){const samples=core.samples();for(let i=0;i<ids.length;i++)samples[i]=rgb[ids[i]];}
  function read(rgb,ids,length){gather(rgb,ids);const status=core.api.decode(ids.length,length);if(status<0)throw Error(`STC extraction ${status}`);return core.payload().slice(0,length);}
  function put(rgb,ids,bytes,map){gather(rgb,ids);const values=core.costs();for(let i=0;i<ids.length;i++)values[i]=map[Math.floor(ids[i]/3)];core.payload().set(bytes);const status=core.api.encode(ids.length,bytes.length);if(status<0)throw Error(`STC embedding ${status}`);const samples=core.samples();for(let i=0;i<ids.length;i++)rgb[ids[i]]=samples[i];return status;}
  function saltRead(rgb,p){const ids=bootstrap(rgb.length);if(p.salt==='adaptive')return read(rgb,ids,16);const salt=new Uint8Array(16);for(let i=0;i<128;i++)salt[i>>3]|=(rgb[ids[i]]&1)<<(7-i%8);return salt;}
  let busy=false;
  return {
    read, saltRead,
    memoryBytes:()=>core.api.memory.buffer.byteLength,
    async encode(image,message,settings,{password=PASSWORD,compressed=false}={}){
      if(busy)throw Error('One active operation');busy=true;let keys;
      try{
        const p=profile(settings),{rgb,width,height}=image;geometry(width,height);
        if(!(rgb instanceof Uint8Array)||rgb.length!==width*height*3||!(message instanceof Uint8Array)||message.length>MAX_PLAIN||typeof compressed!=='boolean')throw Error('Input bound');
        const stored=compressed?await transform(message,true,655):message,n=codedLength(stored.length+16,p);
        if(n>655||n>capacity(rgb.length,p))throw Error('All-overhead capacity rejection');
        const salt=fresh(16),nonce=fresh(12),header=new Uint8Array(HEADER),view=new DataView(header.buffer);
        header.set(nonce);view.setUint32(12,stored.length);view.setUint32(16,message.length);header[20]=p.parity;header[21]=p.interleave==='byte-round-robin'?1:0;header[22]=Number(compressed);
        keys=await deriveKeys(salt,password);
        const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:aad(salt,header,width,height,p),tagLength:128},keys.encryption,stored));
        const headerCode=p.parity?rsEncode(header,16):header,payloadCode=protect(encrypted,p),locations=createPlacement(rgb.length,keys.placement);
        const headerPositions=await locations.take(headerCode.length*512),payloadPositions=await locations.take(bodySamples(rgb.length,p,payloadCode.length));
        const saltPositions=bootstrap(rgb.length),map=costs(rgb,width,height),result=rgb.slice();let saltChanged=0;
        if(p.salt==='adaptive')saltChanged=put(result,saltPositions,salt,map);
        else for(let i=0;i<128;i++){const at=saltPositions[i],target=(salt[i>>3]>>>(7-i%8))&1;saltChanged+=(result[at]&1)!==target;result[at]=(result[at]&254)|target;}
        const headerChanged=put(result,headerPositions,headerCode,map),bodyChanged=put(result,payloadPositions,payloadCode,map);
        return {rgb:result,width,height,profile:p,salt,headerCode,payloadCode,saltPositions,headerPositions,payloadPositions,placement:locations.diagnostics(),changed:{salt:saltChanged,header:headerChanged,payload:bodyChanged},overhead:{salt:16,header:headerCode.length,nonce:12,tag:16,repair:payloadCode.length-encrypted.length,stored:stored.length,useful:message.length,total:16+headerCode.length+payloadCode.length,padding:0,bootstrapReservedSamples:8192}};
      }finally{wipe(keys);busy=false;}
    },
    async decode(image,settings,password=PASSWORD){
      if(busy)throw Error('One active operation');busy=true;let keys,stage='input';
      try{
        const p=profile(settings),{rgb,width,height}=image;geometry(width,height);if(!(rgb instanceof Uint8Array)||rgb.length!==width*height*3)throw Error('RGB bound');
        stage='salt';const salt=saltRead(rgb,p);stage='kdf';keys=await deriveKeys(salt,password);
        const locations=createPlacement(rgb.length,keys.placement);stage='header';
        const headerPositions=await locations.take(headerBytes(p)*512),code=read(rgb,headerPositions,headerBytes(p)),header=p.parity?rsDecode(code,16):code,view=new DataView(header.buffer,header.byteOffset,header.byteLength);
        const storedLength=view.getUint32(12),plainLength=view.getUint32(16),n=codedLength(storedLength+16,p);
        if(header[20]!==p.parity||header[21]!==Number(p.interleave==='byte-round-robin')||header[22]>1||header.subarray(23).some(v=>v!==0)||plainLength>MAX_PLAIN||n>655||n>capacity(rgb.length,p)||(!header[22]&&plainLength!==storedLength))throw Error('Protected header bounds');
        stage='payload';const payloadPositions=await locations.take(bodySamples(rgb.length,p,n)),payloadCode=read(rgb,payloadPositions,n),encrypted=unprotect(payloadCode,p,storedLength+16);
        stage='authentication';const stored=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:header.subarray(0,12),additionalData:aad(salt,header,width,height,p),tagLength:128},keys.encryption,encrypted));
        stage='decompression';const message=header[22]?await transform(stored,false,plainLength):stored;if(message.length!==plainLength)throw Error('Plaintext length');
        return {outcome:'exact-ready',message,placement:locations.diagnostics()};
      }catch(error){return {outcome:'safe-failure',diagnosticStage:stage,reason:'Input, password, bounds, repair or authentication failure'};}
      finally{wipe(keys);busy=false;}
    }
  };
}

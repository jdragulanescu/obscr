// Disposable hostile-frame observations; synthetic fixtures only, no product tests.
import fs from 'node:fs/promises';
import { createCodec,PASSWORD } from './codec.mjs';
import { loadCodec } from './gate.mjs';
import { parsePng,makePng } from './png.mjs';
import { deriveKeys } from './reference/key-chain.mjs';
const root=new URL('.',import.meta.url),checks=[],wasm=await fs.readFile(new URL('codec.wasm',root)),codec=await createCodec(wasm),core=await loadCodec(wasm);
const source=await fs.readFile(new URL('photos/vandusen-2015.png',root)),image=await parsePng(source);
function check(name,passed,detail){checks.push({name,passed,detail});if(!passed)throw Error('STOP '+name);}
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return(c^0xffffffff)>>>0;}
function ihdr(bytes,width,height){const out=bytes.slice(),v=new DataView(out.buffer,out.byteOffset,out.byteLength);v.setUint32(16,width);v.setUint32(20,height);v.setUint32(29,crc(out.subarray(12,29)));return out;}
async function refusal(bytes){try{await parsePng(bytes);return null;}catch(error){return String(error);}}
const tooWide=await refusal(ihdr(source,1025,512));check('Valid-CRC PNG over dimension',tooWide?.includes('geometry bound'),tooWide);
const bomb=await refusal(ihdr(source,1,1));check('PNG inflated raster exceeds declared bound',bomb?.includes('inflate/output bound'),bomb);
function put(rgb,ids,bytes){const samples=core.samples();for(let i=0;i<ids.length;i++)samples[i]=rgb[ids[i]];core.costs().fill(1);core.payload().set(bytes);if(core.api.encode(ids.length,bytes.length)<0)throw Error('Fixture STC failure');for(let i=0;i<ids.length;i++)rgb[ids[i]]=samples[i];}
for(const salt of ['raw','adaptive']){
  const p={salt,parity:0,interleave:'none'},message=new TextEncoder().encode('bounded-output '.repeat(4000)),encoded=await codec.encode(image,message,p,{compressed:true});
  const malformed={...encoded,rgb:encoded.rgb.slice()},header=encoded.headerCode.slice();new DataView(header.buffer).setUint32(12,0xffffffff);put(malformed.rgb,encoded.headerPositions,header);
  const rejected=await codec.decode(malformed,p);check(salt+' image-supplied coded length rejected before body work',rejected.outcome==='safe-failure'&&rejected.diagnosticStage==='header'&&!rejected.message,rejected);
  const keys=await deriveKeys(encoded.salt,PASSWORD),dims=new Uint8Array(9),v=new DataView(dims.buffer);v.setUint32(0,image.width);v.setUint32(4,image.height);dims[8]=salt==='adaptive'?1:0;
  const aad=h=>{const a=new Uint8Array(16+h.length+9);a.set(encoded.salt);a.set(h,16);a.set(dims,16+h.length);return a;};
  const stored=await crypto.subtle.decrypt({name:'AES-GCM',iv:encoded.headerCode.subarray(0,12),additionalData:aad(encoded.headerCode),tagLength:128},keys.encryption,encoded.payloadCode);
  const shortHeader=encoded.headerCode.slice();new DataView(shortHeader.buffer).setUint32(16,1);
  // Same synthetic stored bytes; authenticate a deliberately false output length.
  const maliciousBody=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:shortHeader.subarray(0,12),additionalData:aad(shortHeader),tagLength:128},keys.encryption,stored));
  const decompressionBomb={...encoded,rgb:encoded.rgb.slice()};put(decompressionBomb.rgb,encoded.headerPositions,shortHeader);put(decompressionBomb.rgb,encoded.payloadPositions,maliciousBody);
  const result=await codec.decode(decompressionBomb,p);check(salt+' authenticated decompression exceeds declared output',result.outcome==='safe-failure'&&result.diagnosticStage==='decompression'&&!result.message,result);
  keys.root.fill(0);keys.encryptionBytes.fill(0);keys.placementBytes.fill(0);
}
const evidence={passed:checks.every(c=>c.passed),checks,runtime:process.version,peakRssBytes:process.resourceUsage().maxRSS*1024};await fs.writeFile(new URL('evidence/frame-bounds.json',root),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));

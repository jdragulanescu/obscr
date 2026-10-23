// Independent Node primitives check against the Web Crypto candidate.
// Synthetic vectors only. https://github.com/jdragulanescu/obscr/issues/28
import fs from 'node:fs/promises';
import {pbkdf2Sync,hkdfSync,createCipheriv,createDecipheriv} from 'node:crypto';
import {profiles,encode,PASSWORD} from './codec.mjs';
import {rsDecode} from './rs.mjs';
const rows=[],width=256,height=256,rgb=new Uint8Array(width*height*3).fill(128),plain=Uint8Array.from({length:4096},(_,i)=>i%251);
for(const p of profiles){
 const e=await encode(rgb,width,height,plain,p,{seed:`chain/${p.name}`}),salt=rsDecode(e.saltCodeword,64),meta=rsDecode(e.metadataCodeword,64);
 const root=pbkdf2Sync(PASSWORD,salt,100000,32,'sha256'),enc=Buffer.from(hkdfSync('sha256',root,Buffer.alloc(32),'obscr/keys/1/encryption',32)),map=Buffer.from(hkdfSync('sha256',root,Buffer.alloc(32),'obscr/keys/1/placement',32));
 const dims=Buffer.alloc(8);dims.writeUInt32BE(width);dims.writeUInt32BE(height,4);const cipher=createDecipheriv('aes-256-gcm',enc,meta.subarray(0,12),{authTagLength:16});cipher.setAAD(Buffer.concat([salt,meta,dims]));cipher.setAuthTag(e.ciphertext.subarray(-16));const decoded=Buffer.concat([cipher.update(e.ciphertext.subarray(0,-16)),cipher.final()]);
 const groups=Math.floor(rgb.length/8),reserved=new Set(Array.from({length:80},(_,i)=>Math.floor(i*groups/80))),pool=[];
 for(let g=0;g<groups;g++)if(!reserved.has(g)){if(p.mapping==='grouped')pool.push(g);else for(let b=0;b<8;b++)pool.push(g*8+b)}
 const streamCipher=createCipheriv('aes-256-ctr',map,Buffer.alloc(16));const stream=streamCipher.update(Buffer.alloc(pool.length*8+16384));let offset=0,rejections=0,matches=true;
 for(const positions of [...e.metadataPositions,...e.payloadPositions]){
   const draws=p.mapping==='grouped'?1:8;
   for(let bit=0;bit<draws;bit++){const bound=pool.length,limit=Math.floor(4294967296/bound)*bound;let x;do{x=stream.readUInt32LE(offset);offset+=4;if(x>=limit)rejections++}while(x>=limit);const j=x%bound,value=pool[j];pool[j]=pool[bound-1];pool.pop();if(p.mapping==='grouped'){for(let b=0;b<8;b++)matches&&=positions[b]===value*8+b}else matches&&=positions[bit]===value}
 }
 rows.push({profile:p.name,plaintextExact:decoded.length===plain.length&&decoded.every((x,i)=>x===plain[i]),positionMatches:matches,streamBytesConsumed:offset,crosses65536ByteChunk:offset>65536,rejections,salt:Buffer.from(salt).toString('hex'),root:root.toString('hex'),encryptionKey:enc.toString('hex'),placementKey:map.toString('hex'),streamPrefix:stream.subarray(0,64).toString('hex'),firstPositions:e.metadataPositions.slice(0,3).map(x=>Array.from(x))});
}
await fs.writeFile(new URL('./evidence/key-chain.json',import.meta.url),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.map(({profile,plaintextExact,positionMatches,streamBytesConsumed,crosses65536ByteChunk,rejections})=>({profile,plaintextExact,positionMatches,streamBytesConsumed,crosses65536ByteChunk,rejections}))));

// Disposable adversarial observations, not a production test suite.
// https://github.com/jdragulanescu/obscr/issues/28
import fs from 'node:fs/promises';
import {encode,decode,profiles,PASSWORD} from './codec.mjs';
import {rsEncode,rsDecode} from './rs.mjs';
import {covers} from './corpus.mjs';
const c=(await covers())[0], plain=new TextEncoder().encode('Authenticated, not merely repaired.');
const rows=[];
function put(rgb,bytes,positions){for(let i=0;i<bytes.length;i++)for(let b=0;b<8;b++)rgb[positions[i][b]]=(rgb[positions[i][b]]&254)|((bytes[i]>>(7-b))&1)}
async function record(p,name,rgb){const r=await decode(rgb,c.width,c.height,p);rows.push({profile:p.name,case:name,outcome:r.outcome,plaintextReleased:r.message!==undefined})}
for(const p of profiles){
  const e=await encode(c.rgb,c.width,c.height,plain,p,{seed:`adversarial/${p.name}`});
  const changed=e.rgb.slice(), word=rsDecode(e.codewords[0],p.parity);word[0]^=1;put(changed,rsEncode(word,p.parity),e.payloadPositions);
  await record(p,'valid-repair-code-but-modified-ciphertext',changed);
  const changedMeta=e.rgb.slice(), metadata=rsDecode(e.metadataCodeword,64);metadata[23]^=1;put(changedMeta,rsEncode(metadata,64),e.metadataPositions);
  await record(p,'valid-repair-code-but-modified-authenticated-metadata',changedMeta);
  const truncated=e.rgb.slice(), short=rsDecode(e.metadataCodeword,64), view=new DataView(short.buffer);view.setUint32(12,plain.length-8);view.setUint32(16,plain.length-8);put(truncated,rsEncode(short,64),e.metadataPositions);put(truncated,rsEncode(e.ciphertext.subarray(0,e.ciphertext.length-8),p.parity),e.payloadPositions);
  await record(p,'shortened-authentication-tag-with-valid-repair-codes',truncated);
  const oversized=e.rgb.slice(), huge=rsDecode(e.metadataCodeword,64);new DataView(huge.buffer).setUint32(12,0xffffffff);put(oversized,rsEncode(huge,64),e.metadataPositions);
  await record(p,'valid-repair-code-with-excessive-length',oversized);
  for(const password of ['', '\ud800', 'é'.repeat(513)]){const r=await decode(e.rgb,c.width,c.height,p,password);rows.push({profile:p.name,case:'invalid-password-bytes',codeUnits:password.length,outcome:r.outcome,plaintextReleased:r.message!==undefined})}
  const large=new Uint8Array(1048576).fill(65);const compressed=await encode(c.rgb,c.width,c.height,large,p,{compressed:true,seed:`limit/${p.name}`});const result=await decode(compressed.rgb,c.width,c.height,p,PASSWORD);
  rows.push({profile:p.name,case:'max-plaintext-compressed',storedBytes:compressed.storedBytes,exact:result.message?.length===large.length&&result.message.every(x=>x===65)});
  try{await encode(c.rgb,c.width,c.height,new Uint8Array(1048577),p,{compressed:true});rows.push({profile:p.name,case:'over-plaintext-limit',rejected:false})}catch{rows.push({profile:p.name,case:'over-plaintext-limit',rejected:true})}
}
await fs.writeFile(new URL('./evidence/authentication-boundaries.json',import.meta.url),JSON.stringify(rows,null,2));
console.log(JSON.stringify({cases:rows.length,unsafe:rows.filter(r=>r.plaintextReleased||r.rejected===false||r.exact===false)}));

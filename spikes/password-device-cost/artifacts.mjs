// Record installed artifact identities without claiming source reproducibility.
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const packages=[];
for(const name of ['libsodium-wrappers-sumo','libsodium-sumo','@noble/hashes','esbuild','@esbuild/darwin-arm64']) {
  const root='node_modules/'+name;
  let metadata;try{metadata=JSON.parse(await readFile(root+'/package.json','utf8'));}catch{continue;}
  const files=[];
  async function visit(path){for(const entry of await readdir(root+'/'+path,{withFileTypes:true})){
    const relative=path?path+'/'+entry.name:entry.name;
    if(entry.isDirectory())await visit(relative);
    else if(entry.isFile()){const bytes=await readFile(root+'/'+relative);files.push({path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
  }}
  await visit('');files.sort((a,b)=>a.path.localeCompare(b.path));
  packages.push({name,version:metadata.version,license:metadata.license,resolved:lock.packages[root]?.resolved,integrity:lock.packages[root]?.integrity,files});
}
await mkdir('results',{recursive:true});
await writeFile('results/artifacts.json',JSON.stringify({recordedAt:new Date().toISOString(),install:'npm install --ignore-scripts --no-audit --no-fund; npm verifies registry integrity during extraction',scope:'Installed bytes and lock metadata only; no signature, provenance or reproducible-source-build verification',packages},null,2)+'\n');
console.log('Recorded '+packages.length+' pinned installed artifacts');

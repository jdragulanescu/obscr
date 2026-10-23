// Build only the disposable experiment, never the production application.
import {build} from 'esbuild';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('dist',{recursive:true});
const result=await build({entryPoints:{browser:'browser.mjs',worker:'worker.mjs'},outdir:'dist',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',external:['node:*'],metafile:true,minify:true,legalComments:'eof'});
for(const name of ['index.html','style.css'])await copyFile(name,`dist/${name}`);
const notices = ['NATIVE-NOTICES.txt','node_modules/libsodium-wrappers-sumo/LICENSE','node_modules/libsodium-sumo/LICENSE','node_modules/@noble/hashes/LICENSE','node_modules/esbuild/LICENSE.md'];
await writeFile('dist/THIRD-PARTY-NOTICES.txt',(await Promise.all(notices.map(async p=>`--- ${p} ---\n${await readFile(p,'utf8')}`))).join('\n\n'));
const assets=['./',...Object.keys(result.metafile.outputs).map(p=>'./'+p.slice(5)),'./index.html','./style.css','./THIRD-PARTY-NOTICES.txt'];
const hash=createHash('sha256');for(const file of assets.filter(p=>p!=='./'))hash.update(await readFile('dist/'+file.slice(2)));
const version=hash.digest('hex').slice(0,16);
await writeFile('dist/sw.js',`const CACHE='password-cost-${version}';const ASSETS=${JSON.stringify(assets)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('password-cost-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(new URL(e.request.url).origin===self.location.origin)e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});`);
await mkdir('results',{recursive:true});
await writeFile('results/build-manifest.json',JSON.stringify({version,outputs:result.metafile.outputs,assets},null,2)+'\n');
console.log(`Built ${assets.length} offline assets, version ${version}`);

// Disposable CLI for https://github.com/jdragulanescu/obscr/issues/28.
// encode input.png output.png text [profile]; decode input.png [profile] [password].
import fs from 'node:fs/promises';
import { encode, decode, profiles, PASSWORD } from './codec.mjs';
import { parsePng, png, hash } from './controls.mjs';
const [command,input,...args]=process.argv.slice(2);
if(!input || !['encode','decode'].includes(command)) throw Error('Usage: encode input.png output.png text [profile] | decode input.png [profile] [password]');
const start=performance.now(), image=parsePng(await fs.readFile(input));
if(command==='encode') {
  const [output,text,profileName='grouped-p64']=args;
  const p=profiles.find(p=>p.name===profileName); if(!p||text===undefined||!output) throw Error('Invalid encode arguments');
  const message=new TextEncoder().encode(text);
  const result=await encode(image.rgb,image.width,image.height,message,p,{seed:'cli-exchange-synthetic'});
  await fs.writeFile(output,png(result.rgb,image.width,image.height));
  console.log(JSON.stringify({outcome:'encoded',output,profile:p.name,plainBytes:message.length,codedBytes:result.codedBytes,elapsedMs:performance.now()-start,peakRssBytes:process.resourceUsage().maxRSS*1024}));
} else {
  const [profileName='grouped-p64',password=PASSWORD]=args;
  const p=profiles.find(p=>p.name===profileName); if(!p) throw Error('Unknown experimental profile');
  const result=await decode(image.rgb,image.width,image.height,p,password);
  console.log(JSON.stringify({...result,message:result.message?new TextDecoder('utf-8',{fatal:true}).decode(result.message):undefined,messageHash:result.message?hash(result.message):undefined,elapsedMs:performance.now()-start,peakRssBytes:process.resourceUsage().maxRSS*1024}));
  if(result.outcome!=='exact-ready') process.exitCode=2;
}

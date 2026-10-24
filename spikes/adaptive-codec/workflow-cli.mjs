// Real CLI process observations; no mocked engine or production tests.
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
const root=new URL('.',import.meta.url),rows=[];
function run(args,cancel=false){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,['cli.mjs',...args],{cwd:root});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);const timer=cancel?setTimeout(()=>child.kill('SIGINT'),150):null;child.on('close',(code,signal)=>{clearTimeout(timer);resolve({args,code,signal,stdout,stderr});});});}
for(const salt of ['raw','adaptive']){
  const result=await run(['encode','photos/vandusen-2015.png',`evidence/cli-512-${salt}.png`,'C'.repeat(512),salt,'16','byte-round-robin']);
  result.passed=result.code===0&&JSON.parse(result.stdout).outcome==='encoded';rows.push(result);if(!result.passed)throw Error('STOP CLI 512 encode');
  for(const stem of ['browser-to-cli','browser-rewrite']){
    const row=await run(['decode',`evidence/${stem}-${salt}.png`,salt]);const out=JSON.parse(row.stdout);row.passed=row.code===0&&out.message==='Browser to CLI: café é — exact bytes';rows.push(row);if(!row.passed)throw Error('STOP CLI cross-runtime recovery');
  }
}
const cancelled=await run(['encode','photos/vandusen-2015.png','.scratch/cancelled.png','X'.repeat(512),'adaptive','16','byte-round-robin'],true);
let outputExists=true;try{await fs.stat(new URL('.scratch/cancelled.png',root));}catch(error){if(error.code==='ENOENT')outputExists=false;else throw error;}
cancelled.passed=cancelled.code===130&&cancelled.stdout===''&&cancelled.stderr.includes('Cancelled; no output released')&&!outputExists;rows.push(cancelled);
const wrong=await run(['decode','evidence/cli-to-browser-adaptive.png','adaptive','0','none','wrong-password']);const answer=JSON.parse(wrong.stdout);wrong.passed=wrong.code===2&&answer.outcome==='safe-failure'&&!('message'in answer);rows.push(wrong);
const result={passed:rows.every(r=>r.passed),runtime:process.version,rows};await fs.writeFile(new URL('evidence/cli-workflows.json',root),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;

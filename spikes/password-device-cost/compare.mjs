// Compare fixed public vector chains and summarize observed samples; no device extrapolation.
import {readFile,writeFile} from 'node:fs/promises';
const load=async name=>JSON.parse(await readFile(name,'utf8'));
const node=await load('results/node-vectors.json');
const nodeRun=await load('results/node-measurements.json');
const browser=await load(process.argv[2]||'results/chromium.json');
const fields=['profileId','case','passwordHex','saltHex','rootHex','encryptionHex','placementHex','streamHex','N','demand','positions','draws','rejections'];
if(!browser.vectors || browser.vectors.chains.length!==node.chains.length)throw new Error('Missing browser vector chains');
for(let i=0;i<node.chains.length;i++)for(const field of fields)if(JSON.stringify(node.chains[i][field])!==JSON.stringify(browser.vectors.chains[i][field]))throw new Error(`Chain ${i} differs at ${field}`);
if(JSON.stringify(node.forced)!==JSON.stringify(browser.vectors.forced)||JSON.stringify(node.counterCarry)!==JSON.stringify(browser.vectors.counterCarry)||JSON.stringify(node.gcm)!==JSON.stringify(browser.vectors.gcm))throw new Error('Boundary/GCM vectors differ');
const results={chainAgreement:true,chains:node.chains.length,nodeChecks:node.checks.length,browserChecks:browser.vectors.checks.length,rows:[]};
for(const profile of nodeRun.profiles){
 const row={profileId:profile.id};
 for(const [runtime,run] of [['node',nodeRun],['chromium',browser.measurements]]){
  const samples=run.samples.filter(s=>s.profileId===profile.id);
  for(const mode of ['cold','warm']){const timings=samples.filter(s=>s.mode===mode).map(s=>s.keyMs);row[runtime+mode+'MaxMs']=Math.max(...timings);row[runtime+mode+'MinMs']=Math.min(...timings);}
  row[runtime+'MaxContextMs']=Math.max(...samples.map(s=>s.totalMs));
  row[runtime+'MaxHeartbeatGapMs']=Math.max(...samples.map(s=>s.maxHeartbeatGapMs));
  if(runtime==='node')row.nodeMaxSampledRssBytes=Math.max(...samples.map(s=>s.sampledPeakMemory.rss));
 }
 results.rows.push(row);
}
await writeFile('results/comparison.json',JSON.stringify(results,null,2)+'\n');
console.log(`Equal public chains: ${results.chains}; checks Node ${results.nodeChecks}, browser ${results.browserChecks}`);
console.log('| Profile | Node cold max ms | Node warm max ms | Chromium cold max ms | Chromium warm max ms | Node sampled RSS max MiB |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: |');
for(const r of results.rows)console.log(`| ${r.profileId} | ${r.nodecoldMaxMs.toFixed(1)} | ${r.nodewarmMaxMs.toFixed(1)} | ${r.chromiumcoldMaxMs.toFixed(1)} | ${r.chromiumwarmMaxMs.toFixed(1)} | ${(r.nodeMaxSampledRssBytes/1048576).toFixed(1)} |`);

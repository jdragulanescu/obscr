// Which KDF profiles fit the device budget? https://github.com/jdragulanescu/obscr/issues/27
// Controlled by the browser or Node runner. Public experiment inputs only.
let send, subscribe;
if(typeof process!=='undefined' && process.versions?.node) {
  const {parentPort}=await import('node:worker_threads'); send=d=>parentPort.postMessage(d); subscribe=f=>parentPort.on('message',f);
} else {send=d=>postMessage(d);subscribe=f=>{onmessage=e=>f(e.data);};}
let pixels;
subscribe(async data=>{
  try {
    send({type:'received'});
    const {validateRequest,derive,positions}=await import('./core.mjs');
    const req=validateRequest(data.req);
    if(data.injectAllocationFailure) throw new RangeError('injected allocation failure');
    if(data.pixels) pixels=data.pixels;
    if(!pixels || pixels.byteLength!==req.width*req.height*4) throw new Error('pixel buffer missing');
    send({type:'deriving'});
    const keys=await derive(req);
    send({type:'keys'});
    const start=performance.now();
    let peak=null;
    const sample=()=>{if(typeof process!=='undefined' && process.memoryUsage){const m=process.memoryUsage();if(!peak)peak={...m};else for(const k in m)peak[k]=Math.max(peak[k],m[k]);}};
    sample();
    const result=await positions(keys.placement,req.N,req.demand,{maxDraws:req.maxDraws,onProgress:sample});
    // Touch represented RGB positions. Bootstrap slots are outside the sampled domain.
    for(const index of result.positions){const rgb=index+4096;pixels[Math.floor(rgb/3)*4+rgb%3]^=1;}
    sample();
    keys.root.fill(0);keys.encryption.fill(0);keys.placement.fill(0);
    send({type:'complete',samplerMs:performance.now()-start,draws:result.draws,rejections:result.rejections,peakEntries:result.peakEntries,streamBufferBytes:result.streamBufferBytes,positionBytes:result.positions.byteLength,workerSampledPeak:peak});
  } catch(error) {send({type:'error',error:String(error.message),fallback:false});}
});

// Disposable controls; full state is shown after every completed action.
const $=id=>document.getElementById(id);let worker,timer,url;
window.exchange={result:null,png:null,cancellations:[]};
function stop(){clearTimeout(timer);worker?.terminate();worker=null;$('encode').disabled=false;$('decode').disabled=false;$('run').disabled=false;$('cancel-message').disabled=true;}
async function run(action){
  if(worker||$('run').disabled)return;
  const file=$('png-file').files[0];if(!file){$('message-state').textContent='Choose a PNG file';return;}
  if(file.size>16*1024*1024){$('message-state').textContent='Source-file bound';return;}
  window.exchange.result=null;window.exchange.png=null;$('download').hidden=true;if(url)URL.revokeObjectURL(url);
  $('encode').disabled=true;$('decode').disabled=true;$('run').disabled=true;$('cancel-message').disabled=false;
  $('message-state').textContent='Running '+action;$('message-output').textContent='No authenticated output released';
  worker=new Worker('./message-worker.mjs',{type:'module'});
  const activeWorker=worker;
  worker.onmessage=({data})=>{
    window.exchange.result=data.result;window.exchange.png=data.png??null;
    $('message-state').textContent=data.result.outcome==='encoded'?'Encoded PNG ready':data.result.outcome==='exact-ready'?'Authenticated exact message':'Safe failure; no plaintext released';
    $('message-output').textContent=JSON.stringify(data.result,null,2);
    if(data.png){url=URL.createObjectURL(new Blob([data.png],{type:'image/png'}));$('download').href=url;$('download').hidden=false;}
    stop();
  };
  worker.onerror=event=>{$('message-state').textContent='STOP: '+event.message;stop();};
  timer=setTimeout(()=>{$('message-state').textContent='Timed out; worker terminated; no plaintext released';stop();},30000);
  let png;
  try { png=await file.arrayBuffer(); }
  catch(error) { if(worker===activeWorker){$('message-state').textContent='File read failed: '+error;stop();}return; }
  if(worker!==activeWorker)return;
  worker.postMessage({action,png,text:$('message').value,password:$('password').value,compressed:$('compressed').checked,profile:{salt:$('salt').value,parity:Number($('repair').value),interleave:$('interleave').value}},[png]);
}
$('encode').onclick=()=>run('encode');$('decode').onclick=()=>run('decode');
$('cancel-message').onclick=()=>{stop();window.exchange.result=null;window.exchange.png=null;window.exchange.cancellations.push({outcome:'cancelled',plaintextReleased:false});$('message-state').textContent='Cancelled; worker terminated; no plaintext released';$('message-output').textContent='No authenticated output released';};

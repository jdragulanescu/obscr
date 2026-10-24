// Disposable bounded RGB8 PNG transport for ticket 35; same code in Node/browser.
// No canvas, color conversion, palette expansion, interlace or image-supplied inflate size.
const MAX_FILE = 16 * 1024 * 1024;
const signature = Uint8Array.of(137,80,78,71,13,10,26,10);
const crcTable = Uint32Array.from({length:256}, (_, n) => { for(let i=0;i<8;i++) n=n&1?0xedb88320^(n>>>1):n>>>1; return n>>>0; });
function crc(bytes) { let c=0xffffffff; for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0; }
function join(parts) { const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0)); let at=0; for(const p of parts){out.set(p,at);at+=p.length;}return out; }
export function geometry(width,height) { if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>1024||height>1024)throw Error('PNG geometry bound'); }
async function transform(bytes, compress, limit) {
  const stream = new Blob([bytes]).stream().pipeThrough(compress ? new CompressionStream('deflate') : new DecompressionStream('deflate'));
  const reader=stream.getReader(), parts=[]; let size=0;
  try { for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('PNG inflate/output bound');parts.push(value);}return join(parts); }
  catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
}
function chunk(type, bytes) { const name=new TextEncoder().encode(type), out=new Uint8Array(bytes.length+12), view=new DataView(out.buffer);view.setUint32(0,bytes.length);out.set(name,4);out.set(bytes,8);view.setUint32(out.length-4,crc(out.subarray(4,out.length-4)));return out; }
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
export async function parsePng(bytes) {
  if(!(bytes instanceof Uint8Array)||bytes.length<45||bytes.length>MAX_FILE||signature.some((v,i)=>bytes[i]!==v))throw Error('PNG source bound or signature');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength), idats=[];
  let at=8,width,height,channels,seenHeader=false,seenData=false,endedData=false,ended=false;
  while(at<bytes.length){
    if(bytes.length-at<12)throw Error('Truncated PNG chunk');
    const size=view.getUint32(at), end=at+size+12;
    if(end>bytes.length)throw Error('PNG chunk length');
    const type=new TextDecoder().decode(bytes.subarray(at+4,at+8)), data=bytes.subarray(at+8,end-4);
    if(crc(bytes.subarray(at+4,end-4))!==view.getUint32(end-4))throw Error('PNG CRC');
    if(!seenHeader&&type!=='IHDR')throw Error('PNG header order');
    if(type==='IHDR'){
      if(seenHeader||size!==13)throw Error('PNG header count/size');
      width=view.getUint32(at+8);height=view.getUint32(at+12);geometry(width,height);
      if(data[8]!==8||![2,6].includes(data[9])||data[10]||data[11]||data[12])throw Error('Only noninterlaced RGB/RGBA8 PNG admitted');
      channels=data[9]===2?3:4;seenHeader=true;
    }else if(type==='IDAT'){
      if(endedData)throw Error('Noncontiguous PNG image data');seenData=true;idats.push(data);
    }else if(type==='IEND'){
      if(size||!seenData||end!==bytes.length)throw Error('PNG end or trailing bytes');ended=true;break;
    }else{
      if(seenData)endedData=true;
      if((bytes[at+4]&32)===0)throw Error('Unsupported critical PNG chunk');
      if(type==='tRNS'||type==='acTL')throw Error('Transparency/animation unsupported');
    }
    at=end;
  }
  if(!ended)throw Error('PNG end missing');
  const stride=width*channels, expected=(stride+1)*height;
  const scan=await transform(join(idats),false,expected);
  if(scan.length!==expected)throw Error('PNG raster length');
  const rgb=new Uint8Array(width*height*3);
  for(let y=0;y<height;y++){
    const row=y*(stride+1), filter=scan[row];if(filter>4)throw Error('PNG filter');
    for(let x=0;x<stride;x++){
      const i=row+1+x,a=x>=channels?scan[i-channels]:0,b=y?scan[i-stride-1]:0,c=y&&x>=channels?scan[i-stride-1-channels]:0;
      scan[i]=(scan[i]+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c)))&255;
    }
    for(let x=0;x<width;x++){const i=row+1+x*channels;if(channels===4&&scan[i+3]!==255)throw Error('Only opaque PNG admitted');rgb.set(scan.subarray(i,i+3),(y*width+x)*3);}
  }
  return {rgb,width,height};
}
export async function makePng({rgb,width,height}) {
  geometry(width,height);if(!(rgb instanceof Uint8Array)||rgb.length!==width*height*3)throw Error('RGB buffer length');
  const stride=width*3, scan=new Uint8Array((stride+1)*height);
  for(let y=0;y<height;y++)scan.set(rgb.subarray(y*stride,(y+1)*stride),y*(stride+1)+1);
  const ihdr=new Uint8Array(13),view=new DataView(ihdr.buffer);view.setUint32(0,width);view.setUint32(4,height);ihdr[8]=8;ihdr[9]=2;
  return join([signature,chunk('IHDR',ihdr),chunk('IDAT',await transform(scan,true,MAX_FILE-57)),chunk('IEND',new Uint8Array())]);
}

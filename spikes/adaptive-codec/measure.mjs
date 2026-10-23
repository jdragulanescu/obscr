// Development-only measurements; fixed procedure in EXPERIMENT.md.
import { bootstrap } from './placement.mjs';
export function rng(seed){let x=seed>>>0;return n=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return Math.floor(x/2**32*n);};}
export function message(size){const next=rng(35000+size);return Uint8Array.from({length:size},()=>32+next(95));}
export function damage(image,kind,seed){
  const {rgb,width,height}=image,out=rgb.slice(),next=rng(seed),pixels=width*height,selected=[];
  if(kind.startsWith('random-')){const rate=Number(kind.slice(7)),swaps=new Map();for(let left=pixels,i=0;i<Math.floor(pixels*rate);i++,left--){const j=next(left),p=swaps.get(j)??j;swaps.set(j,swaps.get(left-1)??left-1);swaps.delete(left-1);selected.push(p);}}
  else if(kind==='patch'){const side=Math.floor(Math.sqrt(pixels*.01)),x0=Math.floor((width-side)/2),y0=Math.floor((height-side)/2);for(let y=y0;y<y0+side;y++)for(let x=x0;x<x0+side;x++)selected.push(y*width+x);}
  else if(kind==='stripe'){const size=Math.max(1,Math.floor(width*.01)),x0=Math.floor(width/2);for(let y=0;y<height;y++)for(let x=x0;x<x0+size;x++)selected.push(y*width+x);}
  else throw Error('Unknown damage kind');
  for(const pixel of selected){if(kind.startsWith('random-')){const i=pixel*3+next(3);out[i]=Math.min(255,Math.max(0,out[i]+(next(2)?1:-1)));}else for(let c=0;c<3;c++)out[pixel*3+c]=next(256);}
  let changed=0,parity=0;for(let i=0;i<rgb.length;i++){changed+=rgb[i]!==out[i];parity+=(rgb[i]^out[i])&1;}
  return {rgb:out,width,height,damage:{kind,seed,selectedPixels:selected.length,changedSamples:changed,parityFlips:parity}};
}
function runs(ids){const result=[];let previous=-2;for(const n of ids){if(n===previous+1)result[result.length-1]++;else result.push(1);previous=n;}return result;}
export function errors(expected,actual){const bits=[],bytes=[],per255=[];for(let i=0;i<expected.length;i++){const xor=expected[i]^actual[i];if(xor){bytes.push(i);per255[Math.floor(i/255)]=(per255[Math.floor(i/255)]??0)+1;for(let b=0;b<8;b++)if(xor&(1<<(7-b)))bits.push(i*8+b);}}return {bitCount:bits.length,byteCount:bytes.length,bitIndices:bits,byteIndices:bytes,bitRuns:runs(bits),byteRuns:runs(bytes),per255ByteErrors:Array.from({length:Math.ceil(expected.length/255)},(_,i)=>per255[i]??0)};}
export function scores(rgb){
  let ones=0,rg=0,gb=0;const hist=new Uint32Array(256);
  for(let i=0;i<rgb.length;i++){hist[rgb[i]]++;ones+=rgb[i]&1;if(i%3===0){rg+=Math.abs(rgb[i]-rgb[i+1]);gb+=Math.abs(rgb[i+1]-rgb[i+2]);}}
  let pair=0;for(let i=0;i<256;i+=2){const n=hist[i]+hist[i+1];if(n)pair+=(hist[i]-hist[i+1])**2/n;}
  const ids=bootstrap(rgb.length);let saltOnes=0;for(const i of ids)saltOnes+=rgb[i]&1;
  return {parityFraction:ones/rgb.length,pairImbalance:pair,meanAbsRG:rg/(rgb.length/3),meanAbsGB:gb/(rgb.length/3),bootstrapParityFraction:saltOnes/ids.length};
}
export function changes(a,b){let count=0,square=0,max=0;for(let i=0;i<a.length;i++){const d=a[i]-b[i];count+=d!==0;square+=d*d;max=Math.max(max,Math.abs(d));}return {changedSamples:count,maximumDelta:max,mse:square/a.length};}

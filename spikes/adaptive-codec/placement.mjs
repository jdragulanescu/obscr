// Accepted full-key sampler, adapted from reference/key-chain.mjs to scalar RGB units.
export const MAX_POSITIONS=262144, BOOTSTRAP=8192;
export function bootstrap(samples){if(samples<BOOTSTRAP)throw Error('Bootstrap capacity');return Uint32Array.from({length:BOOTSTRAP},(_,i)=>Math.floor(i*samples/BOOTSTRAP));}
export function createPlacement(samples,key){
  const N=samples-BOOTSTRAP;if(N<0||samples>1024*1024*3)throw Error('Scalar domain bound');
  const swaps=new Map();let count=0,draws=0,rejections=0,peakEntries=0,counterBlocks=0,words,wordIndex=1024;
  const zero=new Uint8Array(4096);
  async function word(limit){
    if(draws>=limit||draws>=525312)throw Error('Placement draw bound');
    if(wordIndex===1024){const counter=new Uint8Array(16);new DataView(counter.buffer).setUint32(12,counterBlocks,false);words=new DataView(await crypto.subtle.encrypt({name:'AES-CTR',counter,length:128},key,zero));counterBlocks+=256;wordIndex=0;}
    draws++;return words.getUint32(wordIndex++*4,true);
  }
  function sampleForRank(rank){
    let low=rank,high=rank+BOOTSTRAP;
    while(low<high){const mid=Math.floor((low+high)/2),reserved=Math.min(BOOTSTRAP,Math.ceil((mid+1)*BOOTSTRAP/samples));if(mid+1-reserved>=rank+1)high=mid;else low=mid+1;}
    return low;
  }
  return {
    async take(amount){
      const demand=count+amount;if(!Number.isInteger(amount)||amount<0||demand>N||demand>MAX_POSITIONS)throw Error('Placement demand bound');
      const out=new Uint32Array(amount),limit=2*demand+1024;
      for(let i=0;i<amount;i++){
        const remaining=N-count,accepted=Math.floor(2**32/remaining)*remaining;let w;
        do{w=await word(limit);if(w>=accepted)rejections++;}while(w>=accepted);
        const index=w%remaining,rank=swaps.get(index)??index,last=swaps.get(remaining-1)??remaining-1;
        swaps.delete(remaining-1);if(index!==remaining-1){if(last===index)swaps.delete(index);else swaps.set(index,last);}
        count++;peakEntries=Math.max(peakEntries,swaps.size);out[i]=sampleForRank(rank);
      }return out;
    },
    diagnostics:()=>({scalarSamples:count,draws,rejections,peakEntries,mapEntries:swaps.size,generatedStreamBytes:counterBlocks*16})
  };
}

// Stenoxide-inspired HILL-like RGB baseline, NOT standard HILL/S-UNIWARD.
// Frozen in CONTRACT.md. Source model: pinned stenoxide-core/src/cost/hill.rs.
// No image acceptance rule; equal per-pixel costs for RGB; no red multiplier.
export function costs(rgb,width,height){
  if(rgb.length!==width*height*3||width<1||height<1||width>1024||height>1024)throw Error('Cost geometry bound');
  const count=width*height,a=new Float32Array(count),b=new Float32Array(count),c=new Float32Array(count);
  for(let i=0;i<count;i++)a[i]=.299*rgb[i*3]+.587*rgb[i*3+1]+.114*rgb[i*3+2];
  const reflect=(x,n)=>{if(n===1)return 0;const p=2*(n-1);x=((x%p)+p)%p;return x>=n?p-x:x;};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;b[i]=Math.abs(4*a[i]-a[y*width+reflect(x-1,width)]-a[y*width+reflect(x+1,width)]-a[reflect(y-1,height)*width+x]-a[reflect(y+1,height)*width+x]);}
  for(const sigma of [1,1.5]){
    const radius=Math.ceil(2*sigma),taps=Array.from({length:radius*2+1},(_,i)=>Math.exp(-((i-radius)**2)/(2*sigma*sigma))),sum=taps.reduce((a,b)=>a+b,0);
    for(let i=0;i<taps.length;i++)taps[i]/=sum;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){let v=0;for(let t=-radius;t<=radius;t++)v+=b[y*width+reflect(x+t,width)]*taps[t+radius];c[y*width+x]=v;}
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){let v=0;for(let t=-radius;t<=radius;t++)v+=c[reflect(y+t,height)*width+x]*taps[t+radius];b[y*width+x]=v;}
  }
  for(let i=0;i<count;i++)a[i]=1/(b[i]+1e-6);
  return a;
}

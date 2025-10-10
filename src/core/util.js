// Utility functions
export const TAU = 2*Math.PI;

export function linspace(a,b,n){
  const out=new Array(n), d=(b-a)/(n-1);
  for(let i=0;i<n;i++) out[i]=a+i*d;
  return out;
}

export function unwrapPhase(phRad){
  const out=[...phRad];
  for(let pass=0; pass<2; pass++){
    for(let i=1;i<out.length;i++){
      const d=out[i]-out[i-1];
      if(d>Math.PI) out[i]-=TAU;
      if(d<-Math.PI) out[i]+=TAU;
    }
  }
  return out;
}

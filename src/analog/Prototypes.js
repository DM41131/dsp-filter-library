// Analog filter prototypes
import { Poly } from "../core/Polynomial.js";

export class Prototypes {
  static butter(N){
    const poles=[], zeros=[];
    for(let k=1;k<=N;k++){ const th=(2*k-1)*Math.PI/(2*N); poles.push({re:-Math.sin(th), im:Math.cos(th)}); }
    return {poles, zeros};
  }
  static cheby1(N, Rp){
    const eps=Math.sqrt(Math.pow(10, Rp/10)-1), alpha=Math.asinh(1/eps)/N;
    const poles=[], zeros=[];
    for(let k=1;k<=N;k++){ const th=(2*k-1)*Math.PI/(2*N); poles.push({re:-Math.sinh(alpha)*Math.sin(th), im:Math.cosh(alpha)*Math.cos(th)}); }
    return {poles, zeros};
  }
  static cheby2(N, Rs){
    const eps2=1/Math.sqrt(Math.pow(10, Rs/10)-1), alpha=Math.asinh(1/eps2)/N;
    const poles=[], zeros=[];
    for(let k=1;k<=N;k++){ const th=(2*k-1)*Math.PI/(2*N); poles.push({re:-Math.sinh(alpha)*Math.sin(th), im:Math.cosh(alpha)*Math.cos(th)}); }
    const M=Math.floor(N/2);
    for(let k=1;k<=M;k++){ const th=(2*k-1)*Math.PI/(2*N), Oz=1/Math.cos(th); zeros.push({re:0,im: Oz}, {re:0,im:-Oz}); }
    return {poles, zeros};
  }
  // Educational hybrid (not exact elliptic)
  static ellipHybrid(N, Rp, Rs){
    const p=Prototypes.cheby1(N,Rp), z=Prototypes.cheby2(N,Rs);
    return {poles:p.poles, zeros:z.zeros};
  }
  static linkwitzRiley(N){
    const evenN=(N%2===0)?N:N+1;
    const base=Prototypes.butter(evenN/2);
    const poles=[]; base.poles.forEach(pl=>{ poles.push(pl,{re:pl.re,im:pl.im}); });
    return {poles, zeros:[], enforcedOrder:evenN};
  }
  static bessel(N){
    const n=Math.min(N,12); const a=new Array(n+1).fill(0); a[0]=1;
    for(let k=1;k<=n;k++) a[k]=a[k-1]*((n+k)*(n-k+1))/(2*k);
    // tiny DK for Bessel poly (ascending coeff eval)
    const poles = (() => {
      const nn=a.length-1, R=1.5, z=new Array(nn);
      for(let i=0;i<nn;i++){ const ang=2*Math.PI*(i+1)/nn; z[i]={re:R*Math.cos(ang), im:R*Math.sin(ang)}; }
      for(let it=0; it<200; it++){
        let moved=false;
        for(let i=0;i<nn;i++){
          let denom={re:1,im:0};
          for(let j=0;j<nn;j++) if(i!==j) denom={re:denom.re*(z[i].re-z[j].re)-denom.im*(z[i].im-z[j].im), im:denom.re*(z[i].im-z[j].im)+denom.im*(z[i].re-z[j].re)};
          const f=Poly.evalRealAsc(a, z[i]);
          const delta={re:f.re/(denom.re||1e-300), im:f.im/(denom.re||1e-300)}; // crude but ok
          const ni={re:z[i].re-delta.re, im:z[i].im-delta.im};
          if(Math.hypot(ni.re-z[i].re, ni.im-z[i].im)>1e-12) moved=true;
          z[i]=ni;
        }
        if(!moved) break;
      }
      return z.filter(r=> r.re<0 || Math.abs(r.re)<1e-12);
    })();
    return {poles, zeros:[]};
  }
}

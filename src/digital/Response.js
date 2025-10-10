// Digital filter response calculations
import { Cx } from "../core/Complex.js";
import { unwrapPhase } from "../core/util.js";

export class Response {
  static H_w_IIR(sections,w){
    const z1={re:Math.cos(w),im:-Math.sin(w)}, z2={re:Math.cos(2*w),im:-Math.sin(2*w)};
    let acc={re:1,im:0};
    for(const s of sections){
      const [b0,b1,b2]=s.b, [,a1,a2]=s.a;
      const num={re:b0+b1*z1.re+b2*z2.re, im:b1*z1.im+b2*z2.im};
      const den={re:1+a1*z1.re+a2*z2.re, im:a1*z1.im+a2*z2.im};
      const den2=den.re*den.re+den.im*den.im;
      const h={re:(num.re*den.re+num.im*den.im)/den2, im:(num.im*den.re-num.re*den.im)/den2};
      acc = Cx.mul(acc,h);
    }
    return acc;
  }
  static H_w_FIR(taps,w){
    let re=0, im=0;
    for(let n=0;n<taps.length;n++){ re += taps[n]*Math.cos(w*n); im -= taps[n]*Math.sin(w*n); }
    return {re, im};
  }
  static magDbFromH(H){ return 20*Math.log10(Math.max(1e-16, Cx.abs(H))); }
  static unwrapToDeg(phRad){ return unwrapPhase(phRad).map(v=>v*180/Math.PI); }
  static groupDelay(phUnwrappedRad, w){
    const N=w.length, gd=new Array(N).fill(0);
    if(N>=3){
      for(let i=1;i<N-1;i++){
        const dphi=phUnwrappedRad[i+1]-phUnwrappedRad[i-1], dw=w[i+1]-w[i-1];
        gd[i] = - dphi / (dw || 1e-12);
      }
      gd[0]=gd[1]; gd[N-1]=gd[N-2];
    }
    return gd;
  }
  static phaseDelay(phUnwrappedRad, w){
    const pd=new Array(w.length).fill(0);
    for(let i=0;i<w.length;i++) pd[i] = (w[i]===0 ? NaN : -phUnwrappedRad[i]/w[i]);
    let firstFinite = pd.find(v=>Number.isFinite(v)); if(!Number.isFinite(firstFinite)) firstFinite=0;
    for(let i=0;i<pd.length && !Number.isFinite(pd[i]); i++) pd[i]=firstFinite;
    for(let i=1;i<pd.length;i++) if(!Number.isFinite(pd[i])) pd[i]=pd[i-1];
    return pd;
  }
}

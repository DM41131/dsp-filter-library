'use strict';

var core_Complex = require('./Complex.cjs');
var core_Polynomial = require('./Polynomial.cjs');

// Root finding algorithms

function evalMonicAndDeriv(coeffsMonic, z){
  const N = coeffsMonic.length - 1;
  let p={re:1,im:0}, dp={re:0,im:0};
  for(let k=1;k<=N;k++){ dp=core_Complex.Cx.add(core_Complex.Cx.mul(dp,z),p); p=core_Complex.Cx.add(core_Complex.Cx.mul(p,z),{re:coeffsMonic[k],im:0}); }
  return {p,dp};
}

class Roots {
  static aberthMonic(raw){
    let i0=0; while(i0<raw.length-1 && Math.abs(raw[i0])<1e-18) i0++;
    let cs = raw.slice(i0);
    const N = cs.length - 1;
    if (N <= 0) return [];
    const a0 = cs[0];
    cs = cs.map(c => c / a0); // monic [1, a1, ..., aN]

    let maxRatio=0; for(let k=1;k<cs.length;k++) maxRatio=Math.max(maxRatio, Math.abs(cs[k]));
    const r0 = Math.max(0.5, Math.min(1.5, 1+maxRatio));

    const roots=new Array(N);
    for(let k=0;k<N;k++){
      const ang=2*Math.PI*(k+0.5)/N, jit=1+((k%2?1:-1)*1e-3);
      roots[k]={re:r0*jit*Math.cos(ang), im:r0*jit*Math.sin(ang)};
    }

    const MAX_IT=200, TOL=1e-12, DEN_EPS=1e-14;
    for(let it=0; it<MAX_IT; it++){
      let moved=false;
      for(let i=0;i<N;i++){
        const zi=roots[i];
        const {p,dp}=evalMonicAndDeriv(cs,zi);
        let sumInv={re:0,im:0};
        for(let j=0;j<N;j++) if(j!==i){
          let dif=core_Complex.Cx.sub(zi,roots[j]);
          const mag2=dif.re*dif.re+dif.im*dif.im;
          if(mag2 < DEN_EPS*DEN_EPS) dif={re:dif.re+DEN_EPS, im:dif.im};
          const inv={re:dif.re/(mag2||1e-300), im:-dif.im/(mag2||1e-300)};
          sumInv=core_Complex.Cx.add(sumInv,inv);
        }
        const denom=core_Complex.Cx.sub(dp, core_Complex.Cx.mul(p,sumInv));
        const delta=core_Complex.Cx.div(p,denom);
        const ni=core_Complex.Cx.sub(zi,delta);
        if(Math.hypot(ni.re-zi.re, ni.im-zi.im)>TOL) moved=true;
        roots[i]=ni;
      }
      if(!moved) break;
    }
    return roots;
  }

  static dkScaled(raw){
    let i0=0; while(i0<raw.length-1 && Math.abs(raw[i0])<1e-18) i0++;
    const poly=raw.slice(i0);
    const N=poly.length-1;
    if(N<=0) return [];
    const a0=poly[0];
    const monic=poly.map(c=>c/a0);

    const results=[];
    for(const R of [0.8,1.1,1.5]){
      const roots=new Array(N);
      for(let k=0;k<N;k++){ const ang=2*Math.PI*(k+1)/N; roots[k]={re:R*Math.cos(ang), im:R*Math.sin(ang)}; }
      for(let it=0;it<200;it++){
        let moved=false;
        for(let i=0;i<N;i++){
          let denom={re:1,im:0};
          for(let j=0;j<N;j++) if(i!==j) denom=core_Complex.Cx.mul(denom, core_Complex.Cx.sub(roots[i], roots[j]));
          const f=core_Polynomial.Poly.evalRealAsc(monic, roots[i]);
          const delta=core_Complex.Cx.div(f,denom);
          const ni=core_Complex.Cx.sub(roots[i], delta);
          if(Math.hypot(ni.re-roots[i].re, ni.im-roots[i].im)>1e-12) moved=true;
          roots[i]=ni;
        }
        if(!moved) break;
      }
      results.push(...roots);
    }
    return results;
  }
}

exports.Roots = Roots;
//# sourceMappingURL=Roots.cjs.map

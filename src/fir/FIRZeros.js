// FIR filter zeros
import { Roots } from "../core/Roots.js";
import { Response } from "../digital/Response.js";

function pushUnique(arr, z, tol=1e-9){ for(const q of arr) if(Math.hypot(q.re-z.re, q.im-z.im)<tol) return false; arr.push(z); return true; }
function enforceConjugates(roots, tol=1e-9){
  const out=[]; for(const r of roots){ pushUnique(out,r,tol); if(Math.abs(r.im)>1e-12) pushUnique(out,{re:r.re, im:-r.im}, tol); } return out;
}

export class FIRZeros {
  static fromTapsRobust(taps){
    const M=taps.length-1;
    const coeffs=new Array(taps.length);
    for(let k=0;k<taps.length;k++) coeffs[k]=taps[M-k];

    let i0=0; while(i0<coeffs.length-1 && Math.abs(coeffs[i0])<1e-18) i0++;
    const poly=coeffs.slice(i0);
    const N=poly.length-1;
    if(N<=0) return [];

    const cand=[];
    try { for(const z of Roots.aberthMonic(coeffs)) if(Number.isFinite(z.re)&&Number.isFinite(z.im)) pushUnique(cand,z); } catch{/* ignore */}
    try { for(const z of Roots.dkScaled(coeffs))    if(Number.isFinite(z.re)&&Number.isFinite(z.im)) pushUnique(cand,z); } catch{/* ignore */}

    if(cand.length < N){
      const need=N-cand.length, extra=approxUnitCircleMinima(taps, need);
      for(const z of extra) pushUnique(cand,z,1e-6);
    }

    const roots=enforceConjugates(cand);
    const out=[]; for(const z of roots){ if(pushUnique(out,z,1e-9) && out.length===N) break; }
    return out.length>N ? out.slice(0,N) : out;
  }
}

function approxUnitCircleMinima(taps, want){
  const K=8192, picks=[], mags=new Float64Array(K+1);
  for(let i=0;i<=K;i++){ const w=Math.PI*i/K; const H=Response.H_w_FIR(taps,w); mags[i]=Math.hypot(H.re,H.im); }
  for(let i=1;i<K;i++){
    if(mags[i]<mags[i-1] && mags[i]<mags[i+1]){
      const w=Math.PI*i/K; picks.push({re:Math.cos(w), im:Math.sin(w)}); if(picks.length>=want) break;
    }
  }
  return picks;
}

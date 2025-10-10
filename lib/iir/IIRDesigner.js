import { BLT } from '../digital/BLT.js';
import { Response } from '../digital/Response.js';
import { SOS } from '../digital/SOS.js';
import { Prototypes } from '../analog/Prototypes.js';
import { IIRFilter } from '../model/IIRFilter.js';
import '../core/Complex.js';
import '../core/util.js';
import '../core/Polynomial.js';

// IIR filter designer

function divC(a,b){ const d=b.re*b.re+b.im*b.im||1e-300; return {re:(a.re*b.re+0*b.im)/d, im:(0*b.re-a.re*b.im)/d}; }

class IIRDesigner {
  constructor(spec){
    this.spec = spec; // {family, kind, N, Rp?, Rs?, Fs, f1, f2?}
  }
  design(){
    const { family, kind, Fs } = this.spec;
    let { N, f1, f2 } = this.spec;
    const Rp=this.spec.Rp ?? 1, Rs=this.spec.Rs ?? 60;

    // Prototype
    let proto;
    switch(family){
      case 'butter': proto=Prototypes.butter(N); break;
      case 'cheby1': proto=Prototypes.cheby1(N, Rp); break;
      case 'cheby2': proto=Prototypes.cheby2(N, Rs); break;
      case 'ellip':  proto=Prototypes.ellipHybrid(N, Rp, Rs); break;
      case 'linkwitz': {
        const lr=Prototypes.linkwitzRiley(N);
        N=lr.enforcedOrder ?? N;
        proto={poles:lr.poles, zeros:[]};
        break;
      }
      case 'bessel': proto=Prototypes.bessel(N); break;
      default: proto=Prototypes.butter(N);
    }
    proto.family=family; proto.order=N;

    // Map + BLT
    let zPoles=[], zZeros=[];
    if(kind==='lowpass'||kind==='highpass'){
      const Oc=BLT.prewarp(f1,Fs);
      const sPoles=proto.poles.map(p=> kind==='lowpass'? {re:p.re*Oc, im:p.im*Oc} : divC({re:Oc}, p));
      const sZeros=proto.zeros.map(z=> kind==='lowpass'? {re:z.re*Oc, im:z.im*Oc} : divC({re:Oc}, z));
      zPoles=sPoles.map(s=>BLT.sToZ(s,Fs));
      zZeros=sZeros.map(s=>BLT.sToZ(s,Fs));
      if((['butter','cheby1','bessel','linkwitz'].includes(family)) && kind==='highpass'){
        for(let k=0;k<N;k++) zZeros.push({re:1,im:0});
      }
    } else {
      if(!f2) throw new Error('bandpass/bandstop require f2');
      if(f2<f1){ const t=f1; f1=f2; f2=t; }
      const O1=BLT.prewarp(f1,Fs), O2=BLT.prewarp(f2,Fs), B=O2-O1, O0=Math.sqrt(O1*O2);
      const sPoles=[], sZeros=[];
      if(kind==='bandpass'){
        for(const p of proto.poles){ const [r1,r2]=BLT.quad({re:1,im:0},{re:-(p.re*B),im:-(p.im*B)},{re:O0*O0,im:0}); sPoles.push(r1,r2); }
        for(const z of proto.zeros){ const [r1,r2]=BLT.quad({re:1,im:0},{re:-(z.re*B),im:-(z.im*B)},{re:O0*O0,im:0}); sZeros.push(r1,r2); }
        if(['butter','cheby1','bessel','linkwitz'].includes(family)){ for(let k=0;k<N;k++) sZeros.push({re:0,im:0}); }
        zPoles=sPoles.map(s=>BLT.sToZ(s,Fs)); zZeros=sZeros.map(s=>BLT.sToZ(s,Fs));
        if(['butter','cheby1','bessel','linkwitz'].includes(family)){ for(let k=0;k<N;k++) zZeros.push({re:-1,im:0}); }
        else if(family==='cheby2' && (N%2===1)){ zZeros.push({re:1,im:0},{re:-1,im:0}); }
      } else {
        for(const p of proto.poles){ const [r1,r2]=BLT.quad({re:p.re,im:p.im},{re:-B,im:0},{re:p.re*O0*O0,im:p.im*O0*O0}); sPoles.push(r1,r2); }
        for(const z of proto.zeros){ const [r1,r2]=BLT.quad({re:z.re,im:z.im},{re:-B,im:0},{re:z.re*O0*O0,im:z.im*O0*O0}); sZeros.push(r1,r2); }
        for(let k=0;k<N;k++){ sZeros.push({re:0,im:O0},{re:0,im:-O0}); }
        zPoles=sPoles.map(s=>BLT.sToZ(s,Fs)); zZeros=sZeros.map(s=>BLT.sToZ(s,Fs));
      }
    }

    // SOS + gain normalization
    const sections = SOS.fromZPK(zZeros, zPoles, 1);
    let wRef=0;
    if(kind==='highpass') wRef=Math.PI;
    if(kind==='bandpass'){ const f0=Math.sqrt(f1*f2); wRef=2*Math.PI*(f0/Fs); }
    const Href=Response.H_w_IIR(sections, wRef), g=1/(Math.hypot(Href.re,Href.im)||1e-12);
    sections[0].b=[sections[0].b[0]*g, sections[0].b[1]*g, sections[0].b[2]*g];

    return new IIRFilter({sections, Fs, zPoles, zZeros});
  }
}

export { IIRDesigner };
//# sourceMappingURL=IIRDesigner.js.map

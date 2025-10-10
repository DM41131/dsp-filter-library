import { linspace, unwrapPhase } from '../core/util.js';
import { Response } from '../digital/Response.js';
import '../core/Complex.js';

// IIR filter model

class IIRFilter {
  constructor(init){ this.init = init; } // {sections, Fs, zPoles, zZeros}
  get type(){ return 'IIR'; }
  get sections(){ return this.init.sections; }
  get Fs(){ return this.init.Fs; }
  get zPoles(){ return this.init.zPoles; }
  get zZeros(){ return this.init.zZeros; }

  impulseResponse(L=256){
    const x=new Array(L).fill(0); x[0]=1; let buf=x.slice();
    for(const s of this.sections){
      const [b0,b1,b2]=s.b, [,a1,a2]=s.a;
      const out=new Array(L).fill(0); let v1=0,v2=0;
      for(let n=0;n<L;n++){ const w=buf[n]-a1*v1-a2*v2; const yn=b0*w+b1*v1+b2*v2; out[n]=yn; v2=v1; v1=w; }
      buf=out;
    }
    return buf;
  }

  frequencyGrid(Nf=1024){
    const w=linspace(0,Math.PI,Nf), magdB=[], phRad=[];
    for(const wi of w){ const H=Response.H_w_IIR(this.sections, wi); magdB.push(Response.magDbFromH(H)); phRad.push(Math.atan2(H.im,H.re)); }
    const phU=unwrapPhase(phRad), gd=Response.groupDelay(phU, w), pd=Response.phaseDelay(phU, w);
    const freqHz=w.map(wi=> wi/Math.PI*(this.Fs/2)), phaseDeg=phU.map(v=>v*180/Math.PI);
    return { w, freqHz, magdB, phaseDeg, gdSamples:gd, pdSamples:pd };
  }
}

export { IIRFilter };
//# sourceMappingURL=IIRFilter.js.map

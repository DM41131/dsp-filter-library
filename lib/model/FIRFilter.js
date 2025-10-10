import { linspace, unwrapPhase } from '../core/util.js';
import { Response } from '../digital/Response.js';
import { FIRZeros } from '../fir/FIRZeros.js';
import '../core/Complex.js';
import '../core/Roots.js';
import '../core/Polynomial.js';

// FIR filter model

class FIRFilter {
  constructor(init){ this.init = init; this._zeros = null; } // {taps, Fs}
  get type(){ return 'FIR'; }
  get taps(){ return this.init.taps; }
  get Fs(){ return this.init.Fs; }

  impulseResponse(L=256){ return this.taps.slice(0,L); }
  zeros(){ if(!this._zeros) this._zeros = FIRZeros.fromTapsRobust(this.taps); return this._zeros; }

  frequencyGrid(Nf=1024){
    const w=linspace(0,Math.PI,Nf), magdB=[], phRad=[];
    for(const wi of w){ const H=Response.H_w_FIR(this.taps, wi); magdB.push(Response.magDbFromH(H)); phRad.push(Math.atan2(H.im,H.re)); }
    const phU=unwrapPhase(phRad), gd=Response.groupDelay(phU, w), pd=Response.phaseDelay(phU, w);
    const freqHz=w.map(wi=> wi/Math.PI*(this.Fs/2)), phaseDeg=phU.map(v=>v*180/Math.PI);
    return { w, freqHz, magdB, phaseDeg, gdSamples:gd, pdSamples:pd };
  }
}

export { FIRFilter };
//# sourceMappingURL=FIRFilter.js.map

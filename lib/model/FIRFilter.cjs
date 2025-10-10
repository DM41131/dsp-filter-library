'use strict';

var core_util = require('../core/util.cjs');
var digital_Response = require('../digital/Response.cjs');
var fir_FIRZeros = require('../fir/FIRZeros.cjs');
require('../core/Complex.cjs');
require('../core/Roots.cjs');
require('../core/Polynomial.cjs');

// FIR filter model

class FIRFilter {
  constructor(init){ this.init = init; this._zeros = null; } // {taps, Fs}
  get type(){ return 'FIR'; }
  get taps(){ return this.init.taps; }
  get Fs(){ return this.init.Fs; }

  impulseResponse(L=256){ return this.taps.slice(0,L); }
  zeros(){ if(!this._zeros) this._zeros = fir_FIRZeros.FIRZeros.fromTapsRobust(this.taps); return this._zeros; }

  frequencyGrid(Nf=1024){
    const w=core_util.linspace(0,Math.PI,Nf), magdB=[], phRad=[];
    for(const wi of w){ const H=digital_Response.Response.H_w_FIR(this.taps, wi); magdB.push(digital_Response.Response.magDbFromH(H)); phRad.push(Math.atan2(H.im,H.re)); }
    const phU=core_util.unwrapPhase(phRad), gd=digital_Response.Response.groupDelay(phU, w), pd=digital_Response.Response.phaseDelay(phU, w);
    const freqHz=w.map(wi=> wi/Math.PI*(this.Fs/2)), phaseDeg=phU.map(v=>v*180/Math.PI);
    return { w, freqHz, magdB, phaseDeg, gdSamples:gd, pdSamples:pd };
  }
}

exports.FIRFilter = FIRFilter;
//# sourceMappingURL=FIRFilter.cjs.map

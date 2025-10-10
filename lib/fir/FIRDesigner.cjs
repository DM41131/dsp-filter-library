'use strict';

var digital_Response = require('../digital/Response.cjs');
var fir_Windows = require('./Windows.cjs');
var model_FIRFilter = require('../model/FIRFilter.cjs');
require('../core/Complex.cjs');
require('../core/util.cjs');
require('./FIRZeros.cjs');
require('../core/Roots.cjs');
require('../core/Polynomial.cjs');

// FIR filter designer

function sincNorm(x){ return x===0 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x); }

class FIRDesigner {
  constructor(spec){
    this.spec = spec; // {kind,taps,Fs,f1,f2?,window?,beta?}
  }
  design(){
    const { kind, taps: M, Fs, f1, f2=f1, window='hamming', beta=6 } = this.spec;
    const mid=(M-1)/2, w1=2*Math.PI*(f1/Fs), w2=2*Math.PI*(f2/Fs);
    const win=fir_Windows.Windows.byName(window, M, beta), h=new Array(M).fill(0);

    const lpAt=(omega_c)=>{
      const hlp=new Array(M);
      for(let n=0;n<M;n++) hlp[n]= 2*omega_c/(2*Math.PI) * sincNorm((n-mid)*omega_c/Math.PI);
      return hlp;
    };

    if(kind==='lowpass'){
      const hlp=lpAt(w1); for(let n=0;n<M;n++) h[n]=hlp[n]*win[n];
    } else if(kind==='highpass'){
      const hlp=lpAt(w1); for(let n=0;n<M;n++){ const d=(n===mid)?1:0; h[n]=(d-hlp[n])*win[n]; }
    } else if(kind==='bandpass'){
      const h2=lpAt(w2), h1=lpAt(w1); for(let n=0;n<M;n++) h[n]=(h2[n]-h1[n])*win[n];
    } else {
      const h2=lpAt(w2), h1=lpAt(w1);
      for(let n=0;n<M;n++){ const d=(n===mid)?1:0; h[n]=(d-(h2[n]-h1[n]))*win[n]; }
    }

    let wRef=0;
    if(kind==='highpass') wRef=Math.PI;
    if(kind==='bandpass'){ const f0=Math.sqrt(f1*f2); wRef=2*Math.PI*(f0/Fs); }
    const Href=digital_Response.Response.H_w_FIR(h,wRef), g=1/(Math.hypot(Href.re,Href.im)||1e-12);
    for(let n=0;n<M;n++) h[n]*=g;

    return new model_FIRFilter.FIRFilter({taps:h, Fs});
  }
}

exports.FIRDesigner = FIRDesigner;
//# sourceMappingURL=FIRDesigner.cjs.map

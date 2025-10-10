'use strict';

// Window functions for FIR design
class Windows {
    static rect(M){ return Array.from({length:M}, ()=>1); }
    static hann(M){ return Array.from({length:M}, (_,n)=>0.5*(1-Math.cos(2*Math.PI*n/(M-1)))); }
    static hamming(M){ return Array.from({length:M}, (_,n)=>0.54-0.46*Math.cos(2*Math.PI*n/(M-1))); }
    static blackman(M){ return Array.from({length:M}, (_,n)=>0.42-0.5*Math.cos(2*Math.PI*n/(M-1))+0.08*Math.cos(4*Math.PI*n/(M-1))); }
    static kaiser(M,beta){
      const I0=(x)=>{ let a=1,y=1,k=1; const xs=(x/2)*(x/2); for(;k<32;k++){ y*=xs/(k*k); a+=y; if(y<1e-12) break; } return a; };
      const denom=I0(beta), w=new Array(M);
      for(let n=0;n<M;n++){ const t=2*n/(M-1)-1; w[n]= I0(beta*Math.sqrt(1-t*t))/denom; }
      return w;
    }
    static byName(name,M,beta=6){
      switch(name){
        case 'rect': return Windows.rect(M);
        case 'hann': return Windows.hann(M);
        case 'hamming': return Windows.hamming(M);
        case 'blackman': return Windows.blackman(M);
        case 'kaiser': return Windows.kaiser(M,beta);
        default: return Windows.hamming(M);
      }
    }
  }

exports.Windows = Windows;
//# sourceMappingURL=Windows.cjs.map

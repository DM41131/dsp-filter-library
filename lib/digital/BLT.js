import { Cx } from '../core/Complex.js';

// Bilinear Transform

class BLT {
  static prewarp(f, Fs){ return 2*Fs*Math.tan(Math.PI*f/Fs); }
  static sToZ(s, Fs){
    const a={re:2*Fs+s.re, im:s.im}, b={re:2*Fs-s.re, im:-s.im};
    return Cx.div(a,b);
  }
  static quad(a,b,c){
    function cSqrt(z){
      const x=z.re,y=z.im,r=Math.hypot(x,y),t=Math.sqrt((r+Math.abs(x))/2);
      if(x>=0) return {re:t, im: y/(2*(t||1e-300))};
      const im=(y>=0?1:-1)*t; return {re: y/(2*(im||1e-300)), im};
    }
    const b2=Cx.mul(b,b), fourac=Cx.mul({re:4,im:0}, Cx.mul(a,c));
    const disc= {re:b2.re-fourac.re, im:b2.im-fourac.im};
    const s=cSqrt(disc), negb={re:-b.re,im:-b.im}, twoa=Cx.mul({re:2,im:0},a);
    return [ Cx.div(Cx.add(negb,s),twoa), Cx.div(Cx.sub(negb,s),twoa) ];
  }
}

export { BLT };
//# sourceMappingURL=BLT.js.map

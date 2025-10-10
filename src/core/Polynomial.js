// Polynomial operations
import { Cx } from "./Complex.js";

// Ascending coefficients: [a0, a1, ... aN] => a0 z^N + a1 z^(N-1) + ... + aN
export class Poly {
  static evalRealAsc(coeffs, z){
    let res={re:coeffs[0], im:0};
    for(let i=1;i<coeffs.length;i++) res = Cx.add(Cx.mul(res,z), {re:coeffs[i], im:0});
    return res;
  }
}

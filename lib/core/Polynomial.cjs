'use strict';

var core_Complex = require('./Complex.cjs');

// Polynomial operations

// Ascending coefficients: [a0, a1, ... aN] => a0 z^N + a1 z^(N-1) + ... + aN
class Poly {
  static evalRealAsc(coeffs, z){
    let res={re:coeffs[0], im:0};
    for(let i=1;i<coeffs.length;i++) res = core_Complex.Cx.add(core_Complex.Cx.mul(res,z), {re:coeffs[i], im:0});
    return res;
  }
}

exports.Poly = Poly;
//# sourceMappingURL=Polynomial.cjs.map

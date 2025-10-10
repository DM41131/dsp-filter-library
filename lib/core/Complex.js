// Complex number operations
class Cx {
    static add(a,b){ return {re:a.re+b.re, im:a.im+b.im}; }
    static sub(a,b){ return {re:a.re-b.re, im:a.im-b.im}; }
    static mul(a,b){ return {re:a.re*b.re-a.im*b.im, im:a.re*b.im+a.im*b.re}; }
    static div(a,b){ const d=b.re*b.re+b.im*b.im||1e-300; return {re:(a.re*b.re+a.im*b.im)/d, im:(a.im*b.re-a.re*b.im)/d}; }
    static abs(a){ return Math.hypot(a.re, a.im); }
    static conj(a){ return {re:a.re, im:-a.im}; }
  }

export { Cx };
//# sourceMappingURL=Complex.js.map

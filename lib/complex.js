// complex.js — Complex number operations for DSP
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

/**
 * @typedef {{re:number, im:number}} Complex
 */

/**
 * Complex number operations for digital signal processing
 */
class ComplexNum {
    /** @returns {Complex} */ 
    static of(re = 0, im = 0) { 
        return { re, im }; 
    }
    
    /** @returns {Complex} */ 
    static add(a, b) { 
        return { re: a.re + b.re, im: a.im + b.im }; 
    }
    
    /** @returns {Complex} */ 
    static sub(a, b) { 
        return { re: a.re - b.re, im: a.im - b.im }; 
    }
    
    /** @returns {Complex} */ 
    static mul(a, b) { 
        return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; 
    }
    
    /** @returns {Complex} */ 
    static scale(a, s) { 
        return { re: a.re * s, im: a.im * s }; 
    }
    
    /** @returns {Complex} */ 
    static conj(a) { 
        return { re: a.re, im: -a.im }; 
    }
    
    /** @returns {Complex} */ 
    static div(a, b) {
        const d = b.re*b.re + b.im*b.im || 1e-300;
        return { re: (a.re*b.re + a.im*b.im)/d, im: (a.im*b.re - a.re*b.im)/d };
    }
    
    /** @returns {number} */ 
    static abs(a) { 
        return Math.hypot(a.re, a.im); 
    }
    
    /** @returns {number} */ 
    static arg(a) { 
        return Math.atan2(a.im, a.re); 
    }
    
    /** @returns {Complex} */ 
    static expj(theta) { 
        return { re: Math.cos(theta), im: Math.sin(theta) }; 
    }
    
    /** @returns {Complex} */ 
    static pow(a, n) {
        if (n === 0) return { re: 1, im: 0 };
        if (n === 1) return a;
        if (n === -1) return C.div({ re: 1, im: 0 }, a);
        
        if (n > 0) {
            let result = { re: 1, im: 0 };
            for (let i = 0; i < n; i++) {
                result = C.mul(result, a);
            }
            return result;
        } else {
            // For negative powers, use 1/a^n
            let result = { re: 1, im: 0 };
            for (let i = 0; i < -n; i++) {
                result = C.mul(result, a);
            }
            return C.div({ re: 1, im: 0 }, result);
        }
    }
    
    /** @returns {Complex} */ 
    static sqrt(a) {
        const r = Math.sqrt(C.abs(a));
        const theta = Math.atan2(a.im, a.re) / 2;
        return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
    }
}

// Legacy alias for backward compatibility
const C = ComplexNum;

export { C, ComplexNum };
//# sourceMappingURL=complex.js.map

'use strict';

var complex = require('./complex.cjs');
var utils = require('./utils.cjs');

// zdomain.js — Z-domain operations for DSP
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * @typedef {{w:number[], H:Complex[], mag:number[], phase:number[]}} FreqResponse
 */

/**
 * Z-domain operations for digital signal processing
 */
class ZDomain {
    /** @returns {Complex} */
    static evalHz(b, a, z) {
        const zinv = complex.ComplexNum.div(complex.ComplexNum.of(1,0), z);
        const pow = (k) => {
            let p = complex.ComplexNum.of(1,0);
            for (let i = 0; i < k; i++) p = complex.ComplexNum.mul(p, zinv);
            return p;
        };
        let num = complex.ComplexNum.of(0,0);
        for (let k = 0; k < b.length; k++) num = complex.ComplexNum.add(num, complex.ComplexNum.scale(pow(k), b[k]));
        let den = complex.ComplexNum.of(1,0);
        for (let k = 1; k < a.length; k++) den = complex.ComplexNum.add(den, complex.ComplexNum.scale(pow(k), a[k]));
        return complex.ComplexNum.div(num, den);
    }
    
    /** @returns {FreqResponse} */
    static freqz(b, a, N = 512) {
        const w = utils.Util.linspace(0, Math.PI, N);
        const H = w.map(wi => ZDomain.evalHz(b, a, complex.ComplexNum.expj(wi)));
        const mag = H.map(complex.ComplexNum.abs);
        const phase = H.map(complex.ComplexNum.arg);
        return { w, H, mag, phase };
    }
    
    static groupDelay(b, a, N = 512) {
        const { w, phase } = ZDomain.freqz(b, a, N);
        const unwrapped = [...phase];
        for (let i = 1; i < unwrapped.length; i++) {
            let d = unwrapped[i] - unwrapped[i-1];
            while (d > Math.PI) { unwrapped[i] -= 2*Math.PI; d -= 2*Math.PI; }
            while (d < -Math.PI) { unwrapped[i] += 2*Math.PI; d += 2*Math.PI; }
        }
        const dw = w[1] - w[0];
        const gd = unwrapped.map((_, i) => (i === 0 || i === unwrapped.length - 1) ? 0
            : -(unwrapped[i+1] - unwrapped[i-1]) / (2*dw));
        return { w, gd };
    }
    
    static isStable(/* a */) { 
        return true; // placeholder
    }
}

exports.ZDomain = ZDomain;
//# sourceMappingURL=zdomain.cjs.map

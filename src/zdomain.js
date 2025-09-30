// zdomain.js — Z-domain operations for DSP
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';
import { Util } from './utils.js';

/**
 * @typedef {{w:number[], H:Complex[], mag:number[], phase:number[]}} FreqResponse
 */

/**
 * Z-domain operations for digital signal processing
 */
export class ZDomain {
    /** @returns {Complex} */
    static evalHz(b, a, z) {
        const zinv = C.div(C.of(1,0), z);
        const pow = (k) => {
            let p = C.of(1,0);
            for (let i = 0; i < k; i++) p = C.mul(p, zinv);
            return p;
        };
        let num = C.of(0,0);
        for (let k = 0; k < b.length; k++) num = C.add(num, C.scale(pow(k), b[k]));
        let den = C.of(1,0);
        for (let k = 1; k < a.length; k++) den = C.add(den, C.scale(pow(k), a[k]));
        return C.div(num, den);
    }
    
    /** @returns {FreqResponse} */
    static freqz(b, a, N = 512) {
        const w = Util.linspace(0, Math.PI, N);
        const H = w.map(wi => ZDomain.evalHz(b, a, C.expj(wi)));
        const mag = H.map(C.abs);
        const phase = H.map(C.arg);
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

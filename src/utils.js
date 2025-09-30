// utils.js — Mathematical utilities for DSP
// License: MIT

import { ComplexNum as C } from './complex.js';

/**
 * Utility functions for digital signal processing
 */
export class Util {
    static nextPow2(n) { 
        let p = 1; 
        while (p < n) p <<= 1; 
        return p; 
    }
    
    static clamp(v, lo, hi) { 
        return Math.min(hi, Math.max(lo, v)); 
    }
    
    static linspace(start, end, n) {
        if (n <= 1) return [start];
        const step = (end - start) / (n - 1);
        return Array.from({ length: n }, (_, i) => start + i * step);
    }
    
    /** Horner's method for real or complex polynomial evaluation */
    static polyval(c, z) {
        if (typeof z === 'number') {
            let y = 0;
            for (let i = 0; i < c.length; i++) y = y * z + c[i];
            return y;
        } else {
            let y = C.of(0, 0);
            for (let i = 0; i < c.length; i++) y = C.add(C.mul(y, z), C.of(c[i], 0));
            return y;
        }
    }
    
    static convolve(x, h) {
        const y = new Array(x.length + h.length - 1).fill(0);
        for (let i = 0; i < x.length; i++) {
            const xi = x[i];
            for (let j = 0; j < h.length; j++) y[i + j] += xi * h[j];
        }
        return y;
    }
    
    static polymul(a, b) {
        const na = a.length, nb = b.length;
        const r = new Array(na + nb - 1).fill(0);
        for (let i = 0; i < na; i++)
            for (let j = 0; j < nb; j++)
                r[i + j] += a[i] * b[j];
        return r;
    }
    
    /** Real-coefficient polynomial from complex roots (pairs conjugates) */
    static polyfromroots(roots) {
        const used = new Array(roots.length).fill(false);
        let p = [1];
        for (let i = 0; i < roots.length; i++) {
            if (used[i]) continue;
            const r = roots[i];
            let paired = -1;
            for (let j = i + 1; j < roots.length; j++) {
                if (used[j]) continue;
                const s = roots[j];
                if (Math.abs(r.re - s.re) < 1e-12 && Math.abs(r.im + s.im) < 1e-12) { 
                    paired = j; 
                    break; 
                }
            }
            if (Math.abs(r.im) < 1e-14 || paired < 0) {
                p = Util.polymul(p, [1, -r.re]);
                used[i] = true;
            } else {
                const a2 = [1, -2*r.re, r.re*r.re + r.im*r.im];
                p = Util.polymul(p, a2);
                used[i] = used[paired] = true;
            }
        }
        return p;
    }
}

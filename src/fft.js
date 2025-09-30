// fft.js — Fast Fourier Transform operations
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';
import { Util } from './utils.js';

/**
 * Fast Fourier Transform operations for digital signal processing
 */
export class FFT {
    /** @param {Complex[]} x */
    static fft(x) {
        let n = x.length;
        if (n <= 1) return x;
        if ((n & (n - 1)) !== 0) {
            const m = Util.nextPow2(n);
            return FFT.fft(x.concat(Array.from({ length: m - n }, () => C.of(0, 0))));
        }
        // bit-reverse
        let j = 0;
        for (let i = 1; i < n - 1; i++) {
            let bit = n >> 1;
            for (; j & bit; bit >>= 1) j ^= bit;
            j ^= bit;
            if (i < j) { const t = x[i]; x[i] = x[j]; x[j] = t; }
        }
        // stages
        for (let len = 2; len <= n; len <<= 1) {
            const ang = -2 * Math.PI / len;
            for (let i = 0; i < n; i += len) {
                for (let k = 0; k < len / 2; k++) {
                    const w = C.expj(ang * k);
                    const u = x[i + k];
                    const v = C.mul(x[i + k + (len >> 1)], w);
                    x[i + k] = C.add(u, v);
                    x[i + k + (len >> 1)] = C.sub(u, v);
                }
            }
        }
        return x;
    }
    
    /** @param {Complex[]} X */
    static ifft(X) {
        const n = X.length;
        return FFT.fft(X.map(C.conj)).map(C.conj).map(v => C.scale(v, 1 / n));
    }
    
    /** @param {number[]} x */
    static rfft(x) {
        const n = Util.nextPow2(x.length);
        const a = Array.from({ length: n }, (_, i) => C.of(x[i] || 0, 0));
        return FFT.fft(a);
    }
    
    /** @param {number[]} x */
    static powerSpectrum(x) {
        return FFT.rfft(x).map(C.abs).map(v => v*v);
    }
}

'use strict';

var complex = require('./complex.cjs');
var utils = require('./utils.cjs');
var fft = require('./fft.cjs');
var windows = require('./windows.cjs');

// fir.js — Finite Impulse Response filter design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FiltKind
 * @typedef {{b:number[], a:number[]}} TF
 */

/**
 * FIR filter kernels and design functions
 */
class Kernels {
    static sinc(x) { 
        return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); 
    }
    
    static idealLowpass(fc, fs, N) {
        const M = N - 1, norm = fc / fs;
        return Array.from({ length: N }, (_, n) => Kernels.sinc((n - M/2) * 2 * norm));
    }
}

/**
 * FIR filter designer
 */
class FIRDesigner {
    /**
     * @param {FiltKind} kind
     * @param {number|[number,number]} cutoffHz
     * @param {number} fs
     * @param {number} order
     * @param {string} window
     * @returns {TF}
     */
    static design(kind, cutoffHz, fs, order, window = 'hann') {
        const N = order + 1;
        const win = windows.Window.byName(window, N);
        const M = N - 1;
        const applyWin = (h) => h.map((v, i) => v * win[i]);

        if (kind === 'lowpass') {
            const fc = /** @type {number} */(cutoffHz);
            let h = Kernels.idealLowpass(fc, fs, N);
            const scale = 2 * fc / fs;
            h = h.map(v => v * scale);
            return { b: applyWin(h), a: [1] };
        }
        if (kind === 'highpass') {
            const fc = /** @type {number} */(cutoffHz);
            const lp = FIRDesigner.design('lowpass', fc, fs, order, window).b;
            const b = lp.map((v, n) => (n === M/2 ? 1 - v : -v));
            return { b, a: [1] };
        }
        if (kind === 'bandpass') {
            const [f1, f2] = /** @type {[number,number]} */(cutoffHz);
            const lp2 = FIRDesigner.design('lowpass', f2, fs, order, window).b;
            const lp1 = FIRDesigner.design('lowpass', f1, fs, order, window).b;
            const b = lp2.map((v, i) => v - lp1[i]);
            return { b, a: [1] };
        }
        if (kind === 'bandstop') {
            const [f1, f2] = /** @type {[number,number]} */(cutoffHz);
            const bp = FIRDesigner.design('bandpass', [f1, f2], fs, order, window).b;
            const b = bp.map((v, n) => (n === M/2 ? 1 - v : -v));
            return { b, a: [1] };
        }
        throw new Error('Unsupported FIR type');
    }

    static apply(b, x) { 
        return utils.Util.convolve(x, b); 
    }

    static overlapAdd(b, x, blockSize) {
        const L = blockSize || 1024;
        const M = b.length;
        const Nfft = utils.Util.nextPow2(L + M - 1);
        const B = fft.FFT.fft(Array.from({ length: Nfft }, (_, i) => complex.ComplexNum.of(b[i] || 0, 0)));
        const y = new Array(x.length + M - 1).fill(0);
        for (let start = 0; start < x.length; start += L) {
            const xblk = Array.from({ length: Nfft }, (_, i) => complex.ComplexNum.of(x[start + i] || 0, 0));
            const X = fft.FFT.fft(xblk);
            const Y = X.map((Xk, k) => complex.ComplexNum.mul(Xk, B[k]));
            const yblk = fft.FFT.ifft(Y);
            for (let i = 0; i < L + M - 1; i++) y[start + i] += yblk[i].re;
        }
        return y;
    }
}

exports.FIRDesigner = FIRDesigner;
exports.Kernels = Kernels;
//# sourceMappingURL=fir.cjs.map

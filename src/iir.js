// iir.js — Infinite Impulse Response filter design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';
import { Util } from './utils.js';
import { FIRDesigner } from './fir.js';

/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FiltKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad // a = [1,a1,a2]
 */

/**
 * Bilinear transformation utilities
 */
export class Bilinear {
    /** prewarp digital edge f(Hz) -> analog Ω(rad/s) */
    static prewarp(fHz, fs) { 
        return 2 * fs * Math.tan(Math.PI * fHz / fs); 
    }
}

/**
 * IIR filter designer (Butterworth & Chebyshev I)
 */
export class IIRDesigner {
    // ---- Butterworth poles (normalized) ----
    static butterworthPoles(n) {
        const poles = [];
        for (let k = 0; k < n; k++) {
            const theta = Math.PI * (2*k + 1 + n) / (2*n);
            const p = C.of(Math.cos(theta), Math.sin(theta));
            if (p.re < 0) poles.push(p);
        }
        return poles;
    }

    // ---- Chebyshev I poles (normalized), rp in dB ----
    static cheby1Poles(n, rp = 1) {
        const eps = Math.sqrt(Math.pow(10, rp / 10) - 1);
        const asinh = (x) => Math.log(x + Math.sqrt(x*x + 1));
        const alpha = asinh(1/eps) / n;
        const sinhA = Math.sinh(alpha), coshA = Math.cosh(alpha);
        const poles = [];
        for (let k = 0; k < n; k++) {
            const theta = Math.PI * (2*k + 1) / (2*n);
            const re = -sinhA * Math.sin(theta);
            const im =  coshA * Math.cos(theta);
            const p = C.of(re, im);
            if (p.re < 0) poles.push(p);
        }
        return poles;
    }

    static pairConjugates(list) {
        const used = new Array(list.length).fill(false);
        const out = [];
        for (let i = 0; i < list.length; i++) {
            if (used[i]) continue;
            const p = list[i];
            let pair = -1;
            for (let j = i + 1; j < list.length; j++) {
                if (used[j]) continue;
                const q = list[j];
                if (Math.abs(p.re - q.re) < 1e-12 && Math.abs(p.im + q.im) < 1e-12) { 
                    pair = j; 
                    break; 
                }
            }
            if (pair >= 0) { 
                out.push([p, list[pair]]); 
                used[i] = used[pair] = true; 
            }
            else { 
                out.push([p]); 
                used[i] = true; 
            }
        }
        return out;
    }

    /** Build digital biquad from analog a2 s^2 + a1 s + a0 via bilinear; numerator shaped by kind (LP/HP). */
    static bilinearBiquad(a2, a1, a0, kind, fs) {
        const T = 1 / fs;
        const K = 2 / T;
        // Denominator mapping
        const d0 = a2*K*K + a1*K + a0;
        const d1 = -2*a2*K*K + 2*a0;
        const d2 = a2*K*K - a1*K + a0;
        /** @type {[number,number,number]} */ const a = [1, d1/d0, d2/d0];

        // Numerator prototype (cascaded then globally normalized)
        let b;
        if (kind === 'lowpass') b = [1, 2, 1];
        else if (kind === 'highpass') b = [1, -2, 1];
        else b = [1, 0, -1]; // not used (BP/BS via FIR fallback)
        return { b, a };
    }

    /** Convert poles -> cascade of biquads (SOS), then polynomial and global gain normalization. */
    static fromPrototype(kind, fs, poles, normalizeAt /* 1| -1 */) {
        /** @type {Biquad[]} */
        const sections = [];

        const pairs = IIRDesigner.pairConjugates(poles);
        for (const pair of pairs) {
            const [p1, p2] = pair.length === 2 ? pair : [pair[0], null];
            // Analog quadratic a2 s^2 + a1 s + a0
            let a2, a1, a0;
            if (p2) {
                const Re2 = -2 * p1.re; // (s - p)(s - p*) = s^2 - 2Re(p)s + |p|^2
                const mag2 = p1.re*p1.re + p1.im*p1.im;
                a2 = 1; a1 = Re2; a0 = mag2;
            } else {
                // single pole (odd order)
                a2 = 0; a1 = 1; a0 = -p1.re;
            }
            sections.push(IIRDesigner.bilinearBiquad(a2, a1, a0, kind, fs));
        }

        // Build overall polynomials (for compatibility) & normalize global gain
        let bPoly = [1], aPoly = [1];
        for (const s of sections) {
            bPoly = Util.polymul(bPoly, s.b);
            aPoly = Util.polymul(aPoly, s.a);
        }
        const evalHzAtZ = (b, a, z0) => {
            const num = b.reduce((acc, bi, i) => acc + bi * Math.pow(z0, -i), 0);
            const den = a.reduce((acc, ai, i) => acc + ai * Math.pow(z0, -i), 0);
            return num / den;
        };
        const z0 = normalizeAt;
        const g = 1 / evalHzAtZ(bPoly, aPoly, z0);
        bPoly = bPoly.map(v => v * g);
        for (const s of sections) s.b = s.b.map(v => v * g); // distribute gain across first section is typical; here we scale all equally
        // normalize a[0] = 1
        const gain = aPoly[0];
        if (Math.abs(gain - 1) > 1e-14) {
            bPoly = bPoly.map(v => v / gain);
            aPoly = aPoly.map(v => v / gain);
            for (const s of sections) {
                s.b = s.b.map(v => v / gain);
                s.a = [1, s.a[1]/gain, s.a[2]/gain];
            }
        }

        return { b: bPoly, a: aPoly, sections };
    }

    /** Butterworth (LP/HP); BP/BS -> FIR fallback */
    static butterworth(kind, cutoffHz, fs, order) {
        if (order < 1) throw new Error('Order must be >= 1');
        if (kind === 'lowpass' || kind === 'highpass') {
            const fc = /** @type {number} */(cutoffHz);
            const pre = Bilinear.prewarp(fc, fs);
            const poles = IIRDesigner.butterworthPoles(order).map(p => C.scale(p, pre));
            const normZ = (kind === 'lowpass') ? 1 : -1;
            const tf = IIRDesigner.fromPrototype(kind, fs, poles, normZ);
            return { b: tf.b, a: tf.a, sections: tf.sections };
        }
        if (kind === 'bandpass' || kind === 'bandstop') {
            const [f1, f2] = /** @type {[number,number]} */(cutoffHz);
            if (!(f1 > 0 && f2 > f1 && f2 < fs/2)) throw new Error('Invalid band edges');
            const orderFIR = Math.max(64, order * 8);
            const tf = FIRDesigner.design(kind, [f1, f2], fs, orderFIR, 'hamming');
            return { b: tf.b, a: tf.a, sections: [] }; // FIR
        }
        throw new Error('Unsupported IIR kind');
    }

    /** Chebyshev Type I (LP/HP); BP/BS -> FIR fallback */
    static cheby1(kind, cutoffHz, fs, order, rp = 1) {
        if (order < 1) throw new Error('Order must be >= 1');
        if (kind === 'lowpass' || kind === 'highpass') {
            const fc = /** @type {number} */(cutoffHz);
            const pre = Bilinear.prewarp(fc, fs);
            const poles = IIRDesigner.cheby1Poles(order, rp).map(p => C.scale(p, pre));
            const normZ = (kind === 'lowpass') ? 1 : -1;
            const tf = IIRDesigner.fromPrototype(kind, fs, poles, normZ);
            return { b: tf.b, a: tf.a, sections: tf.sections };
        }
        if (kind === 'bandpass' || kind === 'bandstop') {
            const [f1, f2] = /** @type {[number,number]} */(cutoffHz);
            if (!(f1 > 0 && f2 > f1 && f2 < fs/2)) throw new Error('Invalid band edges');
            const orderFIR = Math.max(64, order * 8);
            const tf = FIRDesigner.design(kind, [f1, f2], fs, orderFIR, 'hamming');
            return { b: tf.b, a: tf.a, sections: [] };
        }
        throw new Error('Unsupported IIR kind');
    }
}

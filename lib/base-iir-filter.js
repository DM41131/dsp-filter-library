import { ComplexNum } from './complex.js';
import { Util } from './utils.js';

// base-iir-filter.js — Common IIR helper (analog prototype -> digital)
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 */

/** Helper to convert analog prototype (z,p,k) into digital (b,a) for different kinds */
class BaseIIRFilter {
  /**
   * Map normalized lowpass prototype (Ωc=1) to target kind/frequencies,
   * apply bilinear transform, and normalize digital gain.
   *
   * @param {FilterKind} kind
   * @param {number|number[]} cutoffHz  One freq for LP/HP, [f1,f2] for BP/BS
   * @param {number} fs
   * @param {{z:{re:number,im:number}[], p:{re:number,im:number}[], k:number}} proto  analog LP (Ωc=1)
   * @returns {{b:number[], a:number[], sections: {b:number[], a:[number,number,number]}[] }}
   */
  static realize(kind, cutoffHz, fs, proto) {
    // 1) Prewarp
    let w1, w2, B, w0;
    if (kind === 'lowpass' || kind === 'highpass') {
      w1 = Util.prewarp(/** @type {number} */(cutoffHz), fs);
    } else {
      const [f1, f2] = /** @type {[number,number]} */(cutoffHz);
      w1 = Util.prewarp(f1, fs);
      w2 = Util.prewarp(f2, fs);
      B  = w2 - w1;
      w0 = Math.sqrt(w1 * w2);
    }
    const mapHP = (s) => ComplexNum.div(ComplexNum.of(w1, 0), s);
    const mapBP = (s) => {
      // Bandpass transformation: s -> (s^2 + w0^2) / (B * s)
      // This transforms each pole/zero s_lp into two poles/zeros
      
      if (Math.abs(s.re) < 1e-14 && Math.abs(s.im) < 1e-14) {
        // Handle s=0 case (zeros at origin in LP)
        return [ComplexNum.of(0, w0), ComplexNum.of(0, -w0)];
      }
      
      // For bandpass: s_new = (B * s_lp ± sqrt((B * s_lp)^2 - 4 * w0^2)) / 2
      const Bs = ComplexNum.scale(s, B);
      const w02 = ComplexNum.of(w0 * w0, 0);
      
      // Calculate discriminant: (B * s_lp)^2 - 4 * w0^2
      const Bs2 = ComplexNum.mul(Bs, Bs);
      const fourW02 = ComplexNum.scale(w02, 4);
      const discriminant = ComplexNum.sub(Bs2, fourW02);
      const sqrtDisc = ComplexSqrt(discriminant);
      
      // Two solutions
      const s1 = ComplexNum.scale(ComplexNum.add(Bs, sqrtDisc), 0.5);
      const s2 = ComplexNum.scale(ComplexNum.sub(Bs, sqrtDisc), 0.5);
      
      return [s1, s2];
    };
    
    const mapBS = (s) => {
      // Bandstop transformation: s -> (B * s) / (s^2 + w0^2)
      // This transforms each pole/zero s_lp into two poles/zeros
      
      if (Math.abs(s.re) < 1e-14 && Math.abs(s.im) < 1e-14) {
        // Handle s=0 case
        return [ComplexNum.of(0, 0), ComplexNum.of(0, 0)];
      }
      
      // For bandstop: solve s_lp = (B * s) / (s^2 + w0^2)
      // This gives: s_lp * s^2 - B * s + s_lp * w0^2 = 0
      const Bs = ComplexNum.scale(s, B);
      const sW02 = ComplexNum.mul(s, ComplexNum.of(w0 * w0, 0));
      
      // Discriminant: B^2 - 4 * s_lp^2 * w0^2
      const B2 = ComplexNum.mul(Bs, Bs);
      const fourSW02 = ComplexNum.scale(sW02, 4);
      const discriminant = ComplexNum.sub(B2, fourSW02);
      const sqrtDisc = ComplexSqrt(discriminant);
      
      // Two solutions
      const denom = ComplexNum.scale(s, 2);
      const s1 = ComplexNum.div(ComplexNum.add(Bs, sqrtDisc), denom);
      const s2 = ComplexNum.div(ComplexNum.sub(Bs, sqrtDisc), denom);
      
      return [s1, s2];
    };

    /** @param {{re:number,im:number}} c */
    function ComplexSqrt(c) {
      const r = Math.hypot(c.re, c.im);
      const u = Math.sqrt((r + c.re) / 2);
      const v = (c.im >= 0 ? 1 : -1) * Math.sqrt((r - c.re) / 2);
      return { re: u, im: v };
    }

    // Expand mapped zeros/poles
    let zA = [];
    let pA = [];

    const push = (arr, val) => { Array.isArray(val) ? arr.push(...val) : arr.push(val); };

    if (kind === 'lowpass') {
      for (const s of proto.z) push(zA, ComplexNum.scale(s, w1));
      for (const p of proto.p) push(pA, ComplexNum.scale(p, w1));
    } else if (kind === 'highpass') {
      for (const s of proto.z) {
        if (Math.abs(s.re) < 1e-14 && Math.abs(s.im) < 1e-14) {
          // skip s=0 to avoid division by zero (it maps to infinity)
          continue;
        }
        push(zA, mapHP(s));
      }
      for (const p of proto.p) push(pA, mapHP(p));
      // Add zeros at s=0 to balance order
      const extraZeros = Math.max(0, pA.length - zA.length);
      for (let i = 0; i < extraZeros; i++) zA.push(ComplexNum.of(0, 0));
    } else if (kind === 'bandpass') {
      for (const s of proto.z) push(zA, mapBP(s));
      for (const p of proto.p) push(pA, mapBP(p));
      // For bandpass, add zeros at s=0 to maintain proper order
      // This ensures the filter has the correct number of zeros
      const orderDiff = pA.length - zA.length;
      for (let i = 0; i < orderDiff; i++) {
        zA.push(ComplexNum.of(0, 0));
      }
    } else if (kind === 'bandstop') {
      for (const s of proto.z) push(zA, mapBS(s));
      for (const p of proto.p) push(pA, mapBS(p));
      // For bandstop, add zeros at s = ±j w0 to create symmetric notch
      // This ensures the filter has zeros at the center frequency
      const orderDiff = pA.length - zA.length;
      for (let i = 0; i < orderDiff; i += 2) {
        zA.push(ComplexNum.of(0,  w0));
        zA.push(ComplexNum.of(0, -w0));
      }
      // If odd number of zeros needed, add one more at center
      if (orderDiff % 2 === 1) {
        zA.push(ComplexNum.of(0, 0));
      }
    }

    // 3) Bilinear transform to digital
    const { z, p, k } = Util.bilinearZPK(zA, pA, proto.k || 1, fs);
    let { b, a } = Util.zpk2tf(z, p, k);

    // 4) Normalize digital gain at a sensible frequency for symmetric response
    let z0;
    if (kind === 'lowpass') {
      z0 = { re: 1, im: 0 }; // DC
    } else if (kind === 'highpass') {
      z0 = { re: -1, im: 0 }; // Nyquist
    } else if (kind === 'bandpass') {
      // Normalize at center frequency for symmetric bandpass response
      const f0 = Math.sqrt(/** @type {[number,number]} */(cutoffHz)[0] * /** @type {[number,number]} */(cutoffHz)[1]);
      const w = 2 * Math.PI * (f0 / fs);
      z0 = { re: Math.cos(w), im: Math.sin(w) };
    } else { // bandstop
      // For bandstop, normalize at center frequency to ensure symmetric notch
      const f0 = Math.sqrt(/** @type {[number,number]} */(cutoffHz)[0] * /** @type {[number,number]} */(cutoffHz)[1]);
      const w = 2 * Math.PI * (f0 / fs);
      z0 = { re: Math.cos(w), im: Math.sin(w) };
    }
    // Compute |H(z0)| and scale numerator
    const H = (() => {
      let num = { re: 0, im: 0 }, den = { re: 0, im: 0 };
      let zk = { re: 1, im: 0 };
      const zinv = { re: z0.re, im: -z0.im };
      const mul = (x, y) => ({ re: x.re * y.re - x.im * y.im, im: x.re * y.im + x.im * y.re });
      const add = (x, y) => ({ re: x.re + y.re, im: x.im + y.im });
      for (let i = 0; i < Math.max(b.length, a.length); i++) {
        if (i < b.length) num = add(num, { re: zk.re * b[i], im: zk.im * b[i] });
        if (i < a.length) den = add(den, { re: zk.re * a[i], im: zk.im * a[i] });
        zk = mul(zk, zinv);
      }
      const d = den.re * den.re + den.im * den.im || 1e-300;
      return Math.hypot((num.re * den.re + num.im * den.im) / d, (num.im * den.re - num.re * den.im) / d);
    })();
    if (H > 0) b = b.map(v => v / H);

    return { b, a, sections: [] };
  }
}

export { BaseIIRFilter, BaseIIRFilter as default };
//# sourceMappingURL=base-iir-filter.js.map

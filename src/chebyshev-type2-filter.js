// chebyshev-type2-filter.js — Chebyshev Type 2 (inverse Chebyshev) filter design implementation
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';
import { Util } from './utils.js';
import { BaseIIRFilter } from './base-iir-filter.js';

/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad
 * @typedef {{b: number[], a: number[], sections: Biquad[]}} FilterResult
 */

/**
 * Chebyshev Type 2 (inverse Chebyshev) filter design class
 * Provides a clean, focused interface for Chebyshev Type 2 filter generation
 */
export class ChebyshevType2Filter extends BaseIIRFilter {
  /**
   * Validates Chebyshev Type 2 filter parameters
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} stopbandAttenuation - Stopband attenuation in dB
   * @throws {Error} If parameters are invalid
   */
  static validateParameters(kind, cutoffHz, fs, order, stopbandAttenuation) {
    // Use base class validation first (this exists in your base file)
    ChebyshevType2Filter.validateCommonParameters(kind, cutoffHz, fs, order);

    // Additional Chebyshev Type 2-specific validation
    if (!(stopbandAttenuation > 0)) {
      throw new Error('Stopband attenuation must be positive');
    }
  }

  /**
   * Calculates normalized inverse-Chebyshev (Type-II) prototype poles and zeros (Ωc=1)
   * Zeros lie on jΩ axis at Ωz = ±sec(theta_k), producing equiripple stopband.
   * @param {number} order
   * @param {number} rs Stopband attenuation in dB
   * @returns {{poles: {re:number,im:number}[], zerosW: number[]}} zerosW are positive Ωz values (we'll add ± pairs)
   */
  static calculatePolesAndZeros(order, rs) {
    // eps2 = 1/(10^(rs/10) - 1); using parameterization with a = asinh(1/sqrt(eps2))/n
    const eps2 = 1 / (Math.pow(10, rs / 10) - 1);
    const a = Math.asinh(1 / Math.sqrt(eps2)) / order;

    const poles = [];
    for (let k = 1; k <= order; k++) {
      const theta = Math.PI * (2 * k - 1) / (2 * order);
      const re = -Math.sinh(a) * Math.sin(theta);
      const im =  Math.cosh(a) * Math.cos(theta);
      poles.push(C.of(re, im));
    }

    // Positive-frequency zero magnitudes (we'll create ±jΩ for each)
    const zerosW = [];
    const m = Math.floor(order / 2);
    for (let k = 1; k <= m; k++) {
      const theta = Math.PI * (2 * k - 1) / (2 * order);
      zerosW.push(1 / Math.cos(theta)); // sec(theta)
    }

    return { poles, zerosW };
  }

  /**
   * Build LP analog biquad from a conjugate pole pair and an optional zero pair (at ±jΩz).
   * The section is then frequency-scaled by Ωc (= wc) and bilinear-mapped to digital.
   * @param {'lowpass'|'highpass'} kind
   * @param {{re:number, im:number}[]} polePair length 1 or 2 (conjugate pair)
   * @param {number|null} zeroW positive Ωz for zero pair, or null if no finite zeros in this section
   * @param {number} wc prewarped edge (Ωc)
   * @param {number} fs sampling rate (Hz)
   * @returns {Biquad} digital biquad (b,a) with a0=1
   */
  static mapSectionLP_HP(kind, polePair, zeroW, wc, fs) {
    // Denominator LP prototype (normalized at Ωc=1):
    let a2_lp, a1_lp, a0_lp;
    if (polePair.length === 2) {
      const p = polePair[0]; // conjugate partner implied
      a2_lp = 1;
      a1_lp = -2 * p.re;
      a0_lp = p.re * p.re + p.im * p.im;
    } else {
      // First-order leftover when order is odd
      const p = polePair[0];
      a2_lp = 0; a1_lp = 1; a0_lp = -p.re;
    }

    // Numerator LP prototype: either unity (no finite zeros) or s^2 + Ωz^2
    let b2_lp, b1_lp, b0_lp;
    if (zeroW != null) {
      b2_lp = 1; b1_lp = 0; b0_lp = zeroW * zeroW;
    } else {
      // No finite zeros for this section (odd-order leftover)
      b2_lp = 0; b1_lp = 0; b0_lp = 1;
    }

    // Frequency scaling to desired Ωc = wc and LP/HP analog mapping (mirror BaseIIRFilter logic)
    let A2, A1, A0, B2, B1, B0;

    if (kind === 'lowpass') {
      // LP: multiply s by wc in first-order coefficients
      A2 = a2_lp;        A1 = a1_lp * wc;        A0 = a0_lp * wc * wc;
      B2 = b2_lp;        B1 = b1_lp * wc;        B0 = b0_lp * wc * wc;
    } else {
      // HP: s -> wc/s
      if (a2_lp !== 0) {
        // second-order denominator
        A2 = a0_lp;      A1 = a1_lp * wc;        A0 = a2_lp * wc * wc;
      } else {
        // first-order denominator
        A2 = 0;          A1 = a0_lp;             A0 = a1_lp * wc;
      }

      // numerator mapping under s -> wc/s:
      if (b2_lp !== 0) {
        // b(s) = s^2 + (Ωz)^2 -> B(s) = (wc^2) + (Ωz^2) s^2   (after clearing 1/s^2)
        B2 = b0_lp;      B1 = b1_lp * wc;        B0 = b2_lp * wc * wc;
      } else if (b1_lp !== 0) {
        // (not used here) single zero → maps to s term after transform
        B2 = 0;          B1 = b0_lp;             B0 = b1_lp * wc;
      } else {
        // Constant numerator -> becomes s^2 term after clearing (zero at DC of order 2)
        B2 = b0_lp;      B1 = 0;                 B0 = 0;
      }
    }

    // Bilinear transform to digital
    return Util.bilinearMapBiquad(B2, B1, B0, A2, A1, A0, fs);
  }

  /**
   * LP / HP design with proper inverse-Chebyshev zeros
   * @param {'lowpass'|'highpass'} kind
   * @param {number} cutoffHz
   * @param {number} fs
   * @param {number} order
   * @param {number} rs
   * @returns {FilterResult}
   */
  static designLPHP(kind, cutoffHz, fs, order, rs) {
    const wc = Util.prewarp(cutoffHz, fs);
    const { poles, zerosW } = this.calculatePolesAndZeros(order, rs);

    // Pair poles for SOS
    const polePairs = Util.pairConjugates(poles);

    // Assign zero pairs to as many sections as available (floor(n/2) of them).
    const sections = [];
    let zi = 0;
    for (const pair of polePairs) {
      const zW = (zi < zerosW.length) ? zerosW[zi++] * wc : null; // scale Ωz by Ωc
      const sec = this.mapSectionLP_HP(kind, pair, zW, wc, fs);
      sections.push(sec);
    }

    // Compose overall polynomials
    let b = [1], a = [1];
    for (const s of sections) {
      b = Util.polymul(b, s.b);
      a = Util.polymul(a, s.a);
    }

    // Normalize digital gain
    const zNorm = (kind === 'lowpass') ? 1 : -1; // DC for LP, Nyquist for HP
    const g = 1 / Util.evalHzAtZ(b, a, zNorm);
    // Apply gain to the last section for numerical conditioning
    if (sections.length) {
      const L = sections.length - 1;
      sections[L] = { b: sections[L].b.map(v => v * g), a: sections[L].a.slice() };
      // Recompose b with gain
      b = [1]; a = [1];
      for (const s of sections) {
        b = Util.polymul(b, s.b);
        a = Util.polymul(a, s.a);
      }
    }

    return { b, a, sections };
  }

  /**
   * Designs a lowpass Chebyshev Type 2 filter
   */
  static designLowPass(cutoffHz, fs, order, stopbandAttenuation) {
    return this.designLPHP('lowpass', cutoffHz, fs, order, stopbandAttenuation);
  }

  /**
   * Designs a highpass Chebyshev Type 2 filter
   */
  static designHighPass(cutoffHz, fs, order, stopbandAttenuation) {
    return this.designLPHP('highpass', cutoffHz, fs, order, stopbandAttenuation);
  }

  /**
   * Designs a bandpass Chebyshev Type 2 filter (built from HP@f1 and LP@f2 cascaded)
   * NOTE: This is a practical IIR approach; full LP→BP analog transform can be added if desired.
   */
  static designBandPass(cutoffHz, fs, order, stopbandAttenuation) {
    const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
    const hp = this.designHighPass(f1, fs, order, stopbandAttenuation);
    const lp = this.designLowPass(f2, fs, order, stopbandAttenuation);
    return {
      b: Util.polymul(hp.b, lp.b),
      a: Util.polymul(hp.a, lp.a),
      sections: [...hp.sections, ...lp.sections]
    };
  }

  /**
   * Designs a bandstop Chebyshev Type 2 filter (parallel sum of LP@f1 and HP@f2)
   */
  static designBandStop(cutoffHz, fs, order, stopbandAttenuation) {
    const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
    const lp = this.designLowPass(f1, fs, order, stopbandAttenuation);
    const hp = this.designHighPass(f2, fs, order, stopbandAttenuation);

    const a = Util.polymul(lp.a, hp.a);
    const b_lp = Util.polymul(lp.b, hp.a);
    const b_hp = Util.polymul(hp.b, lp.a);
    const b = Util.polyadd(b_lp, b_hp);

    return { b, a, sections: [...lp.sections, ...hp.sections] };
  }

  /**
   * Designs a bandpass or bandstop Chebyshev Type 2 filter
   */
  static designBandPassStop(kind, cutoffHz, fs, order, stopbandAttenuation) {
    if (kind === 'bandpass') return this.designBandPass(cutoffHz, fs, order, stopbandAttenuation);
    if (kind === 'bandstop') return this.designBandStop(cutoffHz, fs, order, stopbandAttenuation);
    throw new Error('Unsupported filter kind for band design');
  }

  /**
   * Main design entry
   */
  static design(kind, cutoffHz, fs, order, stopbandAttenuation = 40) {
    this.validateParameters(kind, cutoffHz, fs, order, stopbandAttenuation);
    
    // Enforce maximum order limit for IIR filters
    if (order > 12) {
      throw new Error(`Chebyshev Type 2 filter order ${order} exceeds maximum allowed order of 12. For higher orders, consider using cascaded lower-order sections or alternative filter types.`);
    }
    
    if (kind === 'lowpass')  return this.designLowPass(cutoffHz, fs, order, stopbandAttenuation);
    if (kind === 'highpass') return this.designHighPass(cutoffHz, fs, order, stopbandAttenuation);
    if (kind === 'bandpass' || kind === 'bandstop')
      return this.designBandPassStop(kind, cutoffHz, fs, order, stopbandAttenuation);
    throw new Error('Unsupported filter kind');
  }
}

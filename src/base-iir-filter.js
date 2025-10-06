// base-iir-filter.js — Base class for IIR filter design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';
import { Util } from './utils.js';

/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad
 * @typedef {{b: number[], a: number[], sections: Biquad[]}} FilterResult
 */

/**
 * Abstract base class for IIR filter design
 * Provides common functionality and structure for all IIR filter types
 */
export class BaseIIRFilter {
  /**
   * Validates common filter parameters
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @throws {Error} If parameters are invalid
   */
  static validateCommonParameters(kind, cutoffHz, fs, order) {
    if (order < 1) {
      throw new Error('Order must be >= 1');
    }
    
    if (fs <= 0) {
      throw new Error('Sampling frequency must be positive');
    }
    
    if (kind === 'lowpass' || kind === 'highpass') {
      const fc = /** @type {number} */ (cutoffHz);
      if (fc <= 0 || fc >= fs / 2) {
        throw new Error('Cutoff frequency must be 0 < fc < fs/2');
      }
    } else if (kind === 'bandpass' || kind === 'bandstop') {
      const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
      if (!(f1 > 0 && f2 > f1 && f2 < fs / 2)) {
        throw new Error('Invalid band edges: must satisfy 0 < f1 < f2 < fs/2');
      }
    } else {
      throw new Error(`Unsupported filter kind: ${kind}`);
    }
  }


  /**
   * Builds filter from normalized prototype poles
   * @param {FilterKind} kind - Filter type
   * @param {number} fs - Sampling frequency
   * @param {C[]} polesNorm - Normalized poles
   * @param {number} normalizeAt - Normalization point (1 for LP, -1 for HP)
   * @param {number} wc - Prewarped cutoff frequency
   * @returns {FilterResult} Filter coefficients and sections
   */
  static fromPrototype(kind, fs, polesNorm, normalizeAt, wc) {
    /** @type {Biquad[]} */
    const sections = [];

    const pairs = Util.pairConjugates(polesNorm);
    for (const pair of pairs) {
      const [p1, p2] = pair.length === 2 ? pair : [pair[0], null];

      // LP (Ωp=1) quadratic
      let a2_lp, a1_lp, a0_lp;
      if (p2) {
        a2_lp = 1;
        a1_lp = -2 * p1.re;
        a0_lp = p1.re * p1.re + p1.im * p1.im;
      } else {
        a2_lp = 0; a1_lp = 1; a0_lp = -p1.re;
      }

      // Transform to analog LP/HP at Ωc = wc
      let A2, A1, A0; // denom
      let b2, b1, b0; // numer

      if (kind === 'lowpass') {
        A2 = a2_lp;
        A1 = a1_lp * wc;
        A0 = a0_lp * wc * wc;
        b2 = 0; b1 = 0; b0 = 1;              // constant numerator (LP)
      } else if (kind === 'highpass') {
        // s → Ωc/s
        if (a2_lp !== 0) {
          // second-order: a0 s^2 + a1 Ωc s + a2 Ωc^2
          A2 = a0_lp;
          A1 = a1_lp * wc;
          A0 = a2_lp * wc * wc;
          b2 = 1; b1 = 0; b0 = 0;            // s^2 ⇒ double zero at DC
        } else {
          // first-order: a0 s + a1 Ωc
          A2 = 0;
          A1 = a0_lp;
          A0 = a1_lp * wc;
          b2 = 0; b1 = 1; b0 = 0;            // s ⇒ single zero at DC
        }
      } else {
        throw new Error('fromPrototype supports only lowpass/highpass');
      }

      sections.push(Util.bilinearMapBiquad(b2, b1, b0, A2, A1, A0, fs));
    }

    // Compose polynomials, then digital normalization at z0.
    let bPoly = [1], aPoly = [1];
    for (const s of sections) { 
      bPoly = Util.polymul(bPoly, s.b); 
      aPoly = Util.polymul(aPoly, s.a); 
    }

    const g = 1 / Util.evalHzAtZ(bPoly, aPoly, normalizeAt);
    if (sections.length > 0) {
      // Apply to the LAST section for better conditioning
      const last = sections.length - 1;
      sections[last].b = sections[last].b.map(v => v * g);
    }

    // Recompute polynomials after gain distribution
    bPoly = [1]; aPoly = [1];
    for (const s of sections) { 
      bPoly = Util.polymul(bPoly, s.b); 
      aPoly = Util.polymul(aPoly, s.a); 
    }

    return { b: bPoly, a: aPoly, sections };
  }

  /**
   * Abstract method for pole calculation - must be implemented by subclasses
   * @param {number} order - Filter order
   * @param {...any} params - Additional parameters
   * @returns {C[]} Array of complex poles
   * @abstract
   */
  static calculatePoles(order, ...params) {
    throw new Error('calculatePoles must be implemented by subclass');
  }

  /**
   * Abstract method for filter design - must be implemented by subclasses
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {...any} params - Additional parameters
   * @returns {FilterResult} Filter coefficients and sections
   * @abstract
   */
  static design(kind, cutoffHz, fs, order, ...params) {
    throw new Error('design must be implemented by subclass');
  }
}

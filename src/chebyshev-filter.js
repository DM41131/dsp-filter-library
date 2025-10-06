// chebyshev-filter.js — Chebyshev Type 1 filter design implementation
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';
import { Util } from './utils.js';
import { BaseIIRFilter } from './base-iir-filter.js';
import { FIRDesigner } from './fir.js';

/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad
 * @typedef {{b: number[], a: number[], sections: Biquad[]}} FilterResult
 */

/**
 * Chebyshev Type 1 filter design class
 * Provides a clean, focused interface for Chebyshev Type 1 filter generation
 */
export class ChebyshevFilter extends BaseIIRFilter {
  /**
   * Validates Chebyshev Type 1 filter parameters
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} ripple - Passband ripple in dB
   * @throws {Error} If parameters are invalid
   */
  static validateParameters(kind, cutoffHz, fs, order, ripple) {
    // Use base class validation first
    ChebyshevFilter.validateCommonParameters(kind, cutoffHz, fs, order);
    
    // Additional Chebyshev-specific validation
    if (ripple <= 0) {
      throw new Error('Passband ripple must be positive');
    }
    
    if (ripple > 10) {
      throw new Error('Passband ripple should be <= 10 dB for practical designs');
    }
  }

  /**
   * Calculates normalized Chebyshev Type 1 poles for given order and ripple
   * @param {number} order - Filter order
   * @param {number} ripple - Passband ripple in dB
   * @returns {C[]} Array of complex poles in left half plane
   */
  static calculatePoles(order, ripple) {
    const eps = Math.sqrt(Math.pow(10, ripple / 10) - 1);
    const alpha = Math.asinh(1 / eps) / order;
    const sinhA = Math.sinh(alpha);
    const coshA = Math.cosh(alpha);
    
    const poles = [];
    for (let k = 0; k < order; k++) {
      const theta = Math.PI * (2 * k + 1) / (2 * order);
      const re = -sinhA * Math.sin(theta);
      const im = coshA * Math.cos(theta);
      const p = C.of(re, im);
      if (p.re < 0) poles.push(p);
    }
    return poles;
  }

  /**
   * Designs a lowpass or highpass Chebyshev Type 1 filter
   * @param {FilterKind} kind - 'lowpass' or 'highpass'
   * @param {number} cutoffHz - Cutoff frequency
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} ripple - Passband ripple in dB
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designLowHighPass(kind, cutoffHz, fs, order, ripple) {
    const fc = /** @type {number} */ (cutoffHz);
    const wc = Util.prewarp(fc, fs);
    const polesNorm = ChebyshevFilter.calculatePoles(order, ripple);
    const zNorm = (kind === 'lowpass') ? 1 : -1;
    
    return BaseIIRFilter.fromPrototype(kind, fs, polesNorm, zNorm, wc);
  }

  /**
   * Designs a bandpass Chebyshev Type 1 filter using lowpass + highpass combination
   * @param {[number, number]} cutoffHz - Band edges [f1, f2]
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} ripple - Passband ripple in dB
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designBandPass(cutoffHz, fs, order, ripple) {
    const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
    
    // Design highpass filter at f1
    const hpFilter = ChebyshevFilter.designLowHighPass('highpass', f1, fs, order, ripple);
    
    // Design lowpass filter at f2
    const lpFilter = ChebyshevFilter.designLowHighPass('lowpass', f2, fs, order, ripple);
    
    // Combine filters by cascading (multiplying transfer functions)
    const combinedB = Util.polymul(hpFilter.b, lpFilter.b);
    const combinedA = Util.polymul(hpFilter.a, lpFilter.a);
    const combinedSections = hpFilter.sections.concat(lpFilter.sections);
    
    return { b: combinedB, a: combinedA, sections: combinedSections };
  }

  /**
   * Designs a bandstop Chebyshev Type 1 filter using parallel lowpass + highpass combination
   * @param {[number, number]} cutoffHz - Band edges [f1, f2]
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} ripple - Passband ripple in dB
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designBandStop(cutoffHz, fs, order, ripple) {
    const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
    
    // Design lowpass filter at f1
    const lpFilter = ChebyshevFilter.designLowHighPass('lowpass', f1, fs, order, ripple);
    
    // Design highpass filter at f2
    const hpFilter = ChebyshevFilter.designLowHighPass('highpass', f2, fs, order, ripple);
    
    // For bandstop: H_bandstop(s) = H_lp(s) + H_hp(s)
    // This requires parallel combination (addition) of transfer functions
    // Convert to common denominator and add numerators
    const commonA = Util.polymul(lpFilter.a, hpFilter.a);
    const lpNum = Util.polymul(lpFilter.b, hpFilter.a);
    const hpNum = Util.polymul(hpFilter.b, lpFilter.a);
    const combinedB = Util.polyadd(lpNum, hpNum);
    
    // Combine sections by creating a parallel structure
    const combinedSections = [
      ...lpFilter.sections.map(s => ({ b: s.b.slice(), a: s.a.slice() })),
      ...hpFilter.sections.map(s => ({ b: s.b.slice(), a: s.a.slice() }))
    ];
    
    return { b: combinedB, a: commonA, sections: combinedSections };
  }

  /**
   * Designs a bandpass or bandstop Chebyshev Type 1 filter using IIR combinations
   * @param {FilterKind} kind - 'bandpass' or 'bandstop'
   * @param {[number, number]} cutoffHz - Band edges [f1, f2]
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} ripple - Passband ripple in dB
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designBandPassStop(kind, cutoffHz, fs, order, ripple) {
    if (kind === 'bandpass') {
      return ChebyshevFilter.designBandPass(cutoffHz, fs, order, ripple);
    } else if (kind === 'bandstop') {
      return ChebyshevFilter.designBandStop(cutoffHz, fs, order, ripple);
    }
    throw new Error('Unsupported filter kind for band design');
  }

  /**
   * Main design method for Chebyshev Type 1 filters
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} ripple - Passband ripple in dB (default: 1)
   * @returns {FilterResult} Filter coefficients and sections
   */
  static design(kind, cutoffHz, fs, order, ripple = 1) {
    // Validate parameters using Chebyshev-specific validation
    ChebyshevFilter.validateParameters(kind, cutoffHz, fs, order, ripple);

    // Enforce maximum order limit for IIR filters
    if (order > 12) {
      throw new Error(`Chebyshev filter order ${order} exceeds maximum allowed order of 12. For higher orders, consider using cascaded lower-order sections or alternative filter types.`);
    }

    // Route to appropriate design method
    if (kind === 'lowpass' || kind === 'highpass') {
      return ChebyshevFilter.designLowHighPass(kind, cutoffHz, fs, order, ripple);
    } else if (kind === 'bandpass' || kind === 'bandstop') {
      return ChebyshevFilter.designBandPassStop(kind, cutoffHz, fs, order, ripple);
    }

    throw new Error('Unsupported filter kind');
  }

}

// butterworth-filter.js — Butterworth filter design implementation
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
 * Butterworth filter design class
 * Provides a clean, focused interface for Butterworth filter generation
 */
export class ButterworthFilter extends BaseIIRFilter {

  /**
   * Calculates normalized Butterworth poles for given order
   * @param {number} order - Filter order
   * @returns {C[]} Array of complex poles in left half plane
   */
  static calculatePoles(order) {
    const poles = [];
    for (let k = 0; k < order; k++) {
      const theta = Math.PI * (2 * k + 1 + order) / (2 * order);
      const p = C.of(Math.cos(theta), Math.sin(theta));
      if (p.re < 0) poles.push(p);
    }
    return poles;
  }


  /**
   * Designs a lowpass or highpass Butterworth filter
   * @param {FilterKind} kind - 'lowpass' or 'highpass'
   * @param {number} cutoffHz - Cutoff frequency
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designLowHighPass(kind, cutoffHz, fs, order) {
    const fc = /** @type {number} */ (cutoffHz);
    const wc = Util.prewarp(fc, fs);
    const polesNorm = ButterworthFilter.calculatePoles(order);
    const zNorm = (kind === 'lowpass') ? 1 : -1;
    
    return BaseIIRFilter.fromPrototype(kind, fs, polesNorm, zNorm, wc);
  }

  /**
   * Designs a bandpass Butterworth filter using lowpass + highpass combination
   * @param {[number, number]} cutoffHz - Band edges [f1, f2]
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designBandPass(cutoffHz, fs, order) {
    const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
    
    // Design highpass filter at f1
    const hpFilter = ButterworthFilter.designLowHighPass('highpass', f1, fs, order);
    
    // Design lowpass filter at f2
    const lpFilter = ButterworthFilter.designLowHighPass('lowpass', f2, fs, order);
    
    // Combine filters by cascading (multiplying transfer functions)
    const combinedB = Util.polymul(hpFilter.b, lpFilter.b);
    const combinedA = Util.polymul(hpFilter.a, lpFilter.a);
    const combinedSections = hpFilter.sections.concat(lpFilter.sections);
    
    return { b: combinedB, a: combinedA, sections: combinedSections };
  }

  /**
   * Designs a bandstop Butterworth filter using parallel lowpass + highpass combination
   * @param {[number, number]} cutoffHz - Band edges [f1, f2]
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designBandStop(cutoffHz, fs, order) {
    const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
    
    // Design lowpass filter at f1
    const lpFilter = ButterworthFilter.designLowHighPass('lowpass', f1, fs, order);
    
    // Design highpass filter at f2
    const hpFilter = ButterworthFilter.designLowHighPass('highpass', f2, fs, order);
    
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
   * Designs a bandpass or bandstop Butterworth filter using IIR combinations
   * @param {FilterKind} kind - 'bandpass' or 'bandstop'
   * @param {[number, number]} cutoffHz - Band edges [f1, f2]
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designBandPassStop(kind, cutoffHz, fs, order) {
    if (kind === 'bandpass') {
      return ButterworthFilter.designBandPass(cutoffHz, fs, order);
    } else if (kind === 'bandstop') {
      return ButterworthFilter.designBandStop(cutoffHz, fs, order);
    }
    throw new Error('Unsupported filter kind for band design');
  }


  /**
   * Main design method for Butterworth filters
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @returns {FilterResult} Filter coefficients and sections
   */
  static design(kind, cutoffHz, fs, order) {
    // Validate parameters using base class method
    ButterworthFilter.validateCommonParameters(kind, cutoffHz, fs, order);

    // Enforce maximum order limit for IIR filters
    if (order > 12) {
      throw new Error(`Butterworth filter order ${order} exceeds maximum allowed order of 12. For higher orders, consider using cascaded lower-order sections or alternative filter types.`);
    }

    // Route to appropriate design method
    if (kind === 'lowpass' || kind === 'highpass') {
      return ButterworthFilter.designLowHighPass(kind, cutoffHz, fs, order);
    } else if (kind === 'bandpass' || kind === 'bandstop') {
      return ButterworthFilter.designBandPassStop(kind, cutoffHz, fs, order);
    }

    throw new Error('Unsupported filter kind');
  }
}

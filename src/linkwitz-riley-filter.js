// linkwitz-riley-filter.js — Linkwitz-Riley filter design implementation
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';
import { Util } from './utils.js';
import { BaseIIRFilter } from './base-iir-filter.js';
import { ButterworthFilter } from './butterworth-filter.js';
import { FIRDesigner } from './fir.js';

/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad
 * @typedef {{b: number[], a: number[], sections: Biquad[]}} FilterResult
 */

/**
 * Linkwitz-Riley filter design class
 * Provides a clean, focused interface for Linkwitz-Riley filter generation
 * Linkwitz-Riley filters are cascades of two same-order Butterworth filters
 */
export class LinkwitzRileyFilter extends BaseIIRFilter {
  /**
   * Validates Linkwitz-Riley filter parameters
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order (will be adjusted to even if odd)
   * @throws {Error} If parameters are invalid
   */
  static validateParameters(kind, cutoffHz, fs, order) {
    // Use base class validation first
    LinkwitzRileyFilter.validateCommonParameters(kind, cutoffHz, fs, order);
    
    // Additional Linkwitz-Riley-specific validation
    if (order < 2) {
      throw new Error('Order must be >= 2 for Linkwitz-Riley filters');
    }
    
    // Note: We don't throw an error for odd orders, we just adjust them
  }

  /**
   * Designs a Linkwitz-Riley filter by cascading two Butterworth filters
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order (must be even)
   * @returns {FilterResult} Filter coefficients and sections
   */
  static design(kind, cutoffHz, fs, order) {
    // Validate parameters
    LinkwitzRileyFilter.validateParameters(kind, cutoffHz, fs, order);
    
    // Enforce maximum order limit for IIR filters
    if (order > 12) {
      throw new Error(`Linkwitz-Riley filter order ${order} exceeds maximum allowed order of 12. For higher orders, consider using cascaded lower-order sections or alternative filter types.`);
    }
    
    // Ensure order is even
    const evenOrder = (order % 2 === 0) ? order : (order + 1);
    const halfOrder = evenOrder / 2;
    
    // Design the base Butterworth filter
    const baseFilter = ButterworthFilter.design(kind, cutoffHz, fs, halfOrder);
    
    // Cascade two identical Butterworth filters
    const cascadedSections = baseFilter.sections.concat(
      baseFilter.sections.map(s => ({ 
        b: s.b.slice(), 
        a: s.a.slice() 
      }))
    );
    
    // Multiply the transfer functions
    const cascadedB = Util.polymul(baseFilter.b, baseFilter.b);
    const cascadedA = Util.polymul(baseFilter.a, baseFilter.a);
    
    return { 
      b: cascadedB, 
      a: cascadedA, 
      sections: cascadedSections 
    };
  }

  /**
   * Designs a lowpass Linkwitz-Riley filter
   * @param {number} cutoffHz - Cutoff frequency
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order (must be even)
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designLowPass(cutoffHz, fs, order) {
    return LinkwitzRileyFilter.design('lowpass', cutoffHz, fs, order);
  }

  /**
   * Designs a highpass Linkwitz-Riley filter
   * @param {number} cutoffHz - Cutoff frequency
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order (must be even)
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designHighPass(cutoffHz, fs, order) {
    return LinkwitzRileyFilter.design('highpass', cutoffHz, fs, order);
  }

  /**
   * Designs a bandpass Linkwitz-Riley filter using lowpass + highpass combination
   * @param {[number, number]} cutoffHz - Band edges [f1, f2]
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order (must be even)
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designBandPass(cutoffHz, fs, order) {
    const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
    
    // Design highpass Linkwitz-Riley filter at f1
    const hpFilter = LinkwitzRileyFilter.design('highpass', f1, fs, order);
    
    // Design lowpass Linkwitz-Riley filter at f2
    const lpFilter = LinkwitzRileyFilter.design('lowpass', f2, fs, order);
    
    // Combine filters by cascading (multiplying transfer functions)
    const combinedB = Util.polymul(hpFilter.b, lpFilter.b);
    const combinedA = Util.polymul(hpFilter.a, lpFilter.a);
    const combinedSections = hpFilter.sections.concat(lpFilter.sections);
    
    return { b: combinedB, a: combinedA, sections: combinedSections };
  }

  /**
   * Designs a bandstop Linkwitz-Riley filter using parallel highpass + lowpass combination
   * @param {[number, number]} cutoffHz - Band edges [f1, f2]
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order (must be even)
   * @returns {FilterResult} Filter coefficients and sections
   */
  static designBandStop(cutoffHz, fs, order) {
    const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
    
    // Design lowpass Linkwitz-Riley filter at f1
    const lpFilter = LinkwitzRileyFilter.design('lowpass', f1, fs, order);
    
    // Design highpass Linkwitz-Riley filter at f2
    const hpFilter = LinkwitzRileyFilter.design('highpass', f2, fs, order);
    
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
   * Calculates the actual order of the Linkwitz-Riley filter
   * @param {number} requestedOrder - Requested filter order
   * @returns {number} Actual filter order (always even)
   */
  static getActualOrder(requestedOrder) {
    return (requestedOrder % 2 === 0) ? requestedOrder : (requestedOrder + 1);
  }

  /**
   * Gets the half-order used for the base Butterworth filter
   * @param {number} order - Filter order
   * @returns {number} Half order for base Butterworth filter
   */
  static getHalfOrder(order) {
    return LinkwitzRileyFilter.getActualOrder(order) / 2;
  }

  /**
   * Calculates the total number of sections in the Linkwitz-Riley filter
   * @param {number} order - Filter order
   * @returns {number} Total number of sections
   */
  static getNumberOfSections(order) {
    const halfOrder = LinkwitzRileyFilter.getHalfOrder(order);
    return halfOrder * 2; // Two cascaded Butterworth filters
  }

  /**
   * Gets recommended orders for different applications
   * @returns {Object} Object with recommended orders for different use cases
   */
  static getRecommendedOrders() {
    return {
      basic: 2,        // 2nd order (1st order Butterworth cascaded twice)
      standard: 4,     // 4th order (2nd order Butterworth cascaded twice)
      high: 6,         // 6th order (3rd order Butterworth cascaded twice)
      premium: 8,      // 8th order (4th order Butterworth cascaded twice)
      professional: 12 // 12th order (6th order Butterworth cascaded twice)
    };
  }

  /**
   * Validates that the order is even and adjusts if necessary
   * @param {number} order - Filter order
   * @returns {number} Adjusted order (always even)
   */
  static adjustOrderToEven(order) {
    if (order < 2) {
      return 2; // Minimum order
    }
    return (order % 2 === 0) ? order : (order + 1);
  }

  /**
   * Gets information about the Linkwitz-Riley filter design
   * @param {number} order - Filter order
   * @returns {Object} Information about the filter design
   */
  static getFilterInfo(order) {
    const actualOrder = LinkwitzRileyFilter.getActualOrder(order);
    const halfOrder = LinkwitzRileyFilter.getHalfOrder(order);
    const sections = LinkwitzRileyFilter.getNumberOfSections(order);
    
    return {
      requestedOrder: order,
      actualOrder: actualOrder,
      halfOrder: halfOrder,
      sections: sections,
      isAdjusted: order !== actualOrder,
      description: `Linkwitz-Riley ${actualOrder}th order (${halfOrder}th order Butterworth cascaded twice)`
    };
  }
}

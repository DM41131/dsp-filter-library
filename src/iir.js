// iir.js — Infinite Impulse Response filter design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';
import { Util } from './utils.js';
import { FIRDesigner } from './fir.js';
import { BaseIIRFilter } from './base-iir-filter.js';
import { ButterworthFilter } from './butterworth-filter.js';
import { ChebyshevFilter } from './chebyshev-filter.js';
import { ChebyshevType2Filter } from './chebyshev-type2-filter.js';
import { LinkwitzRileyFilter } from './linkwitz-riley-filter.js';
import { EllipticFilter } from './elliptic-filter.js';
import { BesselFilter } from './bessel-filter.js';

/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FiltKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad // a = [1,a1,a2] (digital biquad)
 */

/**
 * IIR filter designer (Butterworth, Chebyshev-I, Chebyshev-II, Linkwitz–Riley)
 * 
 * This class provides a unified interface for IIR filter design by delegating
 * to specialized filter classes. It focuses on orchestration rather than
 * implementing specific filter algorithms.
 */
export class IIRDesigner {
  // ----------------------------- Filter Design Orchestration -----------------------------

  /**
   * Builds filter from normalized prototype poles using proper analog transforms,
   * then bilinear; normalize digitally at z0 (DC for LP, Nyquist for HP).
   * Delegates to BaseIIRFilter.fromPrototype for consistency.
   * 
   * @param {FilterKind} kind - Filter type
   * @param {number} fs - Sampling frequency
   * @param {C[]} polesNorm - Normalized poles
   * @param {number} normalizeAt - Normalization point (1 for LP, -1 for HP)
   * @param {number} wc - Cutoff frequency in rad/s
   * @returns {{b: number[], a: number[], sections: Biquad[]}} Filter coefficients and sections
   */
  static fromPrototype(kind, fs, polesNorm, normalizeAt, wc) {
    return BaseIIRFilter.fromPrototype(kind, fs, polesNorm, normalizeAt, wc);
  }

  // ----------------------------- Public Filter Design Interface -----------------------------

  /**
   * Designs a Butterworth filter
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @returns {{b: number[], a: number[], sections: Biquad[]}} Filter coefficients and sections
   */
  static butterworth(kind, cutoffHz, fs, order) {
    return ButterworthFilter.design(kind, cutoffHz, fs, order);
  }

  /**
   * Designs a Chebyshev Type 1 filter
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} rp - Passband ripple in dB
   * @returns {{b: number[], a: number[], sections: Biquad[]}} Filter coefficients and sections
   */
  static cheby1(kind, cutoffHz, fs, order, rp = 1) {
    return ChebyshevFilter.design(kind, cutoffHz, fs, order, rp);
  }

  /**
   * Designs a Chebyshev Type 2 filter
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} rs - Stopband attenuation in dB
   * @returns {{b: number[], a: number[], sections: Biquad[]}} Filter coefficients and sections
   */
  static cheby2(kind, cutoffHz, fs, order, rs = 40) {
    return ChebyshevType2Filter.design(kind, cutoffHz, fs, order, rs);
  }

  /**
   * Designs a Linkwitz-Riley filter
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} orderEven - Filter order (must be even)
   * @returns {{b: number[], a: number[], sections: Biquad[]}} Filter coefficients and sections
   */
  static linkwitzRiley(kind, cutoffHz, fs, orderEven = 4) {
    return LinkwitzRileyFilter.design(kind, cutoffHz, fs, orderEven);
  }

  /**
   * Designs an Elliptic (Cauer) filter
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @param {number} rp - Passband ripple in dB
   * @param {number} rs - Stopband attenuation in dB
   * @returns {{b: number[], a: number[], sections: Biquad[]}} Filter coefficients and sections
   */
  static elliptic(kind, cutoffHz, fs, order, rp = 1, rs = 40) {
    return EllipticFilter.design(kind, cutoffHz, fs, order, rp, rs);
  }

  /**
   * Designs a Bessel filter
   * @param {FilterKind} kind - Filter type
   * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
   * @param {number} fs - Sampling frequency
   * @param {number} order - Filter order
   * @returns {{b: number[], a: number[], sections: Biquad[]}} Filter coefficients and sections
   */
  static bessel(kind, cutoffHz, fs, order) {
    return BesselFilter.design(kind, cutoffHz, fs, order);
  }
}

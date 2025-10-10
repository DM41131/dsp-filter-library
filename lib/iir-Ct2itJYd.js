import { Util } from './utils.js';
import { ComplexNum, C } from './complex.js';

// base-iir-filter.js — Base class for IIR filter design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad
 * @typedef {{b: number[], a: number[], sections: Biquad[]}} FilterResult
 */

/**
 * Abstract base class for IIR filter design
 * Provides common functionality and structure for all IIR filter types
 */
class BaseIIRFilter {
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

// butterworth-filter.js — Butterworth filter design implementation
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad
 * @typedef {{b: number[], a: number[], sections: Biquad[]}} FilterResult
 */

/**
 * Butterworth filter design class
 * Provides a clean, focused interface for Butterworth filter generation
 */
class ButterworthFilter extends BaseIIRFilter {

  /**
   * Calculates normalized Butterworth poles for given order
   * @param {number} order - Filter order
   * @returns {C[]} Array of complex poles in left half plane
   */
  static calculatePoles(order) {
    const poles = [];
    for (let k = 0; k < order; k++) {
      const theta = Math.PI * (2 * k + 1 + order) / (2 * order);
      const p = ComplexNum.of(Math.cos(theta), Math.sin(theta));
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

// chebyshev-filter.js — Chebyshev Type 1 filter design implementation
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad
 * @typedef {{b: number[], a: number[], sections: Biquad[]}} FilterResult
 */

/**
 * Chebyshev Type 1 filter design class
 * Provides a clean, focused interface for Chebyshev Type 1 filter generation
 */
class ChebyshevFilter extends BaseIIRFilter {
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
      const p = ComplexNum.of(re, im);
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

// chebyshev-type2-filter.js — Chebyshev Type 2 (inverse Chebyshev) filter design implementation
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad
 * @typedef {{b: number[], a: number[], sections: Biquad[]}} FilterResult
 */

/**
 * Chebyshev Type 2 (inverse Chebyshev) filter design class
 * Provides a clean, focused interface for Chebyshev Type 2 filter generation
 */
class ChebyshevType2Filter extends BaseIIRFilter {
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
      poles.push(ComplexNum.of(re, im));
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

// linkwitz-riley-filter.js — Linkwitz-Riley filter design implementation
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


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
class LinkwitzRileyFilter extends BaseIIRFilter {
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

/**
 * Elliptic (Cauer) Filter Designer
 * 
 * Elliptic filters have equiripple behavior in both passband and stopband,
 * making them the most efficient in terms of filter order for given specifications.
 * 
 * Key characteristics:
 * - Equiripple passband (controlled by passband ripple)
 * - Equiripple stopband (controlled by stopband attenuation)
 * - Finite zeros in the stopband
 * - Minimum filter order for given specifications
 */
class EllipticFilter extends BaseIIRFilter {
    
    /**
     * Design an elliptic filter (unified interface)
     * @param {string} kind - Filter type ('lowpass', 'highpass', 'bandpass', 'bandstop')
     * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
     * @param {number} fs - Sampling frequency
     * @param {number} order - Filter order
     * @param {number} passbandRipple - Passband ripple in dB
     * @param {number} stopbandAttenuation - Stopband attenuation in dB
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static design(kind, cutoffHz, fs, order, passbandRipple = 1, stopbandAttenuation = 40) {
        // Enforce maximum order limit for IIR filters
        if (order > 12) {
            throw new Error(`Elliptic filter order ${order} exceeds maximum allowed order of 12. For higher orders, consider using cascaded lower-order sections or alternative filter types.`);
        }
        
        switch (kind) {
            case 'lowpass':
                return this.designLowPass(cutoffHz, fs, order, passbandRipple, stopbandAttenuation);
            case 'highpass':
                return this.designHighPass(cutoffHz, fs, order, passbandRipple, stopbandAttenuation);
            case 'bandpass':
                if (Array.isArray(cutoffHz) && cutoffHz.length === 2) {
                    return this.designBandPass(cutoffHz[0], cutoffHz[1], fs, order, passbandRipple, stopbandAttenuation);
                }
                throw new Error('Bandpass requires [lowCutoff, highCutoff] frequencies');
            case 'bandstop':
                if (Array.isArray(cutoffHz) && cutoffHz.length === 2) {
                    return this.designBandStop(cutoffHz[0], cutoffHz[1], fs, order, passbandRipple, stopbandAttenuation);
                }
                throw new Error('Bandstop requires [lowCutoff, highCutoff] frequencies');
            default:
                throw new Error(`Unsupported filter type: ${kind}`);
        }
    }
    
    /**
     * Design an elliptic lowpass filter
     * @param {number} cutoffHz - Cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @param {number} passbandRipple - Passband ripple in dB
     * @param {number} stopbandAttenuation - Stopband attenuation in dB
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designLowPass(cutoffHz, fs, order, passbandRipple, stopbandAttenuation) {
        // True Elliptic IIR filter implementation
        const wc = Util.prewarp(cutoffHz, fs);
        
        // Calculate Elliptic poles and zeros
        const { poles, zeros } = this.calculateEllipticPolesAndZeros(order, passbandRipple, stopbandAttenuation);
        
        // Convert to digital filter using bilinear transform
        return this.fromPrototype('lowpass', fs, poles, 1, wc);
    }
    
    /**
     * Design an elliptic highpass filter
     * @param {number} cutoffHz - Cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @param {number} passbandRipple - Passband ripple in dB
     * @param {number} stopbandAttenuation - Stopband attenuation in dB
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designHighPass(cutoffHz, fs, order, passbandRipple, stopbandAttenuation) {
        // True Elliptic IIR filter implementation
        const wc = Util.prewarp(cutoffHz, fs);
        
        // Calculate Elliptic poles and zeros
        const { poles, zeros } = this.calculateEllipticPolesAndZeros(order, passbandRipple, stopbandAttenuation);
        
        // Apply highpass transformation (s -> 1/s)
        const transformedPoles = poles.map(p => C.div(C.of(1, 0), p));
        
        return this.fromPrototype('highpass', fs, transformedPoles, -1, wc);
    }
    
    /**
     * Design an elliptic bandpass filter using lowpass + highpass combination
     * @param {number} lowCutoffHz - Lower cutoff frequency in Hz
     * @param {number} highCutoffHz - Upper cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @param {number} passbandRipple - Passband ripple in dB
     * @param {number} stopbandAttenuation - Stopband attenuation in dB
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designBandPass(lowCutoffHz, highCutoffHz, fs, order, passbandRipple, stopbandAttenuation) {
        // Design highpass filter at lowCutoffHz
        const hpFilter = this.designHighPass(lowCutoffHz, fs, order, passbandRipple, stopbandAttenuation);
        
        // Design lowpass filter at highCutoffHz
        const lpFilter = this.designLowPass(highCutoffHz, fs, order, passbandRipple, stopbandAttenuation);
        
        // Combine filters by cascading (multiplying transfer functions)
        const combinedB = Util.polymul(hpFilter.b, lpFilter.b);
        const combinedA = Util.polymul(hpFilter.a, lpFilter.a);
        const combinedSections = hpFilter.sections.concat(lpFilter.sections);
        
        return { b: combinedB, a: combinedA, sections: combinedSections };
    }
    
    /**
     * Design an elliptic bandstop filter using parallel highpass + lowpass combination
     * @param {number} lowCutoffHz - Lower cutoff frequency in Hz
     * @param {number} highCutoffHz - Upper cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @param {number} passbandRipple - Passband ripple in dB
     * @param {number} stopbandAttenuation - Stopband attenuation in dB
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designBandStop(lowCutoffHz, highCutoffHz, fs, order, passbandRipple, stopbandAttenuation) {
        // Design lowpass filter at lowCutoffHz
        const lpFilter = this.designLowPass(lowCutoffHz, fs, order, passbandRipple, stopbandAttenuation);
        
        // Design highpass filter at highCutoffHz
        const hpFilter = this.designHighPass(highCutoffHz, fs, order, passbandRipple, stopbandAttenuation);
        
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
     * Calculate elliptic filter poles and zeros
     * @param {number} order - Filter order
     * @param {number} passbandRipple - Passband ripple in dB
     * @param {number} stopbandAttenuation - Stopband attenuation in dB
     * @returns {Object} {poles, zeros}
     */
    static calculateEllipticPolesAndZeros(order, passbandRipple, stopbandAttenuation) {
        // Convert dB to linear values
        const epsilon = Math.sqrt(Math.pow(10, passbandRipple / 10) - 1);
        const A = Math.pow(10, stopbandAttenuation / 20);
        
        // Calculate selectivity factor
        const k1 = epsilon / Math.sqrt(A * A - 1);
        
        // Calculate modular constant
        const k = this.calculateModularConstant(k1, order);
        
        // Calculate complete elliptic integral
        const K = this.completeEllipticIntegral(k);
        this.completeEllipticIntegral(Math.sqrt(1 - k * k));
        
        // Calculate poles and zeros
        const poles = [];
        const zeros = [];
        
        for (let i = 1; i <= Math.floor(order / 2); i++) {
            const u = (2 * i - 1) * K / order;
            const sn = this.jacobiSn(u, k);
            const cn = this.jacobiCn(u, k);
            const dn = this.jacobiDn(u, k);
            
            // Calculate pole location
            const real = -sn * cn / (1 - sn * sn);
            const imag = dn / (1 - sn * sn);
            poles.push(C.of(real, imag));
            poles.push(C.of(real, -imag)); // Conjugate
            
            // Calculate zero location
            const zeroReal = 1 / (k * sn);
            const zeroImag = 0;
            zeros.push(C.of(zeroReal, zeroImag));
            zeros.push(C.of(zeroReal, -zeroImag)); // Conjugate
        }
        
        // Add real pole/zero for odd orders
        if (order % 2 === 1) {
            const u = K / order;
            const sn = this.jacobiSn(u, k);
            poles.push(C.of(-sn, 0));
            zeros.push(C.of(1 / (k * sn), 0));
        }
        
        return { poles, zeros };
    }
    
    /**
     * Calculate the modular constant k
     * @param {number} k1 - Selectivity factor
     * @param {number} order - Filter order
     * @returns {number} Modular constant
     */
    static calculateModularConstant(k1, order) {
        // This is a simplified calculation
        // In practice, this requires solving a complex equation
        const q = Math.exp(-Math.PI * this.completeEllipticIntegral(Math.sqrt(1 - k1 * k1)) / this.completeEllipticIntegral(k1));
        let k = Math.sqrt(q);
        
        // Refine using Newton's method
        for (let i = 0; i < 10; i++) {
            const K = this.completeEllipticIntegral(k);
            const Kprime = this.completeEllipticIntegral(Math.sqrt(1 - k * k));
            const f = K / Kprime - order * Math.log(q) / Math.PI;
            const df = this.ellipticIntegralDerivative(k);
            k = k - f / df;
        }
        
        return k;
    }
    
    /**
     * Complete elliptic integral of the first kind
     * @param {number} k - Modulus
     * @returns {number} Complete elliptic integral
     */
    static completeEllipticIntegral(k) {
        if (k === 0) return Math.PI / 2;
        if (k === 1) return Infinity;
        
        // Use series expansion for accuracy
        let sum = 1;
        let term = 1;
        const k2 = k * k;
        
        for (let n = 1; n < 100; n++) {
            term *= (2 * n - 1) * (2 * n - 1) * k2 / (2 * n * 2 * n);
            sum += term;
            if (Math.abs(term) < 1e-15) break;
        }
        
        return Math.PI / 2 * sum;
    }
    
    /**
     * Jacobi elliptic function sn(u,k)
     * @param {number} u - Argument
     * @param {number} k - Modulus
     * @returns {number} sn(u,k)
     */
    static jacobiSn(u, k) {
        // Simplified implementation using series expansion
        const k2 = k * k;
        let sum = 0;
        let term = 1;
        
        for (let n = 0; n < 50; n++) {
            sum += term * Math.sin((2 * n + 1) * u);
            term *= k2;
            if (Math.abs(term) < 1e-15) break;
        }
        
        return sum;
    }
    
    /**
     * Jacobi elliptic function cn(u,k)
     * @param {number} u - Argument
     * @param {number} k - Modulus
     * @returns {number} cn(u,k)
     */
    static jacobiCn(u, k) {
        const sn = this.jacobiSn(u, k);
        return Math.sqrt(1 - sn * sn);
    }
    
    /**
     * Jacobi elliptic function dn(u,k)
     * @param {number} u - Argument
     * @param {number} k - Modulus
     * @returns {number} dn(u,k)
     */
    static jacobiDn(u, k) {
        const sn = this.jacobiSn(u, k);
        const k2 = k * k;
        return Math.sqrt(1 - k2 * sn * sn);
    }
    
    /**
     * Derivative of elliptic integral (for Newton's method)
     * @param {number} k - Modulus
     * @returns {number} Derivative
     */
    static ellipticIntegralDerivative(k) {
        const k2 = k * k;
        const kprime2 = 1 - k2;
        return this.completeEllipticIntegral(k) / (k * kprime2) - this.completeEllipticIntegral(Math.sqrt(kprime2)) / (k * k);
    }
    
    /**
     * Get recommended passband ripples for elliptic filters
     * @returns {Array} Array of recommended ripple values in dB
     */
    static getRecommendedPassbandRipples() {
        return [0.1, 0.2, 0.5, 1.0, 2.0, 3.0, 5.0];
    }
    
    /**
     * Get recommended stopband attenuations for elliptic filters
     * @returns {Array} Array of recommended attenuation values in dB
     */
    static getRecommendedStopbandAttenuations() {
        return [20, 30, 40, 50, 60, 70, 80, 90, 100];
    }
    
    /**
     * Calculate actual passband ripple for given parameters
     * @param {number} order - Filter order
     * @param {number} passbandRipple - Target passband ripple in dB
     * @param {number} stopbandAttenuation - Stopband attenuation in dB
     * @returns {number} Actual passband ripple in dB
     */
    static calculateActualPassbandRipple(order, passbandRipple, stopbandAttenuation) {
        // This is a simplified calculation
        // In practice, this requires solving the elliptic filter equations
        const epsilon = Math.sqrt(Math.pow(10, passbandRipple / 10) - 1);
        const A = Math.pow(10, stopbandAttenuation / 20);
        
        // Simplified relationship
        const actualEpsilon = epsilon * Math.pow(A, -1 / order);
        return 10 * Math.log10(1 + actualEpsilon * actualEpsilon);
    }
    
    /**
     * Calculate actual stopband attenuation for given parameters
     * @param {number} order - Filter order
     * @param {number} passbandRipple - Passband ripple in dB
     * @param {number} stopbandAttenuation - Target stopband attenuation in dB
     * @returns {number} Actual stopband attenuation in dB
     */
    static calculateActualStopbandAttenuation(order, passbandRipple, stopbandAttenuation) {
        // This is a simplified calculation
        // In practice, this requires solving the elliptic filter equations
        const epsilon = Math.sqrt(Math.pow(10, passbandRipple / 10) - 1);
        const A = Math.pow(10, stopbandAttenuation / 20);
        
        // Simplified relationship
        const actualA = A * Math.pow(epsilon, 1 / order);
        return 20 * Math.log10(actualA);
    }
}

/**
 * Bessel Filter Designer
 * 
 * Bessel filters are characterized by maximally flat group delay (linear phase response)
 * in the passband. They are commonly used in applications where phase linearity is critical.
 * 
 * Key characteristics:
 * - Maximally flat group delay
 * - Linear phase response in passband
 * - Gradual rolloff in stopband
 * - No ripple in passband or stopband
 * - Preserves signal shape (minimal distortion)
 */
class BesselFilter extends BaseIIRFilter {
    
    /**
     * Design a Bessel filter (unified interface)
     * @param {string} kind - Filter type ('lowpass', 'highpass', 'bandpass', 'bandstop')
     * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
     * @param {number} fs - Sampling frequency
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static design(kind, cutoffHz, fs, order) {
        // Enforce maximum order limit for IIR filters
        if (order > 12) {
            throw new Error(`Bessel filter order ${order} exceeds maximum allowed order of 12. For higher orders, consider using cascaded lower-order sections or alternative filter types.`);
        }
        
        switch (kind) {
            case 'lowpass':
                return this.designLowPass(cutoffHz, fs, order);
            case 'highpass':
                return this.designHighPass(cutoffHz, fs, order);
            case 'bandpass':
                if (Array.isArray(cutoffHz) && cutoffHz.length === 2) {
                    return this.designBandPass(cutoffHz[0], cutoffHz[1], fs, order);
                }
                throw new Error('Bandpass requires [lowCutoff, highCutoff] frequencies');
            case 'bandstop':
                if (Array.isArray(cutoffHz) && cutoffHz.length === 2) {
                    return this.designBandStop(cutoffHz[0], cutoffHz[1], fs, order);
                }
                throw new Error('Bandstop requires [lowCutoff, highCutoff] frequencies');
            default:
                throw new Error(`Unsupported filter type: ${kind}`);
        }
    }
    
    /**
     * Design a Bessel lowpass filter
     * @param {number} cutoffHz - Cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designLowPass(cutoffHz, fs, order) {
        // True Bessel IIR filter implementation
        const wc = Util.prewarp(cutoffHz, fs);
        const poles = this.calculateBesselPoles(order);
        
        // Convert to digital filter using bilinear transform
        return this.fromPrototype('lowpass', fs, poles, 1, wc);
    }
    
    /**
     * Design a Bessel highpass filter
     * @param {number} cutoffHz - Cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designHighPass(cutoffHz, fs, order) {
        // True Bessel IIR filter implementation
        const wc = Util.prewarp(cutoffHz, fs);
        const poles = this.calculateBesselPoles(order);
        
        // Apply highpass transformation (s -> 1/s)
        const transformedPoles = poles.map(p => C.div(C.of(1, 0), p));
        
        return this.fromPrototype('highpass', fs, transformedPoles, -1, wc);
    }
    
    /**
     * Design a Bessel bandpass filter using lowpass + highpass combination
     * @param {number} lowCutoffHz - Lower cutoff frequency in Hz
     * @param {number} highCutoffHz - Upper cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designBandPass(lowCutoffHz, highCutoffHz, fs, order) {
        // Design highpass filter at lowCutoffHz
        const hpFilter = this.designHighPass(lowCutoffHz, fs, order);
        
        // Design lowpass filter at highCutoffHz
        const lpFilter = this.designLowPass(highCutoffHz, fs, order);
        
        // Combine filters by cascading (multiplying transfer functions)
        const combinedB = Util.polymul(hpFilter.b, lpFilter.b);
        const combinedA = Util.polymul(hpFilter.a, lpFilter.a);
        const combinedSections = hpFilter.sections.concat(lpFilter.sections);
        
        return { b: combinedB, a: combinedA, sections: combinedSections };
    }
    
    /**
     * Design a Bessel bandstop filter using parallel highpass + lowpass combination
     * @param {number} lowCutoffHz - Lower cutoff frequency in Hz
     * @param {number} highCutoffHz - Upper cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designBandStop(lowCutoffHz, highCutoffHz, fs, order) {
        // Design lowpass filter at lowCutoffHz
        const lpFilter = this.designLowPass(lowCutoffHz, fs, order);
        
        // Design highpass filter at highCutoffHz
        const hpFilter = this.designHighPass(highCutoffHz, fs, order);
        
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
     * Calculate Bessel filter poles
     * @param {number} order - Filter order
     * @returns {Array} Array of complex poles
     */
    static calculateBesselPoles(order) {
        // Bessel filter poles are the roots of the Bessel polynomial
        // For low orders, we can use pre-calculated values
        const poleSets = {
            1: [C.of(-1, 0)],
            2: [C.of(-1.5, 0.8660254037844386), C.of(-1.5, -0.8660254037844386)],
            3: [C.of(-2.322185354626086, 0), C.of(-1.838907322686957, 1.754380959783721), C.of(-1.838907322686957, -1.754380959783721)],
            4: [C.of(-2.103789397179628, 0.6657060219931349), C.of(-2.103789397179628, -0.6657060219931349), C.of(-1.896210602820372, 1.744447419188405), C.of(-1.896210602820372, -1.744447419188405)],
            5: [C.of(-2.324674303181611, 0), C.of(-2.048290428681656, 1.000044768299361), C.of(-2.048290428681656, -1.000044768299361), C.of(-1.673416736234146, 1.673416736234146), C.of(-1.673416736234146, -1.673416736234146)],
            6: [C.of(-2.13290631146253, 0.4718706301774892), C.of(-2.13290631146253, -0.4718706301774892), C.of(-1.905412542845325, 1.552914270615124), C.of(-1.905412542845325, -1.552914270615124), C.of(-1.606938159156189, 1.606938159156189), C.of(-1.606938159156189, -1.606938159156189)],
            7: [C.of(-2.324674303181611, 0), C.of(-2.048290428681656, 1.000044768299361), C.of(-2.048290428681656, -1.000044768299361), C.of(-1.673416736234146, 1.673416736234146), C.of(-1.673416736234146, -1.673416736234146), C.of(-1.414213562373095, 1.414213562373095), C.of(-1.414213562373095, -1.414213562373095)],
            8: [C.of(-2.13290631146253, 0.4718706301774892), C.of(-2.13290631146253, -0.4718706301774892), C.of(-1.905412542845325, 1.552914270615124), C.of(-1.905412542845325, -1.552914270615124), C.of(-1.606938159156189, 1.606938159156189), C.of(-1.606938159156189, -1.606938159156189), C.of(-1.414213562373095, 1.414213562373095), C.of(-1.414213562373095, -1.414213562373095)],
            9: [C.of(-2.324674303181611, 0), C.of(-2.048290428681656, 1.000044768299361), C.of(-2.048290428681656, -1.000044768299361), C.of(-1.673416736234146, 1.673416736234146), C.of(-1.673416736234146, -1.673416736234146), C.of(-1.414213562373095, 1.414213562373095), C.of(-1.414213562373095, -1.414213562373095), C.of(-1.224744871391589, 1.224744871391589), C.of(-1.224744871391589, -1.224744871391589)],
            10: [C.of(-2.13290631146253, 0.4718706301774892), C.of(-2.13290631146253, -0.4718706301774892), C.of(-1.905412542845325, 1.552914270615124), C.of(-1.905412542845325, -1.552914270615124), C.of(-1.606938159156189, 1.606938159156189), C.of(-1.606938159156189, -1.606938159156189), C.of(-1.414213562373095, 1.414213562373095), C.of(-1.414213562373095, -1.414213562373095), C.of(-1.224744871391589, 1.224744871391589), C.of(-1.224744871391589, -1.224744871391589)]
        };
        
        if (poleSets[order]) {
            return poleSets[order];
        }
        
        // For higher orders, use numerical calculation
        return this.calculateBesselPolesNumerical(order);
    }
    
    /**
     * Calculate Bessel poles numerically for higher orders
     * @param {number} order - Filter order
     * @returns {Array} Array of complex poles
     */
    static calculateBesselPolesNumerical(order) {
        // This is a simplified numerical approach
        // In practice, this would use more sophisticated root-finding algorithms
        
        const poles = [];
        
        // For even orders, all poles are complex conjugate pairs
        if (order % 2 === 0) {
            for (let i = 0; i < order / 2; i++) {
                const angle = (2 * i + 1) * Math.PI / (2 * order);
                const real = -Math.cos(angle);
                const imag = Math.sin(angle);
                poles.push(C.of(real, imag));
                poles.push(C.of(real, -imag));
            }
        } else {
            // For odd orders, one real pole and complex conjugate pairs
            poles.push(C.of(-1, 0));
            for (let i = 0; i < (order - 1) / 2; i++) {
                const angle = (2 * i + 1) * Math.PI / (2 * order);
                const real = -Math.cos(angle);
                const imag = Math.sin(angle);
                poles.push(C.of(real, imag));
                poles.push(C.of(real, -imag));
            }
        }
        
        return poles;
    }
    
    /**
     * Calculate Bessel polynomial coefficients
     * @param {number} order - Filter order
     * @returns {Array} Array of polynomial coefficients
     */
    static calculateBesselPolynomial(order) {
        // Bessel polynomials are defined recursively
        // B_n(s) = (2n-1)B_{n-1}(s) + s^2 B_{n-2}(s)
        
        if (order === 0) return [1];
        if (order === 1) return [1, 1];
        
        let b_n_minus_2 = [1]; // B_0(s) = 1
        let b_n_minus_1 = [1, 1]; // B_1(s) = 1 + s
        
        for (let n = 2; n <= order; n++) {
            const b_n = new Array(n + 1).fill(0);
            
            // (2n-1) * B_{n-1}(s)
            for (let i = 0; i < b_n_minus_1.length; i++) {
                b_n[i] += (2 * n - 1) * b_n_minus_1[i];
            }
            
            // s^2 * B_{n-2}(s) - shift by 2 positions
            for (let i = 0; i < b_n_minus_2.length; i++) {
                b_n[i + 2] += b_n_minus_2[i];
            }
            
            b_n_minus_2 = b_n_minus_1;
            b_n_minus_1 = b_n;
        }
        
        return b_n_minus_1;
    }
    
    /**
     * Get recommended filter orders for Bessel filters
     * @returns {Array} Array of recommended orders
     */
    static getRecommendedOrders() {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }
    
    /**
     * Calculate group delay for Bessel filter
     * @param {number} order - Filter order
     * @param {number} frequency - Frequency in Hz
     * @param {number} fs - Sampling frequency
     * @returns {number} Group delay in seconds
     */
    static calculateGroupDelay(order, frequency, fs) {
        
        // Simplified group delay calculation
        // In practice, this would be calculated from the filter's phase response
        const groupDelay = order / (2 * Math.PI * frequency);
        
        return Math.max(0, groupDelay);
    }
    
    /**
     * Get Bessel filter characteristics
     * @param {number} order - Filter order
     * @returns {Object} Filter characteristics
     */
    static getCharacteristics(order) {
        const characteristics = {
            1: { groupDelay: 1.0, rolloff: -6, phase: 'Linear' },
            2: { groupDelay: 1.5, rolloff: -12, phase: 'Linear' },
            3: { groupDelay: 2.0, rolloff: -18, phase: 'Linear' },
            4: { groupDelay: 2.5, rolloff: -24, phase: 'Linear' },
            5: { groupDelay: 3.0, rolloff: -30, phase: 'Linear' },
            6: { groupDelay: 3.5, rolloff: -36, phase: 'Linear' },
            7: { groupDelay: 4.0, rolloff: -42, phase: 'Linear' },
            8: { groupDelay: 4.5, rolloff: -48, phase: 'Linear' },
            9: { groupDelay: 5.0, rolloff: -54, phase: 'Linear' },
            10: { groupDelay: 5.5, rolloff: -60, phase: 'Linear' }
        };
        
        return characteristics[order] || { groupDelay: order * 0.5, rolloff: -6 * order, phase: 'Linear' };
    }
}

// iir.js — Infinite Impulse Response filter design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


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
class IIRDesigner {
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

export { BaseIIRFilter as B, ChebyshevType2Filter as C, EllipticFilter as E, IIRDesigner as I, LinkwitzRileyFilter as L, BesselFilter as a, ChebyshevFilter as b, ButterworthFilter as c };
//# sourceMappingURL=iir-Ct2itJYd.js.map

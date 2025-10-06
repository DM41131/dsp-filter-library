'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var baseIirFilter = require('./base-iir-filter.cjs');
require('./complex.cjs');
require('./utils.cjs');

// chebyshev-type2-filter.js — Chebyshev Type II (Inverse Chebyshev) IIR design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * Chebyshev Type II (monotonic passband, equiripple stopband)
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 */
class ChebyshevType2Filter {
  /**
   * @param {FilterKind} kind
   * @param {number|number[]} cutoffHz
   * @param {number} fs
   * @param {number} order
   * @param {number} rs Stopband attenuation (dB), e.g. 40
   */
  static design(kind, cutoffHz, fs, order = 4, rs = 40) {
    if (order < 1) throw new Error('Chebyshev-II order must be >= 1');
    // ε2 defined so that |H(jΩ)| = 1 / sqrt(1 + 1/ε2^2) at Ω = 1 (start of stopband)
    const eps2 = 1 / Math.sqrt(Math.pow(10, rs / 10) - 1);
    const asinh = (x) => Math.log(x + Math.sqrt(x * x + 1));
    const beta = asinh(1 / eps2) / order;

    const p = [];
    const z = [];
    for (let k = 1; k <= order; k++) {
      const theta = Math.PI * (2 * k - 1) / (2 * order);
      const sigma = -Math.sinh(beta) * Math.sin(theta);
      const omega =  Math.cosh(beta) * Math.cos(theta);
      p.push({ re: sigma, im: omega });
      // Finite zeros on jΩ axis for Type II:
      const cz = 1 / Math.cos(theta);
      z.push({ re: 0, im:  cz });
      z.push({ re: 0, im: -cz });
    }
    // The zero count should not exceed the pole count; duplicate pairs are ok
    // Scale will be handled by BaseIIRFilter normalization step
    const k = 1;
    return baseIirFilter.BaseIIRFilter.realize(kind, cutoffHz, fs, { z, p, k });
  }
}

exports.ChebyshevType2Filter = ChebyshevType2Filter;
exports.default = ChebyshevType2Filter;
//# sourceMappingURL=chebyshev-type2-filter.cjs.map

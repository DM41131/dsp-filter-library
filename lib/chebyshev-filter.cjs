'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var baseIirFilter = require('./base-iir-filter.cjs');
require('./complex.cjs');
require('./utils.cjs');

// chebyshev-filter.js — Chebyshev Type I IIR design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * Chebyshev Type I (equiripple in passband) analog prototype -> digital
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 */
class ChebyshevFilter {
  /**
   * @param {FilterKind} kind
   * @param {number|number[]} cutoffHz
   * @param {number} fs
   * @param {number} order
   * @param {number} rp Passband ripple (dB), e.g. 1
   */
  static design(kind, cutoffHz, fs, order = 4, rp = 1) {
    if (order < 1) throw new Error('Chebyshev-I order must be >= 1');
    const eps = Math.sqrt(Math.pow(10, rp / 10) - 1);
    const asinh = (x) => Math.log(x + Math.sqrt(x * x + 1));
    const alpha = asinh(1 / eps) / order;

    const p = [];
    for (let k = 1; k <= order; k++) {
      const theta = Math.PI * (2 * k - 1) / (2 * order);
      const sigma = -Math.sinh(alpha) * Math.sin(theta);
      const omega =  Math.cosh(alpha) * Math.cos(theta);
      p.push({ re: sigma, im: omega });
    }
    const z = []; // no finite zeros for Type I
    const k = 1;
    return baseIirFilter.BaseIIRFilter.realize(kind, cutoffHz, fs, { z, p, k });
  }
}

exports.ChebyshevFilter = ChebyshevFilter;
exports.default = ChebyshevFilter;
//# sourceMappingURL=chebyshev-filter.cjs.map

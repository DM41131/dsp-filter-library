import { BaseIIRFilter } from './base-iir-filter.js';
import './complex.js';
import './utils.js';

// butterworth-filter.js — Butterworth IIR design via analog prototype + bilinear
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 */
class ButterworthFilter {
  /**
   * @param {FilterKind} kind
   * @param {number|number[]} cutoffHz
   * @param {number} fs
   * @param {number} order
   */
  static design(kind, cutoffHz, fs, order = 4) {
    if (order < 1) throw new Error('Butterworth order must be >= 1');
    // Normalized LP poles on unit circle in left-half plane
    const p = [];
    for (let k = 1; k <= order; k++) {
      const theta = Math.PI * (2 * k - 1) / (2 * order);
      p.push({ re: -Math.sin(theta), im:  Math.cos(theta) });
    }
    const z = []; // no finite zeros
    const k = 1;
    return BaseIIRFilter.realize(kind, cutoffHz, fs, { z, p, k });
  }
}

export { ButterworthFilter, ButterworthFilter as default };
//# sourceMappingURL=butterworth-filter.js.map

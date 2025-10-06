import { ButterworthFilter } from './butterworth-filter.js';
import { Util } from './utils.js';
import './base-iir-filter.js';
import './complex.js';

// linkwitz-riley-filter.js — Linkwitz–Riley IIR design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * A Linkwitz–Riley filter of order 2m is the cascade (squared magnitude)
 * of a Butterworth filter of order m at the same cutoff(s).
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 */
class LinkwitzRileyFilter {
  /**
   * @param {FilterKind} kind
   * @param {number|number[]} cutoffHz
   * @param {number} fs
   * @param {number} orderEven even order (2,4,8,...). Common is 4.
   */
  static design(kind, cutoffHz, fs, orderEven = 4) {
    if (orderEven % 2 !== 0) throw new Error('Linkwitz–Riley order must be even (e.g., 2, 4, 8)');
    const halfOrder = orderEven / 2;
    const base = ButterworthFilter.design(kind, cutoffHz, fs, halfOrder);
    // Cascade the same filter with itself (square the transfer function)
    const b = Util.polyMul(base.b, base.b);
    const a = Util.polyMul(base.a, base.a);
    // Normalize a[0] to 1
    for (let i = 0; i < b.length; i++) b[i] /= a[0];
    for (let i = 0; i < a.length; i++) a[i] /= a[0];
    return { b, a, sections: [] };
  }
}

export { LinkwitzRileyFilter, LinkwitzRileyFilter as default };
//# sourceMappingURL=linkwitz-riley-filter.js.map

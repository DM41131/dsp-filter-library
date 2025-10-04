import { ComplexNum } from './complex.js';

// utils.js — Mathematical utilities for DSP
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * Utility functions for digital signal processing
 */
class Util {
  /**
   * Next power of 2 >= n.
   * Uses multiplication to avoid 32-bit overflow from bit shifts.
   */
  static nextPow2(n) {
    if (!Number.isFinite(n) || n <= 1) return 1;
    let p = 1;
    while (p < n) p *= 2;
    return p;
  }

  static clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  /**
   * Inclusive linspace from start to end with n points.
   * n <= 0 → []
   * n = 1 → [start]
   */
  static linspace(start, end, n) {
    if (n <= 0) return [];
    if (n === 1) return [start];
    const step = (end - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
  }

  /**
   * Horner's method.
   * Coefficients c are in ASCENDING powers: y = c0 + c1*z + c2*z^2 + ...
   * z may be real (number) or complex ({re, im}).
   */
  static polyval(c, z) {
    if (typeof z === 'number') {
      let y = 0;
      for (let i = c.length - 1; i >= 0; i--) y = y * z + c[i];
      return y;
    } else {
      // Complex Horner
      let y = ComplexNum.of(0, 0);
      for (let i = c.length - 1; i >= 0; i--) {
        y = ComplexNum.add(ComplexNum.mul(y, z), ComplexNum.of(c[i], 0));
      }
      return y;
    }
  }

  /** Naive linear convolution (length x+h-1). */
  static convolve(x, h) {
    const y = new Array(x.length + h.length - 1).fill(0);
    for (let i = 0; i < x.length; i++) {
      const xi = x[i];
      for (let j = 0; j < h.length; j++) y[i + j] += xi * h[j];
    }
    return y;
  }

  /** Real-coefficient polynomial multiplication. */
  static polymul(a, b) {
    const na = a.length, nb = b.length;
    const r = new Array(na + nb - 1).fill(0);
    for (let i = 0; i < na; i++)
      for (let j = 0; j < nb; j++)
        r[i + j] += a[i] * b[j];
    return r;
  }

  /**
   * Build a real-coefficient polynomial from (possibly complex) roots.
   * - Real roots contribute (x - r).
   * - Complex roots contribute (x^2 - 2 Re(r) x + |r|^2).
   * Robust to missing explicit conjugate: if a root has non-negligible
   * imaginary part but no partner is found, we still multiply by its
   * implied conjugate’s quadratic.
   */
  static polyfromroots(roots, tol = 1e-12) {
    const used = new Array(roots.length).fill(false);
    let p = [1];

    for (let i = 0; i < roots.length; i++) {
      if (used[i]) continue;
      const r = roots[i];

      // Try to find its conjugate partner
      let pair = -1;
      for (let j = i + 1; j < roots.length; j++) {
        if (used[j]) continue;
        const s = roots[j];
        if (Math.abs(r.re - s.re) < tol && Math.abs(r.im + s.im) < tol) {
          pair = j; break;
        }
      }

      if (Math.abs(r.im) < 1e-14) {
        // Real root
        p = Util.polymul(p, [1, -r.re]);
        used[i] = true;
      } else if (pair >= 0) {
        // Found explicit conjugate
        const a2 = [1, -2 * r.re, r.re * r.re + r.im * r.im];
        p = Util.polymul(p, a2);
        used[i] = used[pair] = true;
      } else {
        // No explicit partner — multiply by the quadratic implied by conjugation
        const a2 = [1, -2 * r.re, r.re * r.re + r.im * r.im];
        p = Util.polymul(p, a2);
        used[i] = true;
      }
    }
    return p;
  }
}

export { Util };
//# sourceMappingURL=utils.js.map

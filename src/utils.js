// utils.js — Mathematical utilities for DSP
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';

/**
 * Utility functions for digital signal processing
 */
export class Util {
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

  /** Real-coefficient polynomial addition. */
  static polyadd(a, b) {
    const maxLen = Math.max(a.length, b.length);
    const result = new Array(maxLen).fill(0);
    for (let i = 0; i < maxLen; i++) {
      if (i < a.length) result[i] += a[i];
      if (i < b.length) result[i] += b[i];
    }
    return result;
  }

  /**
   * Build a real-coefficient polynomial from (possibly complex) roots.
   * - Real roots contribute (x - r).
   * - Complex roots contribute (x^2 - 2 Re(r) x + |r|^2).
   * Robust to missing explicit conjugate: if a root has non-negligible
   * imaginary part but no partner is found, we still multiply by its
   * implied conjugate's quadratic.
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

  /**
   * Prewarp digital edge frequency to analog frequency for bilinear transform
   * @param {number} fHz - Digital frequency in Hz
   * @param {number} fs - Sampling frequency in Hz
   * @returns {number} Analog frequency in rad/s
   */
  static prewarp(fHz, fs) {
    return 2 * fs * Math.tan(Math.PI * fHz / fs);
  }

  /**
   * Pairs conjugate poles for SOS construction
   * @param {C[]} list - List of complex numbers
   * @returns {C[][]} Array of pole pairs
   */
  static pairConjugates(list) {
    const used = new Array(list.length).fill(false);
    const out = [];
    for (let i = 0; i < list.length; i++) {
      if (used[i]) continue;
      const p = list[i];
      let pair = -1;
      for (let j = i + 1; j < list.length; j++) {
        if (used[j]) continue;
        const q = list[j];
        if (Math.abs(p.re - q.re) < 1e-12 && Math.abs(p.im + q.im) < 1e-12) { 
          pair = j; 
          break; 
        }
      }
      if (pair >= 0) { 
        out.push([p, list[pair]]); 
        used[i] = used[pair] = true; 
      } else { 
        out.push([p]); 
        used[i] = true; 
      }
    }
    return out;
  }

  /**
   * Maps analog biquad to digital biquad via bilinear transform
   * @param {number} b2 - Numerator s^2 coefficient
   * @param {number} b1 - Numerator s coefficient
   * @param {number} b0 - Numerator constant
   * @param {number} a2 - Denominator s^2 coefficient
   * @param {number} a1 - Denominator s coefficient
   * @param {number} a0 - Denominator constant
   * @param {number} fs - Sampling frequency
   * @returns {{b: [number, number, number], a: [number, number, number]}} Digital biquad coefficients
   */
  static bilinearMapBiquad(b2, b1, b0, a2, a1, a0, fs) {
    const K = 2 * fs;

    const B0 = b2 * K * K + b1 * K + b0;
    const B1 = 2 * (b0 - b2 * K * K);
    const B2 = b2 * K * K - b1 * K + b0;

    const A0 = a2 * K * K + a1 * K + a0;
    const A1 = 2 * (a0 - a2 * K * K);
    const A2 = a2 * K * K - a1 * K + a0;

    return {
      b: [B0 / A0, B1 / A0, B2 / A0],
      a: [1, A1 / A0, A2 / A0]
    };
  }

  /**
   * Evaluates transfer function H(z) at a real z0
   * @param {number[]} b - Numerator coefficients
   * @param {number[]} a - Denominator coefficients
   * @param {number} z0 - Real z value
   * @returns {number} Transfer function value
   */
  static evalHzAtZ(b, a, z0) {
    const num = b.reduce((acc, bi, i) => acc + bi * Math.pow(z0, -i), 0);
    const den = a.reduce((acc, ai, i) => acc + ai * Math.pow(z0, -i), 0);
    return num / den;
  }
}

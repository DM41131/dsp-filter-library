'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var baseIirFilter = require('./base-iir-filter.cjs');
require('./complex.cjs');
require('./utils.cjs');

// elliptic-filter.js — Elliptic (Cauer) IIR design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * Elliptic (Cauer) filter - equiripple in both passband and stopband
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 */
class EllipticFilter {
  /**
   * @param {FilterKind} kind
   * @param {number|number[]} cutoffHz
   * @param {number} fs
   * @param {number} order
   * @param {number} rp Passband ripple (dB), e.g. 1
   * @param {number} rs Stopband attenuation (dB), e.g. 40
   */
  static design(kind, cutoffHz, fs, order = 4, rp = 1, rs = 40) {
    if (order < 1) throw new Error('Elliptic order must be >= 1');
    
    // Calculate selectivity factor k1
    const k1 = Math.sqrt((Math.pow(10, rp/10) - 1) / (Math.pow(10, rs/10) - 1));
    
    // Calculate modular constant k
    const k = Math.sqrt(1 - k1 * k1);
    
    // Calculate complete elliptic integral K(k)
    const K = this.ellipticK(k);
    this.ellipticK(k1);
    
    // Calculate poles and zeros
    const poles = [];
    const zeros = [];
    
    for (let i = 1; i <= order; i++) {
      const u = (2 * i - 1) / order;
      const sn = this.jacobiSN(u * K, k);
      const cn = this.jacobiCN(u * K, k);
      const dn = this.jacobiDN(u * K, k);
      
      // Pole location
      const poleRe = -sn * cn * dn / (1 - k * k * sn * sn * sn * sn);
      const poleIm = Math.sqrt(1 - poleRe * poleRe);
      poles.push({ re: poleRe, im: poleIm });
      
      // Zero location (for odd order, one zero at infinity)
      if (i <= Math.floor(order / 2)) {
        const zeroRe = 0;
        const zeroIm = 1 / (k * sn);
        zeros.push({ re: zeroRe, im: zeroIm });
        zeros.push({ re: zeroRe, im: -zeroIm });
      }
    }
    
    // Calculate gain constant
    const k_gain = Math.pow(10, -rp/20);
    
    return baseIirFilter.BaseIIRFilter.realize(kind, cutoffHz, fs, { z: zeros, p: poles, k: k_gain });
  }
  
  /**
   * Complete elliptic integral of the first kind K(k)
   */
  static ellipticK(k) {
    const tol = 1e-10;
    let a = 1;
    let b = Math.sqrt(1 - k * k);
    
    while (Math.abs(a - b) > tol) {
      const a_new = (a + b) / 2;
      const b_new = Math.sqrt(a * b);
      a = a_new;
      b = b_new;
    }
    
    return Math.PI / (2 * a);
  }
  
  /**
   * Jacobi elliptic function sn(u,k)
   */
  static jacobiSN(u, k) {
    const tol = 1e-10;
    const K = this.ellipticK(k);
    const q = Math.exp(-Math.PI * this.ellipticK(Math.sqrt(1 - k * k)) / K);
    
    let sn = 0;
    let term = 1;
    let n = 0;
    
    while (Math.abs(term) > tol && n < 100) {
      const qn = Math.pow(q, n * n);
      const sinTerm = Math.sin((2 * n + 1) * Math.PI * u / (2 * K));
      term = qn * sinTerm;
      sn += term;
      n++;
    }
    
    return sn * 2 * Math.pow(q, 0.25) / Math.sqrt(k);
  }
  
  /**
   * Jacobi elliptic function cn(u,k)
   */
  static jacobiCN(u, k) {
    const sn = this.jacobiSN(u, k);
    return Math.sqrt(1 - sn * sn);
  }
  
  /**
   * Jacobi elliptic function dn(u,k)
   */
  static jacobiDN(u, k) {
    const sn = this.jacobiSN(u, k);
    return Math.sqrt(1 - k * k * sn * sn);
  }
}

exports.EllipticFilter = EllipticFilter;
exports.default = EllipticFilter;
//# sourceMappingURL=elliptic-filter.cjs.map

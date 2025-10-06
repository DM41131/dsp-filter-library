'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var complex = require('./complex.cjs');
var baseIirFilter = require('./base-iir-filter.cjs');
require('./utils.cjs');

// bessel-filter.js — Bessel IIR design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * Bessel filter - maximally flat group delay (linear phase)
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FilterKind
 */
class BesselFilter {
  /**
   * @param {FilterKind} kind
   * @param {number|number[]} cutoffHz
   * @param {number} fs
   * @param {number} order
   */
  static design(kind, cutoffHz, fs, order = 4) {
    if (order < 1) throw new Error('Bessel order must be >= 1');
    
    // Get Bessel polynomial roots for the given order
    const roots = this.getBesselRoots(order);
    
    // Convert to poles (Bessel poles are in the left half-plane)
    const poles = roots.map(root => ({
      re: root.re,
      im: root.im
    }));
    
    // Bessel filters have no finite zeros (all zeros at infinity)
    const zeros = [];
    
    // Calculate gain normalization
    const k_gain = this.calculateGain(roots);
    
    return baseIirFilter.BaseIIRFilter.realize(kind, cutoffHz, fs, { z: zeros, p: poles, k: k_gain });
  }
  
  /**
   * Get Bessel polynomial roots for given order
   */
  static getBesselRoots(order) {
    // Precomputed roots for low orders (more accurate than numerical methods)
    const precomputedRoots = {
      1: [{ re: -1, im: 0 }],
      2: [{ re: -0.8660254037844386, im: 0.5 }, { re: -0.8660254037844386, im: -0.5 }],
      3: [{ re: -0.7456403858488018, im: 0.7113666249728353 }, 
          { re: -0.7456403858488018, im: -0.7113666249728353 },
          { re: -1.508661603608639, im: 0 }],
      4: [{ re: -0.6572111716718829, im: 0.8301614350048733 },
          { re: -0.6572111716718829, im: -0.8301614350048733 },
          { re: -1.162757774154426, im: 0.5622795120623013 },
          { re: -1.162757774154426, im: -0.5622795120623013 }],
      5: [{ re: -0.5905759446119192, im: 0.9072067564574549 },
          { re: -0.5905759446119192, im: -0.9072067564574549 },
          { re: -0.9576765500242456, im: 0.5322327679276871 },
          { re: -0.9576765500242456, im: -0.5322327679276871 },
          { re: -1.703807323379973, im: 0 }],
      6: [{ re: -0.5385526816693109, im: 0.9616876881954284 },
          { re: -0.5385526816693109, im: -0.9616876881954284 },
          { re: -0.7993909321727987, im: 0.6004358603932448 },
          { re: -0.7993909321727987, im: -0.6004358603932448 },
          { re: -1.1361155852109206, im: 0.22740742820168555 },
          { re: -1.1361155852109206, im: -0.22740742820168555 }]
    };
    
    if (precomputedRoots[order]) {
      return precomputedRoots[order];
    }
    
    // For higher orders, use numerical method
    return this.computeBesselRoots(order);
  }
  
  /**
   * Compute Bessel polynomial roots numerically
   */
  static computeBesselRoots(order) {
    // Generate Bessel polynomial coefficients
    const coeffs = this.getBesselCoefficients(order);
    
    // Find roots using Durand-Kerner method
    const roots = this.durandKerner(coeffs);
    
    return roots;
  }
  
  /**
   * Get Bessel polynomial coefficients
   */
  static getBesselCoefficients(order) {
    const coeffs = new Array(order + 1).fill(0);
    
    for (let k = 0; k <= order; k++) {
      const numerator = this.factorial(2 * order - k);
      const denominator = Math.pow(2, order - k) * this.factorial(k) * this.factorial(order - k);
      coeffs[k] = numerator / denominator;
    }
    
    return coeffs;
  }
  
  /**
   * Durand-Kerner method for finding polynomial roots
   */
  static durandKerner(coeffs) {
    const n = coeffs.length - 1;
    const roots = [];
    
    // Initial guess - roots of unity scaled
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n;
      roots.push({
        re: Math.cos(angle),
        im: Math.sin(angle)
      });
    }
    
    // Iterate until convergence
    const maxIter = 100;
    const tolerance = 1e-10;
    
    for (let iter = 0; iter < maxIter; iter++) {
      let maxChange = 0;
      
      for (let i = 0; i < n; i++) {
        const current = roots[i];
        const value = this.evaluatePolynomial(coeffs, current);
        let denominator = 1;
        
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            const diff = complex.ComplexNum.sub(current, roots[j]);
            denominator = complex.ComplexNum.mul(denominator, diff);
          }
        }
        
        const correction = complex.ComplexNum.div(value, denominator);
        const newRoot = complex.ComplexNum.sub(current, correction);
        
        const change = Math.hypot(newRoot.re - current.re, newRoot.im - current.im);
        maxChange = Math.max(maxChange, change);
        
        roots[i] = newRoot;
      }
      
      if (maxChange < tolerance) break;
    }
    
    return roots;
  }
  
  /**
   * Evaluate polynomial at complex point
   */
  static evaluatePolynomial(coeffs, z) {
    let result = complex.ComplexNum.of(0, 0);
    let zPower = complex.ComplexNum.of(1, 0);
    
    for (let i = coeffs.length - 1; i >= 0; i--) {
      result = complex.ComplexNum.add(result, complex.ComplexNum.scale(zPower, coeffs[i]));
      zPower = complex.ComplexNum.mul(zPower, z);
    }
    
    return result;
  }
  
  /**
   * Calculate gain normalization
   */
  static calculateGain(roots) {
    // For Bessel filters, normalize so that |H(0)| = 1 for lowpass
    let gain = 1;
    for (const root of roots) {
      const magnitude = Math.hypot(root.re, root.im);
      gain *= magnitude;
    }
    return gain;
  }
  
  /**
   * Factorial function
   */
  static factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
}

exports.BesselFilter = BesselFilter;
exports.default = BesselFilter;
//# sourceMappingURL=bessel-filter.cjs.map

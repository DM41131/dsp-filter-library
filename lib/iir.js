import { ComplexNum } from './complex.js';
import { Util } from './utils.js';
import { FIRDesigner } from './fir.js';
import './fft.js';
import './windows.js';

// iir.js — Infinite Impulse Response filter design
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT


/**
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FiltKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad // a = [1,a1,a2] (digital biquad)
 */

class Bilinear {
  /** Prewarp digital edge f(Hz) -> analog Ω (rad/s) for bilinear transform */
  static prewarp(fHz, fs) {
    return 2 * fs * Math.tan(Math.PI * fHz / fs);
  }
}

/**
 * IIR filter designer (Butterworth, Chebyshev-I, Chebyshev-II, Linkwitz–Riley)
 *
 * Notes:
 * - High-pass is produced by the *analog* LP→HP transform (s → Ωc/s) before bilinear.
 * - Chebyshev-II interprets `cutoffHz` as the **stopband edge** (first frequency reaching `rs` dB).
 * - After bilinear we normalize once at z=1 (LP) or z=−1 (HP); the gain is applied to the last SOS
 *   for better numeric conditioning.
 * - Bandpass/Bandstop currently use FIR fallback (keeps API stable; can be upgraded later).
 */
class IIRDesigner {
  // ----------------------------- Prototype Poles -----------------------------

  /** Normalized (Ωp = 1) Butterworth poles in LHP */
  static butterworthPoles(n) {
    const poles = [];
    for (let k = 0; k < n; k++) {
      const theta = Math.PI * (2 * k + 1 + n) / (2 * n);
      const p = ComplexNum.of(Math.cos(theta), Math.sin(theta));
      if (p.re < 0) poles.push(p);
    }
    return poles;
  }

  /** Normalized (Ωp = 1) Chebyshev-I poles in LHP, rp = passband ripple (dB) */
  static cheby1Poles(n, rp = 1) {
    const eps = Math.sqrt(Math.pow(10, rp / 10) - 1);
    const alpha = Math.asinh(1 / eps) / n;
    const sinhA = Math.sinh(alpha), coshA = Math.cosh(alpha);
    const poles = [];
    for (let k = 0; k < n; k++) {
      const theta = Math.PI * (2 * k + 1) / (2 * n);
      const re = -sinhA * Math.sin(theta);
      const im =  coshA * Math.cos(theta);
      const p = ComplexNum.of(re, im);
      if (p.re < 0) poles.push(p);
    }
    return poles;
  }

  /**
   * Chebyshev-II (inverse Chebyshev) LP prototype with Ωs = 1:
   * returns LHP poles and positive zero frequencies (Ωz) on the jΩ axis.
   * rs: stopband attenuation in dB (e.g., 40).
   */
  static cheby2PolesAndZeros(n, rs) {
    // R = 1/ε, where ε is the inverse-Chebyshev stopband ripple parameter
    const R = Math.sqrt(Math.pow(10, rs / 10) - 1);
    const mu = Math.asinh(R) / n;
    const sinhM = Math.sinh(mu), coshM = Math.cosh(mu);

    const poles = [];
    for (let k = 1; k <= n; k++) {
      const theta = Math.PI * (2 * k - 1) / (2 * n);
      const re = -sinhM * Math.sin(theta);
      const im =  coshM * Math.cos(theta);
      if (re < 0) poles.push(ComplexNum.of(re, im));
    }

    // floor(n/2) finite zero pairs at Ωz = sec(theta_k)
    const zerosW = [];
    const m = Math.floor(n / 2);
    for (let k = 1; k <= m; k++) {
      const theta = Math.PI * (2 * k - 1) / (2 * n);
      zerosW.push(1 / Math.cos(theta)); // sec(theta)
    }

    return { poles, zerosW };
  }

  // ----------------------------- Helpers ------------------------------------

  /** Pair conjugates for SOS construction */
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
        if (Math.abs(p.re - q.re) < 1e-12 && Math.abs(p.im + q.im) < 1e-12) { pair = j; break; }
      }
      if (pair >= 0) { out.push([p, list[pair]]); used[i] = used[pair] = true; }
      else { out.push([p]); used[i] = true; }
    }
    return out;
  }

  /**
   * Analog biquad → digital biquad via bilinear (Tustin).
   * (b2 s^2 + b1 s + b0) / (a2 s^2 + a1 s + a0), with s = K (1 − z⁻¹)/(1 + z⁻¹), K = 2fs.
   */
  static bilinearMapBiquad(b2, b1, b0, a2, a1, a0, fs) {
    const K = 2 * fs;

    const B0 = b2 * K * K + b1 * K + b0;
    const B1 = 2 * (b0 - b2 * K * K);
    const B2 = b2 * K * K - b1 * K + b0;

    const A0 = a2 * K * K + a1 * K + a0;
    const A1 = 2 * (a0 - a2 * K * K);
    const A2 = a2 * K * K - a1 * K + a0;

    return { b: [B0 / A0, B1 / A0, B2 / A0], a: [1, A1 / A0, A2 / A0] };
  }

  /** Evaluate H(z) at a single z0 on the unit circle from direct-form coeffs. */
  static _evalHzAtZ(b, a, z0) {
    const num = b.reduce((acc, bi, i) => acc + bi * Math.pow(z0, -i), 0);
    const den = a.reduce((acc, ai, i) => acc + ai * Math.pow(z0, -i), 0);
    return num / den;
  }

  /**
   * Build LP/HP from normalized prototype poles using proper analog transforms,
   * then bilinear; normalize digitally at z0 (DC for LP, Nyquist for HP).
   */
  static fromPrototype(kind, fs, polesNorm, normalizeAt, wc) {
    /** @type {Biquad[]} */
    const sections = [];

    const pairs = IIRDesigner.pairConjugates(polesNorm);
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

      sections.push(IIRDesigner.bilinearMapBiquad(b2, b1, b0, A2, A1, A0, fs));
    }

    // Compose polynomials, then digital normalization at z0.
    let bPoly = [1], aPoly = [1];
    for (const s of sections) { bPoly = Util.polymul(bPoly, s.b); aPoly = Util.polymul(aPoly, s.a); }

    const g = 1 / IIRDesigner._evalHzAtZ(bPoly, aPoly, normalizeAt);
    if (sections.length > 0) {
      // Apply to the LAST section for better conditioning
      const last = sections.length - 1;
      sections[last].b = sections[last].b.map(v => v * g);
    }

    // Recompute polynomials after gain distribution
    bPoly = [1]; aPoly = [1];
    for (const s of sections) { bPoly = Util.polymul(bPoly, s.b); aPoly = Util.polymul(aPoly, s.a); }

    return { b: bPoly, a: aPoly, sections };
  }

  // ----------------------------- Public Designers ---------------------------

  /** Butterworth (LP/HP); BP/BS via FIR fallback */
  static butterworth(kind, cutoffHz, fs, order) {
    if (order < 1) throw new Error('Order must be >= 1');

    if (kind === 'lowpass' || kind === 'highpass') {
      const fc = /** @type {number} */ (cutoffHz);
      const wc = Bilinear.prewarp(fc, fs);
      const polesNorm = IIRDesigner.butterworthPoles(order);
      const zNorm = (kind === 'lowpass') ? 1 : -1;
      const tf = IIRDesigner.fromPrototype(kind, fs, polesNorm, zNorm, wc);
      return { b: tf.b, a: tf.a, sections: tf.sections };
    }

    if (kind === 'bandpass' || kind === 'bandstop') {
      const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
      if (!(f1 > 0 && f2 > f1 && f2 < fs / 2)) throw new Error('Invalid band edges');
      const orderFIR = Math.max(64, order * 8);
      const tf = FIRDesigner.design(kind, [f1, f2], fs, orderFIR, 'hamming');
      return { b: tf.b, a: tf.a, sections: [] };
    }

    throw new Error('Unsupported IIR kind');
  }

  /** Chebyshev-I (LP/HP); BP/BS via FIR fallback */
  static cheby1(kind, cutoffHz, fs, order, rp = 1) {
    if (order < 1) throw new Error('Order must be >= 1');

    if (kind === 'lowpass' || kind === 'highpass') {
      const fc = /** @type {number} */ (cutoffHz);
      const wc = Bilinear.prewarp(fc, fs);
      const polesNorm = IIRDesigner.cheby1Poles(order, rp);
      const zNorm = (kind === 'lowpass') ? 1 : -1;
      const tf = IIRDesigner.fromPrototype(kind, fs, polesNorm, zNorm, wc);
      return { b: tf.b, a: tf.a, sections: tf.sections };
    }

    if (kind === 'bandpass' || kind === 'bandstop') {
      const [f1, f2] = /** @type {[number, number]} */ (cutoffHz);
      if (!(f1 > 0 && f2 > f1 && f2 < fs / 2)) throw new Error('Invalid band edges');
      const orderFIR = Math.max(64, order * 8);
      const tf = FIRDesigner.design(kind, [f1, f2], fs, orderFIR, 'hamming');
      return { b: tf.b, a: tf.a, sections: [] };
    }

    throw new Error('Unsupported IIR kind');
  }

  /**
   * Chebyshev-II (inverse Chebyshev) — **Lowpass only** here.
   * `cutoffHz` is interpreted as the **stopband edge** (first frequency where attenuation reaches `rs` dB).
   * Other kinds currently fallback to FIR.
   */
  static cheby2(kind, cutoffHz, fs, order, rs = 40) {
    if (order < 1) throw new Error('Order must be >= 1');

    if (kind !== 'lowpass') {
      const orderFIR = Math.max(64, order * 8);
      const tf = FIRDesigner.design(kind, cutoffHz, fs, orderFIR, 'hamming');
      return { b: tf.b, a: tf.a, sections: [] };
    }

    // 1) Prototype with Ωs = 1, then scale by Ωs = prewarp(f_stop)
    const fStop = /** @type {number} */ (cutoffHz);
    const ws = Bilinear.prewarp(fStop, fs);

    const { poles, zerosW } = IIRDesigner.cheby2PolesAndZeros(order, rs);

    // Scale prototype poles and zeros by Ωs
    const P = poles.map(p => ComplexNum.of(p.re * ws, p.im * ws)); // analog poles
    const Z = zerosW.map(wz => ws * wz);                  // analog zero freqs (±jΩz)

    // 2) Build analog second-order sections; track DC numer/denom for analog gain
    const pairs = IIRDesigner.pairConjugates(P);
    const analogSecs = [];
    const numDCs = [];
    const denDCs = [];
    let zi = 0;

    for (const pair of pairs) {
      const [p1, p2] = pair.length === 2 ? pair : [pair[0], null];

      if (p2) {
        // Denominator: (s − p)(s − p*) = s^2 − 2Re(p) s + |p|^2
        const a2 = 1;
        const a1 = -2 * p1.re;
        const a0 = p1.re * p1.re + p1.im * p1.im;

        // Numerator: with a zero pair at ±jΩz if available, else constant (all-pole)
        let b2, b1, b0;
        if (zi < Z.length) {
          const wz = Z[zi++];
          b2 = 1; b1 = 0; b0 = wz * wz; // (s^2 + Ωz^2)
        } else {
          b2 = 0; b1 = 0; b0 = 1;
        }

        analogSecs.push({ b2, b1, b0, a2, a1, a0 });
        numDCs.push(b0);
        denDCs.push(a0);
      } else {
        // First-order section: a1 s + a0, numerator constant
        const a2 = 0, a1 = 1, a0 = -p1.re;
        const b2 = 0, b1 = 0, b0 = 1;
        analogSecs.push({ b2, b1, b0, a2, a1, a0 });
        numDCs.push(1);
        denDCs.push(a0);
      }
    }

    // 3) Force analog DC gain to 1: G = Π a0_k / Π b0_k (apply to LAST section)
    const prod = (arr) => arr.reduce((acc, v) => acc * v, 1);
    const G = prod(denDCs) / prod(numDCs);
    if (analogSecs.length > 0) {
      const last = analogSecs.length - 1;
      analogSecs[last].b2 *= G;
      analogSecs[last].b1 *= G;
      analogSecs[last].b0 *= G;
    }

    // 4) Bilinear-map each analog section
    /** @type {Biquad[]} */
    const sections = analogSecs.map(s =>
      IIRDesigner.bilinearMapBiquad(s.b2, s.b1, s.b0, s.a2, s.a1, s.a0, fs)
    );

    // 5) Compose → final b,a (a0 should be 1)
    let b = [1], a = [1];
    for (const s of sections) { b = Util.polymul(b, s.b); a = Util.polymul(a, s.a); }

    // 6) Digital DC normalization (should already be ~1, but keep it exact)
    const gDig = 1 / IIRDesigner._evalHzAtZ(b, a, 1);
    if (sections.length > 0) {
      const last = sections.length - 1;
      sections[last].b = sections[last].b.map(v => v * gDig);
    }
    b = [1]; a = [1];
    for (const s of sections) { b = Util.polymul(b, s.b); a = Util.polymul(a, s.a); }

    return { b, a, sections };
  }

  /**
   * Linkwitz–Riley (even order only): cascade of two same-order Butterworth filters.
   * Example: order=4 → two 2nd-order Butterworths cascaded.
   */
  static linkwitzRiley(kind, cutoffHz, fs, orderEven = 4) {
    if (orderEven < 2) throw new Error('Order must be >= 2');
    const even = (orderEven % 2 === 0) ? orderEven : (orderEven + 1);
    const half = even / 2;

    const base = IIRDesigner.butterworth(kind, cutoffHz, fs, half);
    const sections = base.sections.concat(base.sections.map(s => ({ b: s.b.slice(), a: s.a.slice() })));
    const b = Util.polymul(base.b, base.b);
    const a = Util.polymul(base.a, base.a);
    return { b, a, sections };
  }
}

export { Bilinear, IIRDesigner };
//# sourceMappingURL=iir.js.map

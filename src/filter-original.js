// dsp.js — Digital Signal Processing micro-library (ESM, no deps)
// License: MIT

/**
 * @typedef {{re:number, im:number}} Complex
 * @typedef {{w:number[], H:Complex[], mag:number[], phase:number[]}} FreqResponse
 * @typedef {{b:number[], a:number[]}} TF
 * @typedef {"lowpass"|"highpass"|"bandpass"|"bandstop"} FiltKind
 * @typedef {{b:number[], a:[number, number, number]}} Biquad // a = [1,a1,a2]
 */

// ==================== Complex ====================
export class ComplexNum {
    /** @returns {Complex} */ static of(re = 0, im = 0) { return { re, im }; }
    /** @returns {Complex} */ static add(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
    /** @returns {Complex} */ static sub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
    /** @returns {Complex} */ static mul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
    /** @returns {Complex} */ static scale(a, s) { return { re: a.re * s, im: a.im * s }; }
    /** @returns {Complex} */ static conj(a) { return { re: a.re, im: -a.im }; }
    /** @returns {Complex} */ static div(a, b) {
      const d = b.re*b.re + b.im*b.im || 1e-300;
      return { re: (a.re*b.re + a.im*b.im)/d, im: (a.im*b.re - a.re*b.im)/d };
    }
    /** @returns {number} */ static abs(a) { return Math.hypot(a.re, a.im); }
    /** @returns {number} */ static arg(a) { return Math.atan2(a.im, a.re); }
    /** @returns {Complex} */ static expj(theta) { return { re: Math.cos(theta), im: Math.sin(theta) }; }
  }
  // legacy alias
  export const C = ComplexNum;
  
  // ==================== Utilities ====================
  export class Util {
    static nextPow2(n) { let p = 1; while (p < n) p <<= 1; return p; }
    static clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
    static linspace(start, end, n) {
      if (n <= 1) return [start];
      const step = (end - start) / (n - 1);
      return Array.from({ length: n }, (_, i) => start + i * step);
    }
    /** Horner for real or complex z */
    static polyval(c, z) {
      if (typeof z === 'number') {
        let y = 0;
        for (let i = 0; i < c.length; i++) y = y * z + c[i];
        return y;
      } else {
        let y = C.of(0, 0);
        for (let i = 0; i < c.length; i++) y = C.add(C.mul(y, z), C.of(c[i], 0));
        return y;
      }
    }
    static convolve(x, h) {
      const y = new Array(x.length + h.length - 1).fill(0);
      for (let i = 0; i < x.length; i++) {
        const xi = x[i];
        for (let j = 0; j < h.length; j++) y[i + j] += xi * h[j];
      }
      return y;
    }
    static polymul(a, b) {
      const na = a.length, nb = b.length;
      const r = new Array(na + nb - 1).fill(0);
      for (let i = 0; i < na; i++)
        for (let j = 0; j < nb; j++)
          r[i + j] += a[i] * b[j];
      return r;
    }
    /** Real-coeff polynomial from complex roots (pairs conjugates) */
    static polyfromroots(roots) {
      const used = new Array(roots.length).fill(false);
      let p = [1];
      for (let i = 0; i < roots.length; i++) {
        if (used[i]) continue;
        const r = roots[i];
        let paired = -1;
        for (let j = i + 1; j < roots.length; j++) {
          if (used[j]) continue;
          const s = roots[j];
          if (Math.abs(r.re - s.re) < 1e-12 && Math.abs(r.im + s.im) < 1e-12) { paired = j; break; }
        }
        if (Math.abs(r.im) < 1e-14 || paired < 0) {
          p = Util.polymul(p, [1, -r.re]);
          used[i] = true;
        } else {
          const a2 = [1, -2*r.re, r.re*r.re + r.im*r.im];
          p = Util.polymul(p, a2);
          used[i] = used[paired] = true;
        }
      }
      return p;
    }
  }
  
  // ==================== FFT (radix-2) ====================
  export class FFT {
    /** @param {Complex[]} x */
    static fft(x) {
      let n = x.length;
      if (n <= 1) return x;
      if ((n & (n - 1)) !== 0) {
        const m = Util.nextPow2(n);
        return FFT.fft(x.concat(Array.from({ length: m - n }, () => C.of(0, 0))));
      }
      // bit-reverse
      let j = 0;
      for (let i = 1; i < n - 1; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) { const t = x[i]; x[i] = x[j]; x[j] = t; }
      }
      // stages
      for (let len = 2; len <= n; len <<= 1) {
        const ang = -2 * Math.PI / len;
        for (let i = 0; i < n; i += len) {
          for (let k = 0; k < len / 2; k++) {
            const w = C.expj(ang * k);
            const u = x[i + k];
            const v = C.mul(x[i + k + (len >> 1)], w);
            x[i + k] = C.add(u, v);
            x[i + k + (len >> 1)] = C.sub(u, v);
          }
        }
      }
      return x;
    }
    /** @param {Complex[]} X */
    static ifft(X) {
      const n = X.length;
      return FFT.fft(X.map(C.conj)).map(C.conj).map(v => C.scale(v, 1 / n));
    }
    /** @param {number[]} x */
    static rfft(x) {
      const n = Util.nextPow2(x.length);
      const a = Array.from({ length: n }, (_, i) => C.of(x[i] || 0, 0));
      return FFT.fft(a);
    }
    /** @param {number[]} x */
    static powerSpectrum(x) {
      return FFT.rfft(x).map(C.abs).map(v => v*v);
    }
  }
  
  // ==================== Windows ====================
  const _i0 = (x) => {
    const ax = Math.abs(x);
    if (ax < 3.75) {
      const t = x / 3.75, t2 = t*t;
      return 1 + t2 * (3.5156229 + t2 * (3.0899424 + t2 * (1.2067492 +
             t2 * (0.2659732 + t2 * (0.0360768 + t2 * 0.0045813)))));
    } else {
      const t = 3.75 / ax;
      return (Math.exp(ax) / Math.sqrt(ax)) * (
        0.39894228 + t * (0.01328592 + t * (0.00225319 + t * (-0.00157565 +
        t * (0.00916281 + t * (-0.02057706 + t * (0.02635537 + t *
        (-0.01647633 + t * 0.00392377)))))))
      );
    }
  };
  
  export class Window {
    static rect(N) { return Array.from({ length: N }, () => 1); }
    static rectangle(N) { return Window.rect(N); }
    static hann(N) { return Array.from({ length: N }, (_, n) => 0.5 - 0.5*Math.cos(2*Math.PI*n/(N-1))); }
    static hamming(N) { return Array.from({ length: N }, (_, n) => 0.54 - 0.46*Math.cos(2*Math.PI*n/(N-1))); }
    static blackman(N) {
      const a0 = 0.42, a1 = 0.5, a2 = 0.08;
      return Array.from({ length: N }, (_, n) =>
        a0 - a1*Math.cos(2*Math.PI*n/(N-1)) + a2*Math.cos(4*Math.PI*n/(N-1)));
    }
    static blackmanHarris(N) {
      const a0 = 0.35875, a1 = 0.48829, a2 = 0.14128, a3 = 0.01168;
      return Array.from({ length: N }, (_, n) =>
        a0 - a1*Math.cos(2*Math.PI*n/(N-1)) + a2*Math.cos(4*Math.PI*n/(N-1)) - a3*Math.cos(6*Math.PI*n/(N-1)));
    }
    static blackmanNuttall(N) {
      const a0 = 0.3635819, a1 = 0.4891775, a2 = 0.1365995, a3 = 0.0106411;
      return Array.from({ length: N }, (_, n) =>
        a0 - a1*Math.cos(2*Math.PI*n/(N-1)) + a2*Math.cos(4*Math.PI*n/(N-1)) - a3*Math.cos(6*Math.PI*n/(N-1)));
    }
    static kaiser(N, beta = 8.6) {
      const denom = _i0(beta), M = N - 1;
      return Array.from({ length: N }, (_, n) => {
        const t = (2*n)/M - 1;
        return _i0(beta * Math.sqrt(1 - t*t)) / denom;
      });
    }
    static tukey(N, alpha = 0.5) {
      const M = N - 1;
      return Array.from({ length: N }, (_, n) => {
        const x = n / M;
        if (alpha <= 0) return 1;
        if (alpha >= 1) return 0.5*(1 - Math.cos(2*Math.PI*x));
        if (x < alpha/2) return 0.5*(1 + Math.cos(Math.PI*(2*x/alpha - 1)));
        if (x <= 1 - alpha/2) return 1;
        return 0.5*(1 + Math.cos(Math.PI*(2*x/alpha - 2/alpha + 1)));
      });
    }
    static gauss(N, sigma = 0.4) {
      const M = N - 1, m2 = M/2;
      return Array.from({ length: N }, (_, n) => {
        const k = (n - m2) / (sigma * m2);
        return Math.exp(-0.5*k*k);
      });
    }
    static bartlett(N) {
      const M = N - 1;
      return Array.from({ length: N }, (_, n) => 1 - Math.abs((n - M/2)/(M/2)));
    }
    static bartlettHann(N) {
      const M = N - 1;
      return Array.from({ length: N }, (_, n) => {
        const x = n / M;
        return 0.62 - 0.48*Math.abs(x - 0.5) - 0.38*Math.cos(2*Math.PI*x);
      });
    }
    static cosine(N) {
      const M = N - 1;
      return Array.from({ length: N }, (_, n) => Math.sin(Math.PI*n/M));
    }
    static lanczos(N) {
      const M = N - 1, m2 = M/2;
      const sinc = (x) => x === 0 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
      return Array.from({ length: N }, (_, n) => sinc((n - m2)/m2));
    }
    static bohman(N) {
      const M = N - 1, m2 = M/2;
      return Array.from({ length: N }, (_, n) => {
        const x = Math.abs(n - m2) / m2;
        return (x <= 1) ? (1 - x)*Math.cos(Math.PI*x) + (1/Math.PI)*Math.sin(Math.PI*x) : 0;
      });
    }
    static flatTop(N) {
      const a0 = 1.0, a1 = 1.93, a2 = 1.29, a3 = 0.388, a4 = 0.028;
      const M = N - 1;
      return Array.from({ length: N }, (_, n) =>
        a0 - a1*Math.cos(2*Math.PI*n/M) + a2*Math.cos(4*Math.PI*n/M) -
        a3*Math.cos(6*Math.PI*n/M) + a4*Math.cos(8*Math.PI*n/M)
      );
    }
    /** @param {keyof Window| string} name */
    static byName(name, N, opts = {}) {
      const { beta = 8.6, alpha = 0.5, sigma = 0.4 } = opts || {};
      switch (name) {
        case 'hann': return Window.hann(N);
        case 'hamming': return Window.hamming(N);
        case 'blackman': return Window.blackman(N);
        case 'blackmanHarris': return Window.blackmanHarris(N);
        case 'blackmanNuttall': return Window.blackmanNuttall(N);
        case 'rectangle':
        case 'rect': return Window.rect(N);
        case 'bartlett': return Window.bartlett(N);
        case 'bartlettHann': return Window.bartlettHann(N);
        case 'cosine': return Window.cosine(N);
        case 'lanczos': return Window.lanczos(N);
        case 'bohman': return Window.bohman(N);
        case 'gauss':
        case 'gaussian': return Window.gauss(N, sigma);
        case 'tukey': return Window.tukey(N, alpha);
        case 'kaiser': return Window.kaiser(N, beta);
        case 'flatTop':
        case 'flattop': return Window.flatTop(N);
        default: return Window.rect(N);
      }
    }
  }
  
  // ==================== FIR ====================
  export class Kernels {
    static sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
    static idealLowpass(fc, fs, N) {
      const M = N - 1, norm = fc / fs;
      return Array.from({ length: N }, (_, n) => Kernels.sinc((n - M/2) * 2 * norm));
    }
  }
  
  export class FIRDesigner {
    /**
     * @param {FiltKind} kind
     * @param {number|[number,number]} cutoffHz
     * @param {number} fs
     * @param {number} order
     * @param {string} window
     * @returns {TF}
     */
    static design(kind, cutoffHz, fs, order, window = 'hann') {
      const N = order + 1;
      const win = Window.byName(window, N);
      const M = N - 1;
      const applyWin = (h) => h.map((v, i) => v * win[i]);
  
      if (kind === 'lowpass') {
        const fc = /** @type {number} */(cutoffHz);
        let h = Kernels.idealLowpass(fc, fs, N);
        const scale = 2 * fc / fs;
        h = h.map(v => v * scale);
        return { b: applyWin(h), a: [1] };
      }
      if (kind === 'highpass') {
        const fc = /** @type {number} */(cutoffHz);
        const lp = FIRDesigner.design('lowpass', fc, fs, order, window).b;
        const b = lp.map((v, n) => (n === M/2 ? 1 - v : -v));
        return { b, a: [1] };
      }
      if (kind === 'bandpass') {
        const [f1, f2] = /** @type {[number,number]} */(cutoffHz);
        const lp2 = FIRDesigner.design('lowpass', f2, fs, order, window).b;
        const lp1 = FIRDesigner.design('lowpass', f1, fs, order, window).b;
        const b = lp2.map((v, i) => v - lp1[i]);
        return { b, a: [1] };
      }
      if (kind === 'bandstop') {
        const [f1, f2] = /** @type {[number,number]} */(cutoffHz);
        const bp = FIRDesigner.design('bandpass', [f1, f2], fs, order, window).b;
        const b = bp.map((v, n) => (n === M/2 ? 1 - v : -v));
        return { b, a: [1] };
      }
      throw new Error('Unsupported FIR type');
    }
  
    static apply(b, x) { return Util.convolve(x, b); }
  
    static overlapAdd(b, x, blockSize) {
      const L = blockSize || 1024;
      const M = b.length;
      const Nfft = Util.nextPow2(L + M - 1);
      const B = FFT.fft(Array.from({ length: Nfft }, (_, i) => C.of(b[i] || 0, 0)));
      const y = new Array(x.length + M - 1).fill(0);
      for (let start = 0; start < x.length; start += L) {
        const xblk = Array.from({ length: Nfft }, (_, i) => C.of(x[start + i] || 0, 0));
        const X = FFT.fft(xblk);
        const Y = X.map((Xk, k) => C.mul(Xk, B[k]));
        const yblk = FFT.ifft(Y);
        for (let i = 0; i < L + M - 1; i++) y[start + i] += yblk[i].re;
      }
      return y;
    }
  }
  
  // ==================== Bilinear & Analog helpers ====================
  export class Bilinear {
    /** prewarp digital edge f(Hz) -> analog Ω(rad/s) */
    static prewarp(fHz, fs) { return 2 * fs * Math.tan(Math.PI * fHz / fs); }
  }
  
  // ==================== IIR Designers (Butterworth & Chebyshev I) ====================
  export class IIRDesigner {
    // ---- Butterworth poles (normalized) ----
    static butterworthPoles(n) {
      const poles = [];
      for (let k = 0; k < n; k++) {
        const theta = Math.PI * (2*k + 1 + n) / (2*n);
        const p = C.of(Math.cos(theta), Math.sin(theta));
        if (p.re < 0) poles.push(p);
      }
      return poles;
    }
  
    // ---- Chebyshev I poles (normalized), rp in dB ----
    static cheby1Poles(n, rp = 1) {
      const eps = Math.sqrt(Math.pow(10, rp / 10) - 1);
      const asinh = (x) => Math.log(x + Math.sqrt(x*x + 1));
      const alpha = asinh(1/eps) / n;
      const sinhA = Math.sinh(alpha), coshA = Math.cosh(alpha);
      const poles = [];
      for (let k = 0; k < n; k++) {
        const theta = Math.PI * (2*k + 1) / (2*n);
        const re = -sinhA * Math.sin(theta);
        const im =  coshA * Math.cos(theta);
        const p = C.of(re, im);
        if (p.re < 0) poles.push(p);
      }
      return poles;
    }
  
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
  
    /** Build digital biquad from analog a2 s^2 + a1 s + a0 via bilinear; numerator shaped by kind (LP/HP). */
    static bilinearBiquad(a2, a1, a0, kind, fs) {
      const T = 1 / fs;
      const K = 2 / T;
      // Denominator mapping
      const d0 = a2*K*K + a1*K + a0;
      const d1 = -2*a2*K*K + 2*a0;
      const d2 = a2*K*K - a1*K + a0;
      /** @type {[number,number,number]} */ const a = [1, d1/d0, d2/d0];
  
      // Numerator prototype (cascaded then globally normalized)
      let b;
      if (kind === 'lowpass') b = [1, 2, 1];
      else if (kind === 'highpass') b = [1, -2, 1];
      else b = [1, 0, -1]; // not used (BP/BS via FIR fallback)
      return { b, a };
    }
  
    /** Convert poles -> cascade of biquads (SOS), then polynomial and global gain normalization. */
    static fromPrototype(kind, fs, poles, normalizeAt /* 1| -1 */) {
      /** @type {Biquad[]} */
      const sections = [];
  
      const pairs = IIRDesigner.pairConjugates(poles);
      for (const pair of pairs) {
        const [p1, p2] = pair.length === 2 ? pair : [pair[0], null];
        // Analog quadratic a2 s^2 + a1 s + a0
        let a2, a1, a0;
        if (p2) {
          const Re2 = -2 * p1.re; // (s - p)(s - p*) = s^2 - 2Re(p)s + |p|^2
          const mag2 = p1.re*p1.re + p1.im*p1.im;
          a2 = 1; a1 = Re2; a0 = mag2;
        } else {
          // single pole (odd order)
          a2 = 0; a1 = 1; a0 = -p1.re;
        }
        sections.push(IIRDesigner.bilinearBiquad(a2, a1, a0, kind, fs));
      }
  
      // Build overall polynomials (for compatibility) & normalize global gain
      let bPoly = [1], aPoly = [1];
      for (const s of sections) {
        bPoly = Util.polymul(bPoly, s.b);
        aPoly = Util.polymul(aPoly, s.a);
      }
      const evalHzAtZ = (b, a, z0) => {
        const num = b.reduce((acc, bi, i) => acc + bi * Math.pow(z0, -i), 0);
        const den = a.reduce((acc, ai, i) => acc + ai * Math.pow(z0, -i), 0);
        return num / den;
      };
      const z0 = normalizeAt;
      const g = 1 / evalHzAtZ(bPoly, aPoly, z0);
      bPoly = bPoly.map(v => v * g);
      for (const s of sections) s.b = s.b.map(v => v * g); // distribute gain across first section is typical; here we scale all equally
      // normalize a[0] = 1
      const gain = aPoly[0];
      if (Math.abs(gain - 1) > 1e-14) {
        bPoly = bPoly.map(v => v / gain);
        aPoly = aPoly.map(v => v / gain);
        for (const s of sections) {
          s.b = s.b.map(v => v / gain);
          s.a = [1, s.a[1]/gain, s.a[2]/gain];
        }
      }
  
      return { b: bPoly, a: aPoly, sections };
    }
  
    /** Butterworth (LP/HP); BP/BS -> FIR fallback */
    static butterworth(kind, cutoffHz, fs, order) {
      if (order < 1) throw new Error('Order must be >= 1');
      if (kind === 'lowpass' || kind === 'highpass') {
        const fc = /** @type {number} */(cutoffHz);
        const pre = Bilinear.prewarp(fc, fs);
        const poles = IIRDesigner.butterworthPoles(order).map(p => C.scale(p, pre));
        const normZ = (kind === 'lowpass') ? 1 : -1;
        const tf = IIRDesigner.fromPrototype(kind, fs, poles, normZ);
        return new Filter(tf.b, tf.a, tf.sections);
      }
      if (kind === 'bandpass' || kind === 'bandstop') {
        const [f1, f2] = /** @type {[number,number]} */(cutoffHz);
        if (!(f1 > 0 && f2 > f1 && f2 < fs/2)) throw new Error('Invalid band edges');
        const orderFIR = Math.max(64, order * 8);
        const tf = FIRDesigner.design(kind, [f1, f2], fs, orderFIR, 'hamming');
        return new Filter(tf.b, tf.a); // FIR
      }
      throw new Error('Unsupported IIR kind');
    }
  
    /** Chebyshev Type I (LP/HP); BP/BS -> FIR fallback */
    static cheby1(kind, cutoffHz, fs, order, rp = 1) {
      if (order < 1) throw new Error('Order must be >= 1');
      if (kind === 'lowpass' || kind === 'highpass') {
        const fc = /** @type {number} */(cutoffHz);
        const pre = Bilinear.prewarp(fc, fs);
        const poles = IIRDesigner.cheby1Poles(order, rp).map(p => C.scale(p, pre));
        const normZ = (kind === 'lowpass') ? 1 : -1;
        const tf = IIRDesigner.fromPrototype(kind, fs, poles, normZ);
        return new Filter(tf.b, tf.a, tf.sections);
      }
      if (kind === 'bandpass' || kind === 'bandstop') {
        const [f1, f2] = /** @type {[number,number]} */(cutoffHz);
        if (!(f1 > 0 && f2 > f1 && f2 < fs/2)) throw new Error('Invalid band edges');
        const orderFIR = Math.max(64, order * 8);
        const tf = FIRDesigner.design(kind, [f1, f2], fs, orderFIR, 'hamming');
        return new Filter(tf.b, tf.a);
      }
      throw new Error('Unsupported IIR kind');
    }
  }
  
  // ==================== Z-domain helpers ====================
  export class ZDomain {
    /** @returns {Complex} */
    static evalHz(b, a, z) {
      const zinv = C.div(C.of(1,0), z);
      const pow = (k) => {
        let p = C.of(1,0);
        for (let i = 0; i < k; i++) p = C.mul(p, zinv);
        return p;
      };
      let num = C.of(0,0);
      for (let k = 0; k < b.length; k++) num = C.add(num, C.scale(pow(k), b[k]));
      let den = C.of(1,0);
      for (let k = 1; k < a.length; k++) den = C.add(den, C.scale(pow(k), a[k]));
      return C.div(num, den);
    }
    /** @returns {FreqResponse} */
    static freqz(b, a, N = 512) {
      const w = Util.linspace(0, Math.PI, N);
      const H = w.map(wi => ZDomain.evalHz(b, a, C.expj(wi)));
      const mag = H.map(C.abs);
      const phase = H.map(C.arg);
      return { w, H, mag, phase };
    }
    static groupDelay(b, a, N = 512) {
      const { w, phase } = ZDomain.freqz(b, a, N);
      const unwrapped = [...phase];
      for (let i = 1; i < unwrapped.length; i++) {
        let d = unwrapped[i] - unwrapped[i-1];
        while (d > Math.PI) { unwrapped[i] -= 2*Math.PI; d -= 2*Math.PI; }
        while (d < -Math.PI) { unwrapped[i] += 2*Math.PI; d += 2*Math.PI; }
      }
      const dw = w[1] - w[0];
      const gd = unwrapped.map((_, i) => (i === 0 || i === unwrapped.length - 1) ? 0
        : -(unwrapped[i+1] - unwrapped[i-1]) / (2*dw));
      return { w, gd };
    }
    static isStable(/* a */) { return true; } // placeholder
  }
  
  // ==================== Filter (OOP) ====================
  export class Filter {
    /**
     * @param {number[]} b
     * @param {number[]} a
     * @param {Biquad[]=} sections cascaded SOS for stable streaming (optional for FIR)
     */
    constructor(b, a = [1], sections = []) {
      // normalize a[0] = 1
      if (Math.abs(a[0] - 1) > 1e-12) {
        b = b.map(v => v / a[0]);
        a = a.map(v => v / a[0]);
      }
      this.b = b.slice();
      this.a = a.slice();
      this.sections = (sections || []).map(s => ({ b: s.b.slice(), a: [1, s.a[1], s.a[2]] }));
  
      // streaming state
      if (this.sections.length > 0) {
        // DF2T states per biquad: [w1, w2]
        this._sosState = this.sections.map(() => ({ w1: 0, w2: 0 }));
      } else if (this.a.length === 1) {
        // FIR state circular buffer
        this._firIdx = 0;
        this._firBuf = new Array(this.b.length).fill(0);
      } else {
        // single-section IIR fallback DF2T
        const N = Math.max(this.b.length, this.a.length) - 1;
        this._iirW = new Array(N).fill(0);
      }
    }
  
    /** Reset internal states (for streaming). */
    reset() {
      if (this._sosState) this._sosState.forEach(s => { s.w1 = 0; s.w2 = 0; });
      if (this._firBuf) this._firBuf.fill(0), this._firIdx = 0;
      if (this._iirW) this._iirW.fill(0);
    }
  
    /** Process one sample through the cascade. */
    processSample(x) {
      if (this.sections.length > 0) {
        let v = x;
        for (let i = 0; i < this.sections.length; i++) {
          const { b, a } = this.sections[i]; // b0,b1,b2 ; a=[1,a1,a2]
          const st = this._sosState[i];
          const w0 = v - a[1]*st.w1 - a[2]*st.w2;
          const y0 = b[0]*w0 + b[1]*st.w1 + b[2]*st.w2;
          st.w2 = st.w1; st.w1 = w0;
          v = y0;
        }
        return v;
      }
  
      if (this.a.length === 1) {
        // FIR ring buffer
        this._firBuf[this._firIdx] = x;
        let y = 0, idx = this._firIdx;
        for (let k = 0; k < this.b.length; k++) {
          y += this.b[k] * this._firBuf[idx];
          idx = (idx - 1 + this._firBuf.length) % this._firBuf.length;
        }
        this._firIdx = (this._firIdx + 1) % this._firBuf.length;
        return y;
      }
  
      // Single-section IIR DF2T with full polynomials
      let wn = x;
      for (let k = 1; k < this.a.length; k++) wn -= this.a[k] * (this._iirW[k-1] || 0);
      let yn = this.b[0]*wn;
      for (let k = 1; k < this.b.length; k++) yn += (this._iirW[k-1] || 0) * this.b[k];
      for (let k = this._iirW.length-1; k > 0; k--) this._iirW[k] = this._iirW[k-1];
      this._iirW[0] = wn;
      return yn;
      }
  
    /** Apply to an entire signal (copies states, does not reset). */
    applySignal(x) {
      const y = new Array(x.length);
      for (let i=0;i<x.length;i++) y[i] = this.processSample(x[i]);
      return y;
    }
  
    /** Frequency response (0..fs/2). */
    frequencyResponse(fs, N = 1024) {
      const fr = ZDomain.freqz(this.b, this.a, N);
      const f = fr.w.map(w => w * fs / (2*Math.PI));
      return { f, mag: fr.mag, phase: fr.phase, H: fr.H };
    }
  
    /** @returns {TF} */
    toJSON(){ return { b: this.b.slice(), a: this.a.slice() }; }
  
    // ---------- factories ----------
    /** @returns {Filter} */
    static fromTF(b,a){ return new Filter(b,a); }
    /** @returns {Filter} */
    static designFIR(kind, cutoffHz, fs, order, window='hann'){
      const tf = FIRDesigner.design(kind, cutoffHz, fs, order, window);
      return new Filter(tf.b, tf.a);
    }
    /** @returns {Filter} */
    static designButter(kind, cutoffHz, fs, order){
      return IIRDesigner.butterworth(kind, cutoffHz, fs, order);
    }
    /** @returns {Filter} */
    static designCheby1(kind, cutoffHz, fs, order, rp=1){
      return IIRDesigner.cheby1(kind, cutoffHz, fs, order, rp);
    }
  }
  
  // ==================== Friendly helpers / Back-compat ====================
  /** Back-compat: function frequencyResponse({b,a}, fs, N) */
  export function frequencyResponse(tf, fs, N = 1024) {
    const f = Filter.fromTF(tf.b, tf.a).frequencyResponse(fs, N);
    return { f: f.f, mag: f.mag, phase: f.phase, H: f.H };
  }
  
  /** Back-compat: module-like namespaces (thin wrappers) */
  export const FIR = {
    design: (kind, cutoffHz, fs, order, window='hann') =>
      FIRDesigner.design(kind, cutoffHz, fs, order, window),
    apply: (b, x) => FIRDesigner.apply(b, x),
    overlapAdd: (b,x,blockSize) => FIRDesigner.overlapAdd(b,x,blockSize),
  };
  
  export const IIR = {
    butterworth: (kind, cutoffHz, fs, order) =>
      Filter.designButter(kind, cutoffHz, fs, order).toJSON(),
    cheby1: (kind, cutoffHz, fs, order, rp=1) =>
      Filter.designCheby1(kind, cutoffHz, fs, order, rp).toJSON(),
    apply: (b, a, x) => Filter.fromTF(b,a).applySignal(x),
  };
  
  export const Z = {
    evalHz: (b,a,z) => ZDomain.evalHz(b,a,z),
    freqz: (b,a,N=512) => ZDomain.freqz(b,a,N),
    groupDelay: (b,a,N=512) => ZDomain.groupDelay(b,a,N),
    isStable: (/*a*/) => ZDomain.isStable(),
  };
  
  export const FilterFactory = {
    designFIR: Filter.designFIR,
    designButter: Filter.designButter,
    designCheby1: Filter.designCheby1,
    apply: (tf, x) => Filter.fromTF(tf.b, tf.a).applySignal(x),
  };
  
  // ==================== Default export ====================
  export default {
    // classes
    ComplexNum, C,
    Util, FFT, Window, Kernels,
    FIRDesigner, IIRDesigner, Bilinear,
    ZDomain,
    Filter,
    // compat-style namespaces & helpers
    FIR, IIR, Z,
    FilterFactory,
    frequencyResponse,
  };
  
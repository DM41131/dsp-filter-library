// windows.js — Windowing functions for DSP
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

/**
 * Windowing functions for digital signal processing
 */
class Window {
    static rect(N) { 
        return Array.from({ length: N }, () => 1); 
    }
    
    static rectangle(N) { 
        return Window.rect(N); 
    }
    
    static hann(N) { 
        return Array.from({ length: N }, (_, n) => 0.5 - 0.5*Math.cos(2*Math.PI*n/(N-1))); 
    }
    
    static hamming(N) { 
        return Array.from({ length: N }, (_, n) => 0.54 - 0.46*Math.cos(2*Math.PI*n/(N-1))); 
    }
    
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

// Modified Bessel function of the first kind, order zero
const _i0 = (x) => {
    const ax = Math.abs(x);
    if (ax < 3.75) {
        const t = x / 3.75, t2 = t*t;
        return 1 + t2 * (3.5156229 + t2 * (3.0899424 + t2 * (1.2067492 +
                t2 * (0.2659732 + t2 * (0.0360768 + t2 * 0.0045813)))));
    } else {
        const t = 3.75 / ax;
        return (Math.exp(ax) / Math.sqrt(ax)) * (
            0.39894228 + t * (0.01328592 + t * (0.00225319 + t * (-157565e-8 +
            t * (0.00916281 + t * (-0.02057706 + t * (0.02635537 + t *
            (-0.01647633 + t * 0.00392377)))))))
        );
    }
};

export { Window };
//# sourceMappingURL=windows.js.map

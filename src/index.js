// index.js — Main entry point for DSP library
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

// Core modules
export { ComplexNum, C } from './complex.js';
export { Util } from './utils.js';
export { FFT } from './fft.js';
export { Window } from './windows.js';
export { Kernels, FIRDesigner } from './fir.js';
export { IIRDesigner } from './iir.js';
export { ZDomain } from './zdomain.js';

// Individual filter classes
export { ButterworthFilter } from './butterworth-filter.js';
export { ChebyshevFilter } from './chebyshev-filter.js';
export { ChebyshevType2Filter } from './chebyshev-type2-filter.js';
export { LinkwitzRileyFilter } from './linkwitz-riley-filter.js';
export { EllipticFilter } from './elliptic-filter.js';
export { BesselFilter } from './bessel-filter.js';
export { BaseIIRFilter } from './base-iir-filter.js';

// Main Filter class
export { Filter } from './filter-class.js';

// Import for internal use
import { ComplexNum, C } from './complex.js';
import { Util } from './utils.js';
import { FFT } from './fft.js';
import { Window } from './windows.js';
import { Kernels, FIRDesigner } from './fir.js';
import { IIRDesigner } from './iir.js';
import { ZDomain } from './zdomain.js';
import { Filter } from './filter-class.js';
import { ButterworthFilter } from './butterworth-filter.js';
import { ChebyshevFilter } from './chebyshev-filter.js';
import { ChebyshevType2Filter } from './chebyshev-type2-filter.js';
import { LinkwitzRileyFilter } from './linkwitz-riley-filter.js';
import { EllipticFilter } from './elliptic-filter.js';
import { BesselFilter } from './bessel-filter.js';
import { BaseIIRFilter } from './base-iir-filter.js';

// Backward compatibility namespaces
export const FIR = {
    design: (kind, cutoffHz, fs, order, window='hann') => {
        return FIRDesigner.design(kind, cutoffHz, fs, order, window);
    },
    apply: (b, x) => {
        return FIRDesigner.apply(b, x);
    },
    overlapAdd: (b,x,blockSize) => {
        return FIRDesigner.overlapAdd(b,x,blockSize);
    },
};

export const IIR = {
    butterworth: (kind, cutoffHz, fs, order) => {
        const result = IIRDesigner.butterworth(kind, cutoffHz, fs, order);
        return { b: result.b, a: result.a };
    },
    cheby1: (kind, cutoffHz, fs, order, rp=1) => {
        const result = IIRDesigner.cheby1(kind, cutoffHz, fs, order, rp);
        return { b: result.b, a: result.a };
    },
    cheby2: (kind, cutoffHz, fs, order, rs=40) => {
        const result = IIRDesigner.cheby2(kind, cutoffHz, fs, order, rs);
        return { b: result.b, a: result.a };
    },
    linkwitzRiley: (kind, cutoffHz, fs, orderEven=4) => {
        const result = IIRDesigner.linkwitzRiley(kind, cutoffHz, fs, orderEven);
        return { b: result.b, a: result.a };
    },
    apply: (b, a, x) => {
        return Filter.fromTF(b,a).applySignal(x);
    },
};

export const Z = {
    evalHz: (b,a,z) => ZDomain.evalHz(b,a,z),
    freqz: (b,a,N=512) => ZDomain.freqz(b,a,N),
    groupDelay: (b,a,N=512) => ZDomain.groupDelay(b,a,N),
    isStable: () => ZDomain.isStable(),
};

// Default export
export default {
    // Core classes
    ComplexNum, C,
    Util, FFT, Window, Kernels,
    FIRDesigner, IIRDesigner,
    ZDomain, Filter,
    // Individual filter classes
    ButterworthFilter, ChebyshevFilter, ChebyshevType2Filter, LinkwitzRileyFilter, EllipticFilter, BesselFilter, BaseIIRFilter,
    // Backward compatibility
    FIR, IIR, Z,
};

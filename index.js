// index.js — Main entry point for DSP library
// License: MIT

// Core modules
export { ComplexNum, C } from './complex.js';
export { Util } from './utils.js';
export { FFT } from './fft.js';
export { Window } from './windows.js';
export { Kernels, FIRDesigner } from './fir.js';
export { Bilinear, IIRDesigner } from './iir.js';
export { ZDomain } from './zdomain.js';

// Main Filter class
export { Filter } from './filter-class.js';

// Import for internal use
import { ComplexNum, C } from './complex.js';
import { Util } from './utils.js';
import { FFT } from './fft.js';
import { Window } from './windows.js';
import { Kernels, FIRDesigner } from './fir.js';
import { Bilinear, IIRDesigner } from './iir.js';
import { ZDomain } from './zdomain.js';
import { Filter } from './filter-class.js';

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
    FIRDesigner, IIRDesigner, Bilinear,
    ZDomain, Filter,
    // Backward compatibility
    FIR, IIR, Z,
};

import { C, ComplexNum } from './complex.js';
import { Util } from './utils.js';
import { FFT } from './fft.js';
import { Window } from './windows.js';
import { FIRDesigner, Kernels } from './fir.js';
import { Bilinear, IIRDesigner } from './iir.js';
import { ZDomain } from './zdomain.js';
import { Filter } from './filter.js';

// index.js — Main entry point for DSP library
// License: MIT


// Backward compatibility namespaces
const FIR = {
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

const IIR = {
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

const Z = {
    evalHz: (b,a,z) => ZDomain.evalHz(b,a,z),
    freqz: (b,a,N=512) => ZDomain.freqz(b,a,N),
    groupDelay: (b,a,N=512) => ZDomain.groupDelay(b,a,N),
    isStable: () => ZDomain.isStable(),
};

// Default export
var index = {
    // Core classes
    ComplexNum, C,
    Util, FFT, Window, Kernels,
    FIRDesigner, IIRDesigner, Bilinear,
    ZDomain, Filter,
    // Backward compatibility
    FIR, IIR, Z,
};

export { Bilinear, C, ComplexNum, FFT, FIR, FIRDesigner, Filter, IIR, IIRDesigner, Kernels, Util, Window, Z, ZDomain, index as default };
//# sourceMappingURL=index.js.map

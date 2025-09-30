'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var complex = require('./complex.cjs');
var utils = require('./utils.cjs');
var fft = require('./fft.cjs');
var windows = require('./windows.cjs');
var fir = require('./fir.cjs');
var iir = require('./iir.cjs');
var zdomain = require('./zdomain.cjs');
var filter = require('./filter.cjs');

// index.js — Main entry point for DSP library
// License: MIT


// Backward compatibility namespaces
const FIR = {
    design: (kind, cutoffHz, fs, order, window='hann') => {
        return fir.FIRDesigner.design(kind, cutoffHz, fs, order, window);
    },
    apply: (b, x) => {
        return fir.FIRDesigner.apply(b, x);
    },
    overlapAdd: (b,x,blockSize) => {
        return fir.FIRDesigner.overlapAdd(b,x,blockSize);
    },
};

const IIR = {
    butterworth: (kind, cutoffHz, fs, order) => {
        const result = iir.IIRDesigner.butterworth(kind, cutoffHz, fs, order);
        return { b: result.b, a: result.a };
    },
    cheby1: (kind, cutoffHz, fs, order, rp=1) => {
        const result = iir.IIRDesigner.cheby1(kind, cutoffHz, fs, order, rp);
        return { b: result.b, a: result.a };
    },
    apply: (b, a, x) => {
        return filter.Filter.fromTF(b,a).applySignal(x);
    },
};

const Z = {
    evalHz: (b,a,z) => zdomain.ZDomain.evalHz(b,a,z),
    freqz: (b,a,N=512) => zdomain.ZDomain.freqz(b,a,N),
    groupDelay: (b,a,N=512) => zdomain.ZDomain.groupDelay(b,a,N),
    isStable: () => zdomain.ZDomain.isStable(),
};

// Default export
var index = {
    // Core classes
    ComplexNum: complex.ComplexNum, C: complex.C,
    Util: utils.Util, FFT: fft.FFT, Window: windows.Window, Kernels: fir.Kernels,
    FIRDesigner: fir.FIRDesigner, IIRDesigner: iir.IIRDesigner, Bilinear: iir.Bilinear,
    ZDomain: zdomain.ZDomain, Filter: filter.Filter,
    // Backward compatibility
    FIR, IIR, Z,
};

exports.C = complex.C;
exports.ComplexNum = complex.ComplexNum;
exports.Util = utils.Util;
exports.FFT = fft.FFT;
exports.Window = windows.Window;
exports.FIRDesigner = fir.FIRDesigner;
exports.Kernels = fir.Kernels;
exports.Bilinear = iir.Bilinear;
exports.IIRDesigner = iir.IIRDesigner;
exports.ZDomain = zdomain.ZDomain;
exports.Filter = filter.Filter;
exports.FIR = FIR;
exports.IIR = IIR;
exports.Z = Z;
exports.default = index;
//# sourceMappingURL=index.cjs.map

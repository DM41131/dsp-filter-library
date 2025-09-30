// types.d.ts — TypeScript type definitions for DSP Filter Library

export interface Complex {
  re: number;
  im: number;
}

export interface FreqResponse {
  w: number[];
  H: Complex[];
  mag: number[];
  phase: number[];
}

export interface TF {
  b: number[];
  a: number[];
}

export type FiltKind = "lowpass" | "highpass" | "bandpass" | "bandstop";

export interface Biquad {
  b: number[];
  a: [number, number, number];
}

export interface FilterOptions {
  beta?: number;
  alpha?: number;
  sigma?: number;
}

export interface FrequencyResponseResult {
  f: number[];
  mag: number[];
  phase: number[];
  H: Complex[];
}

export interface GroupDelayResult {
  w: number[];
  gd: number[];
}

// Complex number operations
export declare class ComplexNum {
  static of(re?: number, im?: number): Complex;
  static add(a: Complex, b: Complex): Complex;
  static sub(a: Complex, b: Complex): Complex;
  static mul(a: Complex, b: Complex): Complex;
  static scale(a: Complex, s: number): Complex;
  static conj(a: Complex): Complex;
  static div(a: Complex, b: Complex): Complex;
  static abs(a: Complex): number;
  static arg(a: Complex): number;
  static expj(theta: number): Complex;
}

export declare const C: typeof ComplexNum;

// Utility functions
export declare class Util {
  static nextPow2(n: number): number;
  static clamp(v: number, lo: number, hi: number): number;
  static linspace(start: number, end: number, n: number): number[];
  static polyval(c: number[], z: number | Complex): number | Complex;
  static convolve(x: number[], h: number[]): number[];
  static polymul(a: number[], b: number[]): number[];
  static polyfromroots(roots: Complex[]): number[];
}

// FFT operations
export declare class FFT {
  static fft(x: Complex[]): Complex[];
  static ifft(X: Complex[]): Complex[];
  static rfft(x: number[]): Complex[];
  static powerSpectrum(x: number[]): number[];
}

// Window functions
export declare class Window {
  static rect(N: number): number[];
  static rectangle(N: number): number[];
  static hann(N: number): number[];
  static hamming(N: number): number[];
  static blackman(N: number): number[];
  static blackmanHarris(N: number): number[];
  static blackmanNuttall(N: number): number[];
  static kaiser(N: number, beta?: number): number[];
  static tukey(N: number, alpha?: number): number[];
  static gauss(N: number, sigma?: number): number[];
  static bartlett(N: number): number[];
  static bartlettHann(N: number): number[];
  static cosine(N: number): number[];
  static lanczos(N: number): number[];
  static bohman(N: number): number[];
  static flatTop(N: number): number[];
  static byName(name: string, N: number, opts?: FilterOptions): number[];
}

// FIR filter design
export declare class Kernels {
  static sinc(x: number): number;
  static idealLowpass(fc: number, fs: number, N: number): number[];
}

export declare class FIRDesigner {
  static design(kind: FiltKind, cutoffHz: number | [number, number], fs: number, order: number, window?: string): TF;
  static apply(b: number[], x: number[]): number[];
  static overlapAdd(b: number[], x: number[], blockSize?: number): number[];
}

// IIR filter design
export declare class Bilinear {
  static prewarp(fHz: number, fs: number): number;
}

export declare class IIRDesigner {
  static butterworthPoles(n: number): Complex[];
  static cheby1Poles(n: number, rp?: number): Complex[];
  static pairConjugates(list: Complex[]): Complex[][];
  static bilinearBiquad(a2: number, a1: number, a0: number, kind: FiltKind, fs: number): { b: number[]; a: [number, number, number] };
  static fromPrototype(kind: FiltKind, fs: number, poles: Complex[], normalizeAt: number): { b: number[]; a: number[]; sections: Biquad[] };
  static butterworth(kind: FiltKind, cutoffHz: number | [number, number], fs: number, order: number): { b: number[]; a: number[]; sections: Biquad[] };
  static cheby1(kind: FiltKind, cutoffHz: number | [number, number], fs: number, order: number, rp?: number): { b: number[]; a: number[]; sections: Biquad[] };
}

// Z-domain operations
export declare class ZDomain {
  static evalHz(b: number[], a: number[], z: Complex): Complex;
  static freqz(b: number[], a: number[], N?: number): FreqResponse;
  static groupDelay(b: number[], a: number[], N?: number): GroupDelayResult;
  static isStable(): boolean;
}

// Main Filter class
export declare class Filter {
  b: number[];
  a: number[];
  sections: Biquad[];
  
  constructor(b: number[], a?: number[], sections?: Biquad[]);
  reset(): void;
  processSample(x: number): number;
  applySignal(x: number[]): number[];
  frequencyResponse(fs: number, N?: number): FrequencyResponseResult;
  toJSON(): TF;
  
  static fromTF(b: number[], a: number[]): Filter;
  static designFIR(kind: FiltKind, cutoffHz: number | [number, number], fs: number, order: number, window?: string): Filter;
  static designButter(kind: FiltKind, cutoffHz: number | [number, number], fs: number, order: number): Filter;
  static designCheby1(kind: FiltKind, cutoffHz: number | [number, number], fs: number, order: number, rp?: number): Filter;
}

// Backward compatibility namespaces
export declare const FIR: {
  design: (kind: FiltKind, cutoffHz: number | [number, number], fs: number, order: number, window?: string) => TF;
  apply: (b: number[], x: number[]) => number[];
  overlapAdd: (b: number[], x: number[], blockSize?: number) => number[];
};

export declare const IIR: {
  butterworth: (kind: FiltKind, cutoffHz: number | [number, number], fs: number, order: number) => TF;
  cheby1: (kind: FiltKind, cutoffHz: number | [number, number], fs: number, order: number, rp?: number) => TF;
  apply: (b: number[], a: number[], x: number[]) => number[];
};

export declare const Z: {
  evalHz: (b: number[], a: number[], z: Complex) => Complex;
  freqz: (b: number[], a: number[], N?: number) => FreqResponse;
  groupDelay: (b: number[], a: number[], N?: number) => GroupDelayResult;
  isStable: () => boolean;
};

export declare const FilterFactory: {
  designFIR: typeof Filter.designFIR;
  designButter: typeof Filter.designButter;
  designCheby1: typeof Filter.designCheby1;
  apply: (tf: TF, x: number[]) => number[];
};

// Utility function
export declare function frequencyResponse(tf: TF, fs: number, N?: number): FrequencyResponseResult;

// Default export
declare const DSP: {
  ComplexNum: typeof ComplexNum;
  C: typeof ComplexNum;
  Util: typeof Util;
  FFT: typeof FFT;
  Window: typeof Window;
  Kernels: typeof Kernels;
  FIRDesigner: typeof FIRDesigner;
  IIRDesigner: typeof IIRDesigner;
  Bilinear: typeof Bilinear;
  ZDomain: typeof ZDomain;
  Filter: typeof Filter;
  FIR: typeof FIR;
  IIR: typeof IIR;
  Z: typeof Z;
  FilterFactory: typeof FilterFactory;
  frequencyResponse: typeof frequencyResponse;
};

export default DSP;

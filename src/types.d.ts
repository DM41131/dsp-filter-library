// TypeScript definitions for DSP Filter Library
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

// Core types
export interface Complex {
  re: number;
  im: number;
}

export interface ComplexArray extends Array<Complex> {}

// Core utilities
export declare const TAU: number;
export declare function linspace(a: number, b: number, n: number): number[];
export declare function unwrapPhase(phRad: number[]): number[];

// Complex number operations
export declare class Cx {
  static add(a: Complex, b: Complex): Complex;
  static sub(a: Complex, b: Complex): Complex;
  static mul(a: Complex, b: Complex): Complex;
  static div(a: Complex, b: Complex): Complex;
  static abs(a: Complex): number;
  static conj(a: Complex): Complex;
}

// Polynomial operations
export declare class Poly {
  static evalRealAsc(coeffs: number[], z: Complex): Complex;
}

// Root finding
export declare class Roots {
  static aberthMonic(raw: number[]): Complex[];
  static dkScaled(raw: number[]): Complex[];
}

// Analog prototypes
export interface PrototypeResult {
  poles: Complex[];
  zeros: Complex[];
  family?: string;
  order?: number;
  enforcedOrder?: number;
}

export declare class Prototypes {
  static butter(N: number): PrototypeResult;
  static cheby1(N: number, Rp: number): PrototypeResult;
  static cheby2(N: number, Rs: number): PrototypeResult;
  static ellipHybrid(N: number, Rp: number, Rs: number): PrototypeResult;
  static linkwitzRiley(N: number): PrototypeResult;
  static bessel(N: number): PrototypeResult;
}

// Bilinear Transform
export declare class BLT {
  static prewarp(f: number, Fs: number): number;
  static sToZ(s: Complex, Fs: number): Complex;
  static quad(a: Complex, b: Complex, c: Complex): [Complex, Complex];
}

// Second Order Sections
export interface SOSSection {
  b: [number, number, number];
  a: [number, number, number];
}

export declare class SOS {
  static fromZPK(zZeros: Complex[], zPoles: Complex[], gain?: number): SOSSection[];
}

// Digital response calculations
export declare class Response {
  static H_w_IIR(sections: SOSSection[], w: number): Complex;
  static H_w_FIR(taps: number[], w: number): Complex;
  static magDbFromH(H: Complex): number;
  static unwrapToDeg(phRad: number[]): number[];
  static groupDelay(phUnwrappedRad: number[], w: number[]): number[];
  static phaseDelay(phUnwrappedRad: number[], w: number[]): number[];
}

// Window functions
export declare class Windows {
  static rect(M: number): number[];
  static hann(M: number): number[];
  static hamming(M: number): number[];
  static blackman(M: number): number[];
  static kaiser(M: number, beta: number): number[];
  static byName(name: string, M: number, beta?: number): number[];
}

// FIR filter designer
export interface FIRSpec {
  kind: 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';
  taps: number;
  Fs: number;
  f1: number;
  f2?: number;
  window?: string;
  beta?: number;
}

export declare class FIRDesigner {
  constructor(spec: FIRSpec);
  design(): FIRFilter;
}

// FIR filter zeros
export declare class FIRZeros {
  static fromTapsRobust(taps: number[]): Complex[];
}

// IIR filter designer
export interface IIRSpec {
  family: 'butter' | 'cheby1' | 'cheby2' | 'ellip' | 'linkwitz' | 'bessel';
  kind: 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';
  N: number;
  Rp?: number;
  Rs?: number;
  Fs: number;
  f1: number;
  f2?: number;
}

export declare class IIRDesigner {
  constructor(spec: IIRSpec);
  design(): IIRFilter;
}

// Filter models
export interface FrequencyGrid {
  w: number[];
  freqHz: number[];
  magdB: number[];
  phaseDeg: number[];
  gdSamples: number[];
  pdSamples: number[];
}

export interface FIRFilterInit {
  taps: number[];
  Fs: number;
}

export declare class FIRFilter {
  constructor(init: FIRFilterInit);
  readonly type: 'FIR';
  readonly taps: number[];
  readonly Fs: number;
  impulseResponse(L?: number): number[];
  zeros(): Complex[];
  frequencyGrid(Nf?: number): FrequencyGrid;
}

export interface IIRFilterInit {
  sections: SOSSection[];
  Fs: number;
  zPoles: Complex[];
  zZeros: Complex[];
}

export declare class IIRFilter {
  constructor(init: IIRFilterInit);
  readonly type: 'IIR';
  readonly sections: SOSSection[];
  readonly Fs: number;
  readonly zPoles: Complex[];
  readonly zZeros: Complex[];
  impulseResponse(L?: number): number[];
  frequencyGrid(Nf?: number): FrequencyGrid;
}

// Main FilterDSP class
export declare class FilterDSP {
  static designFIR(spec: FIRSpec): FIRFilter;
  static designIIR(spec: IIRSpec): IIRFilter;
}

// Re-export all types for convenience
export type {
  Complex,
  ComplexArray,
  PrototypeResult,
  SOSSection,
  FIRSpec,
  IIRSpec,
  FrequencyGrid,
  FIRFilterInit,
  IIRFilterInit
};

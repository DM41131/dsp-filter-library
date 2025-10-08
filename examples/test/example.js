// example.js — Basic validation tests for dsp-filter-library
// Ensures core modules can be imported and perform representative operations.

import assert from 'node:assert/strict';
import { ComplexNum, FFT, Window, Filter } from '../../lib/index.js';

const approxEqual = (actual, expected, tol = 1e-6) => {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `Expected ${actual} to be within ${tol} of ${expected}`,
  );
};

// Complex number operations should produce exact analytical results.
const z1 = ComplexNum.of(3, 4);
const z2 = ComplexNum.of(-1, 2);
const zSum = ComplexNum.add(z1, z2);
assert.deepEqual(zSum, { re: 2, im: 6 });

const zProduct = ComplexNum.mul(ComplexNum.of(0, 1), ComplexNum.of(0, 1));
assert.deepEqual(zProduct, { re: -1, im: 0 });
approxEqual(ComplexNum.abs(z1), 5);

// FFT of a simple real signal should match the analytical DFT values.
const fftInput = [1, 0, -1, 0];
const fftExpected = [
  { re: 0, im: 0 },
  { re: 2, im: 0 },
  { re: 0, im: 0 },
  { re: 2, im: 0 },
];
const fftResult = FFT.rfft(fftInput);
assert.equal(fftResult.length, fftExpected.length);
fftExpected.forEach((expected, idx) => {
  approxEqual(fftResult[idx].re, expected.re, 1e-6);
  approxEqual(fftResult[idx].im, expected.im, 1e-6);
});

// Hann window coefficients should match the textbook values.
const hannWindow = Window.hann(4);
const hannExpected = [0, 0.75, 0.75, 0];
hannExpected.forEach((expected, idx) => {
  approxEqual(hannWindow[idx], expected, 1e-12);
});

// Designed Butterworth low-pass filter should pass low frequencies and attenuate high frequencies.
const sampleRate = 44100;
const lowpassFilter = Filter.designButter('lowpass', 1000, sampleRate, 4);
const { mag } = lowpassFilter.frequencyResponse(sampleRate, 256);
assert.ok(mag[0] > 0.9, `Expected strong DC gain but received ${mag[0]}`);
assert.ok(mag[mag.length - 1] < 0.2, `Expected high-frequency attenuation but received ${mag[mag.length - 1]}`);

const testSignal = Array.from({ length: 32 }, (_, i) => Math.sin(2 * Math.PI * 100 * i / sampleRate));
const filteredSignal = lowpassFilter.applySignal(testSignal);
assert.equal(filteredSignal.length, testSignal.length);
filteredSignal.forEach((sample, idx) => {
  assert.ok(Number.isFinite(sample), `Sample ${idx} is not finite`);
});

console.log('All example tests passed.');

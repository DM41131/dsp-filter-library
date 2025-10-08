// example.js — Basic validation tests for dsp-filter-library
// Ensures core modules can be imported and perform simple operations.

import assert from 'node:assert/strict';
import { ComplexNum, FFT, Window, Filter } from '../../lib/index.js';

// Verify complex number addition works as expected.
const a = ComplexNum.of(3, 4);
const b = ComplexNum.of(1, -2);
const sum = ComplexNum.add(a, b);
assert.deepEqual(sum, ComplexNum.of(4, 2));

// Verify FFT length remains consistent for zero-padded inputs.
const signal = [1, 0, -1, 0];
const fftResult = FFT.rfft(signal);
assert.equal(fftResult.length, signal.length);

// Verify a Hann window produces symmetric coefficients within tolerance.
const hannWindow = Window.hann(4);
const eps = 1e-9;
assert.ok(Math.abs(hannWindow[0] - hannWindow[3]) < eps);
assert.ok(Math.abs(hannWindow[1] - hannWindow[2]) < eps);

// Verify a designed low-pass filter can process a simple signal.
const lowpassFilter = Filter.designButter('lowpass', 1000, 44100, 4);
const testSignal = Array.from({ length: 8 }, (_, i) => Math.sin(2 * Math.PI * 100 * i / 44100));
const filteredSignal = lowpassFilter.applySignal(testSignal);
assert.equal(filteredSignal.length, testSignal.length);

console.log('All example tests passed.');

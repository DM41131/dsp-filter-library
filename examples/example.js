// example.js — Demonstration of the modular DSP library
// License: MIT

import { ComplexNum, FFT, Filter, Window } from './index.js';

// Example 1: Complex number operations
console.log('=== Complex Number Operations ===');
const a = ComplexNum.of(3, 4);
const b = ComplexNum.of(1, 2);
const sum = ComplexNum.add(a, b);
console.log('Complex addition:', sum);

// Example 2: FFT operations
console.log('\n=== FFT Operations ===');
const signal = [1, 2, 3, 4, 5, 6, 7, 8];
const fftResult = FFT.rfft(signal);
console.log('FFT result length:', fftResult.length);

// Example 3: Window functions
console.log('\n=== Window Functions ===');
const hannWindow = Window.hann(8);
console.log('Hann window:', hannWindow);

// Example 4: Filter design and application
console.log('\n=== Filter Design ===');
const lowpassFilter = Filter.designButter('lowpass', 1000, 44100, 4);
console.log('Filter coefficients b:', lowpassFilter.b.slice(0, 5), '...');
console.log('Filter coefficients a:', lowpassFilter.a.slice(0, 5), '...');

// Example 5: Filter application
const testSignal = Array.from({length: 100}, (_, i) => Math.sin(2 * Math.PI * 100 * i / 44100));
const filteredSignal = lowpassFilter.applySignal(testSignal);
console.log('Original signal length:', testSignal.length);
console.log('Filtered signal length:', filteredSignal.length);

console.log('\n=== Modular Structure Working Successfully! ===');

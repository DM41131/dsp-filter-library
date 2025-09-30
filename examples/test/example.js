// test/example.js — Test file for the DSP library
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum, FFT, Filter, Window } from '../../src/index.js';

console.log('🧪 Testing DSP Filter Library...\n');

// Test 1: Complex number operations
console.log('=== Complex Number Operations ===');
const a = ComplexNum.of(3, 4);
const b = ComplexNum.of(1, 2);
const sum = ComplexNum.add(a, b);
const magnitude = ComplexNum.abs(a);
console.log('✅ Complex addition:', sum);
console.log('✅ Complex magnitude:', magnitude);

// Test 2: FFT operations
console.log('\n=== FFT Operations ===');
const signal = [1, 2, 3, 4, 5, 6, 7, 8];
const fftResult = FFT.rfft(signal);
console.log('✅ FFT result length:', fftResult.length);

// Test 3: Window functions
console.log('\n=== Window Functions ===');
const hannWindow = Window.hann(8);
console.log('✅ Hann window:', hannWindow.slice(0, 3), '...');

// Test 4: Filter design
console.log('\n=== Filter Design ===');
try {
  const lowpassFilter = Filter.designButter('lowpass', 1000, 44100, 4);
  console.log('✅ Filter coefficients b:', lowpassFilter.b.slice(0, 3), '...');
  console.log('✅ Filter coefficients a:', lowpassFilter.a.slice(0, 3), '...');
} catch (error) {
  console.log('❌ Filter design failed:', error.message);
}

// Test 5: Filter application
console.log('\n=== Filter Application ===');
try {
  const lowpassFilter = Filter.designButter('lowpass', 1000, 44100, 4);
  const testSignal = Array.from({length: 100}, (_, i) => Math.sin(2 * Math.PI * 100 * i / 44100));
  const filteredSignal = lowpassFilter.applySignal(testSignal);
  console.log('✅ Original signal length:', testSignal.length);
  console.log('✅ Filtered signal length:', filteredSignal.length);
} catch (error) {
  console.log('❌ Filter application failed:', error.message);
}

console.log('\n🎉 All tests completed!');

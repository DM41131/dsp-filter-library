# Documentation

This folder contains detailed documentation for the DSP Filter Library.

## Files

- `README.md` - Main documentation (moved from root)
- `PUBLISHING.md` - Publishing guide for npm
- `PACKAGE_SUMMARY.md` - Package structure summary

## API Reference

### Core Classes

- **ComplexNum** - Complex number operations
- **Util** - Mathematical utilities
- **FFT** - Fast Fourier Transform
- **Window** - Windowing functions
- **Filter** - Main filter class

### Filter Design

- **FIRDesigner** - FIR filter design
- **IIRDesigner** - IIR filter design
- **Bilinear** - Bilinear transformation

### Analysis

- **ZDomain** - Z-domain operations
- **Kernels** - FIR filter kernels

## Usage Patterns

### Basic Filter Design

```javascript
import { Filter } from 'dsp-filter-library';

// Butterworth filter
const butterworth = Filter.designButter('lowpass', 1000, 44100, 4);

// Chebyshev filter
const chebyshev = Filter.designCheby1('lowpass', 1000, 44100, 4, 1);

// FIR filter
const fir = Filter.designFIR('lowpass', 1000, 44100, 64, 'hamming');
```

### Signal Processing

```javascript
import { FFT, Window } from 'dsp-filter-library';

// Apply window
const windowed = signal.map((x, i) => x * Window.hann(signal.length)[i]);

// FFT analysis
const fftResult = FFT.rfft(windowed);
const powerSpectrum = FFT.powerSpectrum(windowed);
```

### Complex Numbers

```javascript
import { ComplexNum } from 'dsp-filter-library';

const a = ComplexNum.of(3, 4);
const b = ComplexNum.of(1, 2);
const sum = ComplexNum.add(a, b);
const magnitude = ComplexNum.abs(a);
```
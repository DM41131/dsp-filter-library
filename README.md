# DSP Filter Library

A comprehensive JavaScript library for digital signal processing filter design and analysis, supporting both IIR and FIR filters with interactive visualization.

## Features

### Filter Types
- **IIR Filters**: Butterworth, Chebyshev I, Chebyshev II, Elliptic, Linkwitz-Riley, Bessel
- **FIR Filters**: Windowed-sinc design with multiple window functions

### Filter Kinds
- Lowpass
- Highpass  
- Bandpass
- Bandstop

### Interactive Visualization
- **Frequency Response**: Magnitude and phase plots
- **Time Domain**: Impulse response, group delay, and phase delay
- **Poles & Zeros**: Z-plane visualization with unit circle
- **Coefficients**: Second-order sections (IIR) or tap coefficients (FIR)

### Window Functions (FIR)
- Rectangular
- Hann
- Hamming
- Blackman
- Kaiser (with adjustable β parameter)

## Installation

```bash
npm install dsp-filter-library
```

## Usage

### Basic IIR Filter Design

```javascript
import { FilterDSP } from 'dsp-filter-library';

// Design a 6th order Butterworth lowpass filter
const spec = {
  family: 'butter',
  kind: 'lowpass',
  N: 6,
  Fs: 48000,
  f1: 4000
};

const filter = FilterDSP.designIIR(spec);

// Get frequency response
const response = filter.frequencyGrid(1024);
console.log(response.magdB);    // Magnitude in dB
console.log(response.phaseDeg); // Phase in degrees
console.log(response.freqHz);   // Frequency points in Hz

// Get impulse response
const impResp = filter.impulseResponse(256);

// Get filter coefficients
console.log(filter.sections); // Second-order sections
```

### Basic FIR Filter Design

```javascript
// Design a 101-tap Hamming window lowpass filter
const spec = {
  kind: 'lowpass',
  taps: 101,
  Fs: 48000,
  f1: 4000,
  window: 'hamming'
};

const filter = FilterDSP.designFIR(spec);

// Get filter taps
console.log(filter.taps);

// Get zeros
console.log(filter.zeros());
```

### Advanced Filter Design

```javascript
// Elliptic bandpass filter with custom ripple
const spec = {
  family: 'ellip',
  kind: 'bandpass',
  N: 8,
  Rp: 1.0,    // Passband ripple (dB)
  Rs: 60,     // Stopband ripple (dB)
  Fs: 48000,
  f1: 2000,   // Lower cutoff
  f2: 8000    // Upper cutoff
};

const filter = FilterDSP.designIIR(spec);
```

## Interactive Demo

Open `example/index.html` in your browser to see the interactive filter design tool with real-time visualization.

### Demo Features
- Real-time parameter adjustment with sliders
- Tabbed interface for different analysis views
- Properly centered poles and zeros visualization
- Fixed y-axis ranges for consistent comparison
- Responsive design with dark theme

## API Reference

### FilterDSP.designIIR(spec)

Designs an IIR filter based on the specification object.

**Parameters:**
- `spec.family`: Filter family ('butter', 'cheby1', 'cheby2', 'ellip', 'linkwitz', 'bessel')
- `spec.kind`: Filter type ('lowpass', 'highpass', 'bandpass', 'bandstop')
- `spec.N`: Filter order
- `spec.Rp`: Passband ripple in dB (for Chebyshev I and Elliptic)
- `spec.Rs`: Stopband ripple in dB (for Chebyshev II and Elliptic)
- `spec.Fs`: Sampling frequency in Hz
- `spec.f1`: First cutoff frequency in Hz
- `spec.f2`: Second cutoff frequency in Hz (for bandpass/bandstop)

### FilterDSP.designFIR(spec)

Designs an FIR filter using windowed-sinc method.

**Parameters:**
- `spec.kind`: Filter type ('lowpass', 'highpass', 'bandpass', 'bandstop')
- `spec.taps`: Number of filter taps (must be odd)
- `spec.Fs`: Sampling frequency in Hz
- `spec.f1`: First cutoff frequency in Hz
- `spec.f2`: Second cutoff frequency in Hz (for bandpass/bandstop)
- `spec.window`: Window function ('rect', 'hann', 'hamming', 'blackman', 'kaiser')
- `spec.beta`: Kaiser window β parameter (for Kaiser window only)

### Filter Methods

#### frequencyGrid(nPoints)
Returns frequency response data.
- `nPoints`: Number of frequency points to compute

**Returns:**
- `magdB`: Magnitude response in dB
- `phaseDeg`: Phase response in degrees (unwrapped)
- `freqHz`: Frequency points in Hz
- `gdSamples`: Group delay in samples
- `pdSamples`: Phase delay in samples

#### impulseResponse(nSamples)
Returns impulse response data.
- `nSamples`: Number of samples to compute

#### sections (IIR only)
Array of second-order sections with coefficients `a` and `b`.

#### taps (FIR only)
Array of filter tap coefficients.

#### zeros()
Returns array of filter zeros as complex numbers.

#### zPoles (IIR only)
Array of filter poles as complex numbers.

#### zZeros (IIR only)
Array of filter zeros as complex numbers.

## Building

```bash
npm install
npm run build
```

This will generate the library files in the `lib/` directory:
- `dsp-filter-library.js` - UMD build
- `dsp-filter-library.min.js` - Minified UMD build
- `dsp-filter-library.esm.min.js` - ES module build

## Examples

### Real-time Audio Processing

```javascript
// Design a lowpass filter for audio
const filter = FilterDSP.designIIR({
  family: 'butter',
  kind: 'lowpass',
  N: 4,
  Fs: 44100,
  f1: 8000
});

// Process audio samples
const audioSamples = [/* your audio data */];
const filteredSamples = filter.process(audioSamples);
```

### Filter Analysis

```javascript
// Analyze filter characteristics
const response = filter.frequencyGrid(2048);

// Find -3dB cutoff frequency
const cutoffIndex = response.magdB.findIndex(mag => mag <= -3);
const cutoffFreq = response.freqHz[cutoffIndex];

// Check stability (poles inside unit circle)
const isStable = filter.zPoles.every(pole => 
  Math.sqrt(pole.re * pole.re + pole.im * pole.im) < 1
);
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### Latest Version
- Fixed poles and zeros visualization centering
- Improved group delay plot with fixed y-axis range
- Enhanced interactive demo interface
- Added comprehensive documentation

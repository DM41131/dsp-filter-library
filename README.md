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

### Window Functions (FIR) - 23 Total
- **Basic Windows**: Rectangular, Hann, Hamming, Blackman
- **Advanced Blackman Variants**: Blackman-Harris, Blackman-Nuttall, Nuttall, Exact Blackman
- **Tapered Windows**: Bartlett, Bartlett-Hann, Welch, Triangular, Tukey (with adjustable α)
- **Specialized Windows**: Gaussian (with adjustable σ), Poisson (with adjustable α), Parzen, Bohman, Lanczos, Cosine
- **Advanced Windows**: Flat-top, Dolph-Chebyshev, Taylor, Kaiser (with adjustable β)

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

### Advanced Window Functions

```javascript
// Kaiser window with custom β parameter
const kaiserFilter = FilterDSP.designFIR({
  kind: 'lowpass',
  taps: 101,
  Fs: 48000,
  f1: 4000,
  window: 'kaiser',
  beta: 8.6  // Adjustable sidelobe level
});

// Tukey window with custom α parameter
const tukeyFilter = FilterDSP.designFIR({
  kind: 'bandpass',
  taps: 201,
  Fs: 48000,
  f1: 2000,
  f2: 8000,
  window: 'tukey',
  alpha: 0.5  // Taper ratio (0=rectangular, 1=hann)
});

// Gaussian window with custom σ parameter
const gaussianFilter = FilterDSP.designFIR({
  kind: 'highpass',
  taps: 151,
  Fs: 48000,
  f1: 6000,
  window: 'gauss',
  sigma: 0.4  // Width parameter
});

// Flat-top window for accurate measurements
const flatTopFilter = FilterDSP.designFIR({
  kind: 'lowpass',
  taps: 301,
  Fs: 48000,
  f1: 4000,
  window: 'flatTop'  // Optimized for amplitude accuracy
});
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
- **Real-time parameter adjustment** with sliders and dropdowns
- **Tabbed interface** for different analysis views (Frequency, Time Domain, Poles & Zeros, Coefficients)
- **Properly centered poles and zeros visualization** with unit circle
- **Fixed y-axis ranges** for consistent comparison (Group Delay: -50 to +50 samples)
- **23 window functions** with dynamic parameter controls
- **Complete coefficient display** (all FIR taps, all IIR sections)
- **Responsive design** with modern dark theme
- **Real-time filter redesign** on parameter changes

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
- `spec.window`: Window function (see supported windows below)
- `spec.beta`: Kaiser window β parameter (default: 8.6)
- `spec.alpha`: Tukey window α parameter (default: 0.5)
- `spec.sigma`: Gaussian window σ parameter (default: 0.4)
- `spec.poissonAlpha`: Poisson window α parameter (default: 2.0)

**Supported Window Functions:**
- `'rect'`, `'hann'`, `'hamming'`, `'blackman'`
- `'blackmanHarris'`, `'blackmanNuttall'`, `'nuttall'`, `'exactBlackman'`
- `'bartlett'`, `'bartlettHann'`, `'welch'`, `'triangular'`
- `'gauss'`, `'tukey'`, `'poisson'`, `'parzen'`, `'bohman'`
- `'lanczos'`, `'cosine'`, `'flatTop'`, `'dolphChebyshev'`, `'taylor'`, `'kaiser'`

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

## Advanced Window Functions

The library includes 23 different window functions for FIR filter design, each with specific characteristics:

### **Basic Windows**
- **Rectangular**: Sharpest transition, highest sidelobes
- **Hann**: Good balance of main lobe width and sidelobe level
- **Hamming**: Optimized for reduced first sidelobe
- **Blackman**: Lower sidelobes, wider main lobe

### **Advanced Blackman Variants**
- **Blackman-Harris**: 4-term window with very low sidelobes
- **Blackman-Nuttall**: Alternative 4-term window
- **Nuttall**: Another 4-term variant
- **Exact Blackman**: 3-term with exact coefficients

### **Tapered Windows**
- **Bartlett**: Triangular window
- **Bartlett-Hann**: Hybrid triangular-cosine window
- **Welch**: Parabolic window
- **Tukey**: Raised cosine with adjustable taper (α parameter)

### **Specialized Windows**
- **Gaussian**: Adjustable width (σ parameter)
- **Poisson**: Exponential decay (α parameter)
- **Parzen**: Smooth polynomial window
- **Bohman**: Smooth window with good sidelobe suppression
- **Lanczos**: Sinc-based window
- **Cosine**: Simple cosine window

### **Advanced Windows**
- **Flat-top**: Optimized for accurate amplitude measurements
- **Dolph-Chebyshev**: Controlled sidelobe level
- **Taylor**: Antenna design window
- **Kaiser**: Adjustable sidelobe level (β parameter)

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
- **Expanded Window Functions**: Added 23 different window functions (from 5 to 23)
- **Advanced Window Parameters**: Added adjustable parameters for Kaiser (β), Tukey (α), Gaussian (σ), and Poisson (α)
- **Enhanced UI**: Dynamic parameter controls that show/hide based on selected window
- **Complete Coefficient Display**: Show all FIR taps and IIR sections without truncation
- **Fixed Poles and Zeros Visualization**: Properly centered poles and zeros with unit circle
- **Improved Group Delay Plot**: Fixed y-axis range (-50 to +50 samples) for consistent comparison
- **Enhanced Interactive Demo**: Real-time parameter adjustment with comprehensive window selection
- **Comprehensive Documentation**: Updated README with all new features and window function details

### Previous Versions
- Fixed poles and zeros visualization centering
- Improved group delay plot with fixed y-axis range
- Enhanced interactive demo interface
- Added comprehensive documentation

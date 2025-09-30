# DSP Filter Library

A comprehensive, modular digital signal processing library for JavaScript/TypeScript with FIR/IIR filter design, FFT operations, windowing functions, and complex number utilities.

[![npm version](https://badge.fury.io/js/dsp-filter-library.svg)](https://badge.fury.io/js/dsp-filter-library)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

### npm/yarn/pnpm
```bash
npm install dsp-filter-library
```

```bash
yarn add dsp-filter-library
```

```bash
pnpm add dsp-filter-library
```

### Browser (CDN)
```html
<!-- UMD version -->
<script src="https://unpkg.com/dsp-filter-library/lib/dsp-filter-library.min.js"></script>

<!-- ES Module version -->
<script type="module">
    import { Filter, FFT } from 'https://unpkg.com/dsp-filter-library/lib/dsp-filter-library.esm.min.js';
</script>
```

## Quick Start

### ES6 Modules

```javascript
import { Filter, FFT, ComplexNum } from 'dsp-filter-library';

// Design a Butterworth lowpass filter
const filter = Filter.designButter('lowpass', 1000, 44100, 4);

// Apply filter to signal
const filteredSignal = filter.applySignal(inputSignal);

// FFT operations
const fftResult = FFT.rfft(signal);
```

### CommonJS

```javascript
const { Filter, FFT, ComplexNum } = require('dsp-filter-library');

// Same API as ES6 modules
const filter = Filter.designButter('lowpass', 1000, 44100, 4);
```

### TypeScript

```typescript
import { Filter, FiltKind, Complex } from 'dsp-filter-library';

const filter: Filter = Filter.designButter('lowpass', 1000, 44100, 4);
const result: number[] = filter.applySignal(inputSignal);
```

### Browser (UMD)

```html
<script src="https://unpkg.com/dsp-filter-library/lib/dsp-filter-library.min.js"></script>
<script>
    const { Filter, FFT, ComplexNum } = DSPFilterLibrary;
    
    // Design a Butterworth lowpass filter
    const filter = Filter.designButter('lowpass', 1000, 44100, 4);
    
    // Apply filter to signal
    const filteredSignal = filter.applySignal(inputSignal);
</script>
```

## Features

- **FIR Filter Design** - Windowed sinc filters with multiple window types
- **IIR Filter Design** - Butterworth and Chebyshev Type I filters
- **FFT Operations** - Fast Fourier Transform with power spectrum analysis
- **Window Functions** - 15+ windowing functions (Hann, Hamming, Blackman, Kaiser, etc.)
- **Complex Numbers** - Full complex arithmetic operations
- **Z-Domain Analysis** - Frequency response and group delay calculations
- **Modular Architecture** - Import only what you need
- **TypeScript Support** - Full type definitions included
- **Zero Dependencies** - Pure JavaScript implementation

## Examples

### Filter Design

```javascript
import { Filter } from 'dsp-filter-library';

// Butterworth lowpass filter
const butterworth = Filter.designButter('lowpass', 1000, 44100, 4);

// Chebyshev Type I filter
const chebyshev = Filter.designCheby1('lowpass', 1000, 44100, 4, 1);

// FIR filter with custom window
const fir = Filter.designFIR('lowpass', 1000, 44100, 64, 'hamming');
```

### Signal Processing

```javascript
import { FFT, Window } from 'dsp-filter-library';

// Apply window to signal
const windowed = signal.map((x, i) => x * Window.hann(signal.length)[i]);

// FFT analysis
const fftResult = FFT.rfft(windowed);
const powerSpectrum = FFT.powerSpectrum(windowed);
```

### Complex Number Operations

```javascript
import { ComplexNum } from 'dsp-filter-library';

const a = ComplexNum.of(3, 4);  // 3 + 4i
const b = ComplexNum.of(1, 2);  // 1 + 2i
const sum = ComplexNum.add(a, b);  // 4 + 6i
const magnitude = ComplexNum.abs(a);  // 5
```

## Project Structure

```
dsp-filter-library/
├── src/                    # Source code
│   ├── complex.js         # Complex number operations
│   ├── utils.js           # Utility functions
│   ├── fft.js             # FFT operations
│   ├── windows.js         # Window functions
│   ├── fir.js             # FIR filter design
│   ├── iir.js             # IIR filter design
│   ├── zdomain.js         # Z-domain operations
│   ├── filter-class.js    # Main Filter class
│   ├── index.js           # Main entry point
│   └── types.d.ts         # TypeScript definitions
├── lib/                   # Compiled output
├── examples/              # Usage examples
├── docs/                  # Documentation
├── scripts/               # Build scripts
└── package.json
```

## Documentation

- [API Reference](docs/README.md)
- [Publishing Guide](docs/PUBLISHING.md)
- [Package Summary](docs/PACKAGE_SUMMARY.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
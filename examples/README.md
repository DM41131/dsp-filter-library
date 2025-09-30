# Examples

This folder contains usage examples for the DSP Filter Library.

## Files

- `test/example.js` - Basic functionality test
- `example.js` - Simple usage examples

## Running Examples

```bash
# Run the test suite
npm test

# Run a specific example
node examples/example.js
```

## Example Usage

```javascript
import { Filter, FFT, ComplexNum } from 'dsp-filter-library';

// Design a filter
const filter = Filter.designButter('lowpass', 1000, 44100, 4);

// Apply to signal
const filtered = filter.applySignal(inputSignal);

// FFT analysis
const fftResult = FFT.rfft(signal);
```

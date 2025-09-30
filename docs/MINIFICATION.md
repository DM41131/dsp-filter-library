# Minification Guide

This guide explains how to use the minified versions of the DSP Filter Library.

## Available Builds

The library provides several build formats:

### 1. Modular Builds (Default)
- **ES Modules**: `lib/index.js` and individual modules
- **CommonJS**: `lib/index.cjs` and individual modules
- **TypeScript**: `lib/index.d.ts` and individual types

### 2. Minified Builds (Single File)
- **UMD**: `lib/dsp-filter-library.min.js` - Universal module format
- **ES Module**: `lib/dsp-filter-library.esm.min.js` - ES module format

## Usage

### Browser (UMD)
```html
<script src="https://unpkg.com/dsp-filter-library/lib/dsp-filter-library.min.js"></script>
<script>
    const { Filter, FFT, ComplexNum } = DSPFilterLibrary;
    
    // Use the library
    const filter = Filter.designButter('lowpass', 1000, 44100, 4);
</script>
```

### ES Modules (Minified)
```html
<script type="module">
    import { Filter, FFT, ComplexNum } from './lib/dsp-filter-library.esm.min.js';
    
    // Use the library
    const filter = Filter.designButter('lowpass', 1000, 44100, 4);
</script>
```

### Node.js (CommonJS)
```javascript
const { Filter, FFT, ComplexNum } = require('dsp-filter-library');
```

### Node.js (ES Modules)
```javascript
import { Filter, FFT, ComplexNum } from 'dsp-filter-library';
```

## Build Commands

### Standard Build
```bash
npm run build
```
Creates modular ES modules, CommonJS, and TypeScript definitions.

### Minified Build
```bash
npm run build:min
```
Creates minified UMD and ES module versions.

### Complete Build
```bash
npm run build:all
```
Creates both standard and minified builds.

## File Sizes

| Build Type | File Size | Description |
|------------|-----------|-------------|
| Modular ES | ~50KB | Individual modules, tree-shakeable |
| Modular CJS | ~50KB | Individual modules, Node.js compatible |
| Minified UMD | ~25KB | Single file, browser compatible |
| Minified ES | ~25KB | Single file, ES module format |

## CDN Usage

### unpkg
```html
<script src="https://unpkg.com/dsp-filter-library/lib/dsp-filter-library.min.js"></script>
```

### jsDelivr
```html
<script src="https://cdn.jsdelivr.net/npm/dsp-filter-library/lib/dsp-filter-library.min.js"></script>
```

### ES Modules CDN
```html
<script type="module">
    import { Filter } from 'https://unpkg.com/dsp-filter-library/lib/dsp-filter-library.esm.min.js';
</script>
```

## Browser Compatibility

The minified UMD build supports:
- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Node.js**: 14.0.0+
- **Bundlers**: Webpack, Rollup, Vite, Parcel

## Tree Shaking

For optimal bundle size, use the modular builds:

```javascript
// Import only what you need
import { Filter } from 'dsp-filter-library';
import { FFT } from 'dsp-filter-library/fft';
import { ComplexNum } from 'dsp-filter-library/complex';
```

## Source Maps

All builds include source maps for debugging:
- `*.js.map` - Source maps for ES modules
- `*.cjs.map` - Source maps for CommonJS
- `*.min.js.map` - Source maps for minified builds

## Performance

### Minified Build Benefits
- **Smaller file size** - ~50% reduction
- **Faster loading** - Single HTTP request
- **Better caching** - One file to cache
- **CDN friendly** - Easy to distribute

### Modular Build Benefits
- **Tree shaking** - Only include what you use
- **Better debugging** - Individual source files
- **Selective imports** - Import specific modules
- **Development friendly** - Easier to debug

## Examples

### Basic Usage (Browser)
```html
<!DOCTYPE html>
<html>
<head>
    <title>DSP Filter Library Example</title>
</head>
<body>
    <script src="lib/dsp-filter-library.min.js"></script>
    <script>
        const { Filter, FFT } = DSPFilterLibrary;
        
        // Design a filter
        const filter = Filter.designButter('lowpass', 1000, 44100, 4);
        
        // Apply to signal
        const signal = [1, 2, 3, 4, 5];
        const filtered = filter.applySignal(signal);
        
        console.log('Filtered signal:', filtered);
    </script>
</body>
</html>
```

### Advanced Usage (ES Modules)
```html
<!DOCTYPE html>
<html>
<head>
    <title>DSP Filter Library - ES Modules</title>
</head>
<body>
    <script type="module">
        import { Filter, FFT, ComplexNum } from './lib/dsp-filter-library.esm.min.js';
        
        // Complex number operations
        const a = ComplexNum.of(3, 4);
        const b = ComplexNum.of(1, 2);
        const sum = ComplexNum.add(a, b);
        
        // FFT analysis
        const signal = [1, 2, 3, 4, 5, 6, 7, 8];
        const fftResult = FFT.rfft(signal);
        
        console.log('Complex sum:', sum);
        console.log('FFT result:', fftResult);
    </script>
</body>
</html>
```

## Troubleshooting

### Common Issues

1. **Module not found**: Ensure you're using the correct import path
2. **Global not defined**: Make sure the UMD script is loaded before use
3. **Type errors**: Install TypeScript definitions for better IDE support

### Debug Mode

For development, use the non-minified builds:
```javascript
// Development
import { Filter } from 'dsp-filter-library';

// Production
import { Filter } from 'dsp-filter-library/lib/dsp-filter-library.esm.min.js';
```

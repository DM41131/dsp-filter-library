# Utils Refactoring - Moving Common Functions to utils.js

## Overview

This refactoring consolidates commonly used functions that were duplicated across multiple filter classes into the centralized `utils.js` file. This improves code maintainability, reduces duplication, and ensures consistency across the codebase.

## Functions Moved to utils.js

### 1. **`prewarp(fHz, fs)`**
- **Purpose**: Prewarp digital edge frequency to analog frequency for bilinear transform
- **Parameters**: 
  - `fHz`: Digital frequency in Hz
  - `fs`: Sampling frequency in Hz
- **Returns**: Analog frequency in rad/s
- **Formula**: `2 * fs * Math.tan(Math.PI * fHz / fs)`

### 2. **`pairConjugates(list)`**
- **Purpose**: Pairs conjugate poles for Second-Order Sections (SOS) construction
- **Parameters**: `list` - Array of complex numbers
- **Returns**: Array of pole pairs
- **Used by**: All IIR filter classes for SOS construction

### 3. **`bilinearMapBiquad(b2, b1, b0, a2, a1, a0, fs)`**
- **Purpose**: Maps analog biquad to digital biquad via bilinear transform
- **Parameters**: 
  - `b2, b1, b0`: Numerator coefficients (s², s, constant)
  - `a2, a1, a0`: Denominator coefficients (s², s, constant)
  - `fs`: Sampling frequency
- **Returns**: Digital biquad coefficients `{b: [B0, B1, B2], a: [1, A1, A2]}`
- **Used by**: All IIR filter classes for analog-to-digital conversion

### 4. **`evalHzAtZ(b, a, z0)`**
- **Purpose**: Evaluates transfer function H(z) at a real z0
- **Parameters**: 
  - `b`: Numerator coefficients
  - `a`: Denominator coefficients
  - `z0`: Real z value
- **Returns**: Transfer function value
- **Used by**: Filter analysis and validation

## Files Updated

### **`src/utils.js`** - Added Functions
```javascript
// New functions added to Util class
static prewarp(fHz, fs) { ... }
static pairConjugates(list) { ... }
static bilinearMapBiquad(b2, b1, b0, a2, a1, a0, fs) { ... }
static evalHzAtZ(b, a, z0) { ... }
```

### **`src/base-iir-filter.js`** - Updated to Use Utils
```javascript
// Before: Full implementation
static pairConjugates(list) {
  // 20+ lines of implementation
}

// After: Delegates to utils
static pairConjugates(list) {
  return Util.pairConjugates(list);
}
```

### **`src/iir.js`** - Updated to Use Utils
```javascript
// Before: Full implementation
static prewarp(fHz, fs) {
  return 2 * fs * Math.tan(Math.PI * fHz / fs);
}

// After: Delegates to utils
static prewarp(fHz, fs) {
  return Util.prewarp(fHz, fs);
}
```

### **`src/butterworth-filter.js`** - Updated to Use Utils
```javascript
// Before: Using Bilinear.prewarp
const wc = Bilinear.prewarp(fc, fs);

// After: Using Util.prewarp
const wc = Util.prewarp(fc, fs);
```

### **`src/chebyshev-filter.js`** - Updated to Use Utils
```javascript
// Before: Using Bilinear.prewarp
const wc = Bilinear.prewarp(fc, fs);

// After: Using Util.prewarp
const wc = Util.prewarp(fc, fs);
```

## Benefits of This Refactoring

### 1. **Eliminated Code Duplication**
- **Before**: Same functions implemented in multiple files
- **After**: Single implementation in `utils.js`
- **Result**: Reduced codebase size and maintenance burden

### 2. **Improved Consistency**
- **Before**: Potential for different implementations to diverge
- **After**: Single source of truth for common functions
- **Result**: Guaranteed consistent behavior across all filter types

### 3. **Better Maintainability**
- **Before**: Bug fixes required changes in multiple files
- **After**: Bug fixes only need to be made in one place
- **Result**: Easier maintenance and fewer bugs

### 4. **Enhanced Reusability**
- **Before**: Functions tied to specific classes
- **After**: Functions available to any module that imports `utils.js`
- **Result**: Easier to add new filter types or features

### 5. **Cleaner Code Organization**
- **Before**: Mixed concerns within filter classes
- **After**: Clear separation between filter-specific and utility functions
- **Result**: More readable and organized codebase

## Function Usage Patterns

### **Prewarp Function**
Used by all IIR filter classes for frequency transformation:
```javascript
// Butterworth, Chebyshev, Linkwitz-Riley filters
const wc = Util.prewarp(fc, fs);
```

### **Pair Conjugates Function**
Used by all IIR filter classes for SOS construction:
```javascript
// All IIR filter classes
const pairs = Util.pairConjugates(poles);
```

### **Bilinear Map Biquad Function**
Used by all IIR filter classes for analog-to-digital conversion:
```javascript
// All IIR filter classes
const biquad = Util.bilinearMapBiquad(b2, b1, b0, a2, a1, a0, fs);
```

### **Eval Hz At Z Function**
Used for filter analysis and validation:
```javascript
// Filter analysis and testing
const response = Util.evalHzAtZ(b, a, z0);
```

## Backward Compatibility

**Fully maintained!** All existing code continues to work:

```javascript
// These still work exactly as before
const filter1 = IIRDesigner.butterworth('lowpass', 100, 1000, 4);
const filter2 = ButterworthFilter.design('lowpass', 100, 1000, 4);
const filter3 = ChebyshevFilter.design('lowpass', 100, 1000, 4, 1);
```

## Testing

All functions have been tested to ensure:
- **Mathematical correctness**: Results identical to original implementations
- **Performance**: No performance degradation
- **Compatibility**: All existing code continues to work
- **Error handling**: Proper error propagation maintained

## Future Benefits

This refactoring makes it easier to:

1. **Add new filter types**: Common functions are readily available
2. **Implement new features**: Utility functions can be extended
3. **Optimize performance**: Single place to optimize common operations
4. **Add unit tests**: Centralized testing of utility functions
5. **Document functions**: Single location for comprehensive documentation

## Code Quality Improvements

### **Before Refactoring**
- 4 duplicate implementations of `prewarp`
- 2 duplicate implementations of `pairConjugates`
- 2 duplicate implementations of `bilinearMapBiquad`
- 2 duplicate implementations of `_evalHzAtZ`
- **Total**: ~100 lines of duplicated code

### **After Refactoring**
- 1 implementation of each function in `utils.js`
- All filter classes delegate to utils
- **Total**: ~50 lines of utility functions + delegation calls
- **Net reduction**: ~50 lines of duplicated code eliminated

## Conclusion

This refactoring successfully consolidates common functions into a centralized utility module while maintaining full backward compatibility. The result is a cleaner, more maintainable codebase with reduced duplication and improved consistency across all filter implementations.

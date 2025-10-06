# Chebyshev Type 2 Filter Refactoring

## Overview

The Chebyshev Type 2 (inverse Chebyshev) filter generation code has been refactored following the same pattern as the Butterworth and Chebyshev Type 1 filter refactorings. This provides a clean, focused interface for Chebyshev Type 2 filter design while maintaining backward compatibility.

## Changes Made

### 1. Created `ChebyshevType2Filter` Class (`src/chebyshev-type2-filter.js`)

A dedicated class specifically for Chebyshev Type 2 filter design:

- **Extends BaseIIRFilter**: Inherits common functionality from the base class
- **Chebyshev Type 2-specific pole and zero calculation**: `calculatePolesAndZeros()` method with stopband attenuation parameter
- **Stopband attenuation parameter validation**: Comprehensive validation for stopband attenuation values
- **Specialized design methods**: Separate methods for lowpass, highpass, and bandpass/bandstop
- **Additional utility methods**: 
  - `calculateActualStopbandAttenuation()` - Calculate actual achieved stopband attenuation
  - `getRecommendedStopbandAttenuations()` - Get recommended attenuation values for different applications
  - `getNumberOfFiniteZeros()` - Calculate number of finite zero pairs for a given order
- **Enhanced error handling**: Detailed validation and error messages specific to Chebyshev Type 2 filters

### 2. Updated `IIRDesigner` Class (`src/iir.js`)

Modified the main IIR designer to use the new ChebyshevType2Filter class:

- **Simplified cheby2 method**: Now just delegates to ChebyshevType2Filter.design()
- **Maintained backward compatibility**: Existing API unchanged
- **Cleaner code**: Removed duplicate Chebyshev Type 2-specific logic

## Key Features of Chebyshev Type 2 Filter

### 1. **Stopband Attenuation Control**
- Configurable stopband attenuation in dB
- Validation to ensure practical attenuation values (10 ≤ attenuation ≤ 100 dB)
- Recommended attenuation values for different applications

### 2. **Finite Zeros**
- Chebyshev Type 2 filters have finite zeros on the imaginary axis
- Number of finite zero pairs = floor(order/2)
- Provides steeper stopband rolloff compared to all-pole filters

### 3. **Enhanced Validation**
- Stopband attenuation parameter validation
- Application-specific attenuation recommendations
- Clear error messages for invalid parameters

### 4. **Utility Methods**
- **`calculateActualStopbandAttenuation()`**: Calculate the actual stopband attenuation achieved
- **`getRecommendedStopbandAttenuations()`**: Get recommended attenuation values for different use cases
- **`getNumberOfFiniteZeros()`**: Calculate number of finite zero pairs for analysis

## Usage Examples

### Direct ChebyshevType2Filter Usage

```javascript
import { ChebyshevType2Filter } from './src/chebyshev-type2-filter.js';

// Lowpass filter with 40 dB stopband attenuation
const lpFilter = ChebyshevType2Filter.design('lowpass', 150, 1000, 4, 40);

// Highpass filter with 60 dB stopband attenuation
const hpFilter = ChebyshevType2Filter.design('highpass', 200, 1000, 4, 60);

// Bandpass filter with 30 dB stopband attenuation
const bpFilter = ChebyshevType2Filter.design('bandpass', [150, 250], 1000, 4, 30);

// Calculate actual achieved stopband attenuation
const actualAttenuation = ChebyshevType2Filter.calculateActualStopbandAttenuation(
  lpFilter.b, lpFilter.a, 1000, 150
);

// Get recommended attenuation values
const recommendations = ChebyshevType2Filter.getRecommendedStopbandAttenuations();
console.log(recommendations.audio); // 60 dB

// Get number of finite zeros
const finiteZeros = ChebyshevType2Filter.getNumberOfFiniteZeros(4); // 2
```

### Backward Compatible Usage

```javascript
import { IIRDesigner } from './src/iir.js';

// Still works exactly as before
const filter = IIRDesigner.cheby2('lowpass', 150, 1000, 4, 40);
```

## Recommended Stopband Attenuation Values

The `getRecommendedStopbandAttenuations()` method provides suggested attenuation values for different applications:

- **Audio**: 60 dB - Very high attenuation for high-quality audio
- **Communication**: 40 dB - Standard attenuation for communication systems
- **General**: 30 dB - General purpose applications
- **Moderate**: 20 dB - Moderate attenuation requirements
- **Basic**: 15 dB - Basic filtering needs

## Error Handling

The refactored ChebyshevType2Filter provides comprehensive error handling:

```javascript
try {
  // Invalid order
  ChebyshevType2Filter.design('lowpass', 150, 1000, 0, 40);
} catch (error) {
  console.log(error.message); // "Order must be >= 1"
}

try {
  // Invalid attenuation
  ChebyshevType2Filter.design('lowpass', 150, 1000, 4, -10);
} catch (error) {
  console.log(error.message); // "Stopband attenuation must be positive"
}

try {
  // Too low attenuation
  ChebyshevType2Filter.design('lowpass', 150, 1000, 4, 5);
} catch (error) {
  console.log(error.message); // "Stopband attenuation should be >= 10 dB for practical designs"
}

try {
  // Too high attenuation
  ChebyshevType2Filter.design('lowpass', 150, 1000, 4, 150);
} catch (error) {
  console.log(error.message); // "Stopband attenuation should be <= 100 dB for practical designs"
}
```

## Comparison with Other Filter Types

| Feature | Butterworth | Chebyshev Type 1 | Chebyshev Type 2 |
|---------|-------------|------------------|------------------|
| **Passband Response** | Maximally flat | Equiripple | Maximally flat |
| **Stopband Response** | Gradual rolloff | Gradual rolloff | Equiripple |
| **Finite Zeros** | No | No | Yes (floor(order/2) pairs) |
| **Parameter Control** | None | Passband ripple | Stopband attenuation |
| **Transition Band** | Wider | Narrower | Narrowest |
| **Phase Response** | Better | More nonlinear | Most nonlinear |
| **Use Cases** | General purpose | Sharp cutoff needed | Sharp stopband needed |

## Finite Zeros Analysis

Chebyshev Type 2 filters have finite zeros on the imaginary axis:

| Order | Finite Zero Pairs | Total Zeros |
|-------|------------------|-------------|
| 2     | 1                | 2           |
| 3     | 1                | 2           |
| 4     | 2                | 4           |
| 5     | 2                | 4           |
| 6     | 3                | 6           |
| 7     | 3                | 6           |
| 8     | 4                | 8           |

## File Structure

```
src/
├── base-iir-filter.js      # Abstract base class for IIR filters
├── butterworth-filter.js   # Butterworth filter implementation
├── chebyshev-filter.js     # Chebyshev Type 1 filter implementation
├── chebyshev-type2-filter.js # Chebyshev Type 2 filter implementation
├── iir.js                  # Updated main IIR designer
└── ... (other existing files)
```

## Benefits of Refactoring

### 1. **Consistent Architecture**
- Follows the same pattern as Butterworth and Chebyshev Type 1 refactorings
- Reuses BaseIIRFilter for common functionality
- Maintains consistent API design

### 2. **Enhanced Functionality**
- Stopband attenuation parameter validation and recommendations
- Actual attenuation calculation utility
- Finite zeros analysis utilities
- Better error handling and messages

### 3. **Improved Maintainability**
- Chebyshev Type 2-specific logic isolated in dedicated class
- Common functionality shared through base class
- Clear responsibility boundaries

### 4. **Backward Compatibility**
- Existing code continues to work unchanged
- No breaking changes to public API
- Gradual migration path available

## Future Extensions

The refactored architecture makes it easy to add other filter types:

```javascript
export class EllipticFilter extends BaseIIRFilter {
  static calculatePoles(order, passbandRipple, stopbandAttenuation) {
    // Elliptic filter implementation
  }
  
  static design(kind, cutoffHz, fs, order, passbandRipple, stopbandAttenuation) {
    // Elliptic filter design logic
  }
}
```

## Testing

The refactored code maintains the same mathematical behavior as the original implementation. All existing tests should continue to pass without modification.

## Migration Guide

### For New Code
- Use `ChebyshevType2Filter.design()` directly for new implementations
- Take advantage of attenuation validation and utility methods
- Use recommended attenuation values for different applications

### For Existing Code
- No changes required - existing code continues to work
- Consider migrating to direct `ChebyshevType2Filter` usage for better error handling
- Use utility methods for attenuation analysis and recommendations

## Conclusion

This refactoring provides a clean, maintainable implementation of Chebyshev Type 2 filters while maintaining full backward compatibility. The new architecture is consistent with the Butterworth and Chebyshev Type 1 filter refactorings and provides enhanced functionality for stopband attenuation control and finite zeros analysis.

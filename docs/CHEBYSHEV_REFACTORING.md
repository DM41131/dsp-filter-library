# Chebyshev Type 1 Filter Refactoring

## Overview

The Chebyshev Type 1 filter generation code has been refactored following the same pattern as the Butterworth filter refactoring. This provides a clean, focused interface for Chebyshev Type 1 filter design while maintaining backward compatibility.

## Changes Made

### 1. Created `ChebyshevFilter` Class (`src/chebyshev-filter.js`)

A dedicated class specifically for Chebyshev Type 1 filter design:

- **Extends BaseIIRFilter**: Inherits common functionality from the base class
- **Chebyshev-specific pole calculation**: `calculatePoles()` method with ripple parameter
- **Ripple parameter validation**: Comprehensive validation for passband ripple values
- **Specialized design methods**: Separate methods for lowpass/highpass vs bandpass/bandstop
- **Additional utility methods**: 
  - `calculateActualRipple()` - Calculate actual achieved ripple
  - `getRecommendedRipples()` - Get recommended ripple values for different applications
- **Enhanced error handling**: Detailed validation and error messages specific to Chebyshev filters

### 2. Updated `IIRDesigner` Class (`src/iir.js`)

Modified the main IIR designer to use the new ChebyshevFilter class:

- **Simplified cheby1 method**: Now just delegates to ChebyshevFilter.design()
- **Maintained backward compatibility**: Existing API unchanged
- **Cleaner code**: Removed duplicate Chebyshev-specific logic

## Key Features of Chebyshev Type 1 Filter

### 1. **Passband Ripple Control**
- Configurable passband ripple in dB
- Validation to ensure practical ripple values (0 < ripple ≤ 10 dB)
- Recommended ripple values for different applications

### 2. **Enhanced Validation**
- Ripple parameter validation
- Application-specific ripple recommendations
- Clear error messages for invalid parameters

### 3. **Utility Methods**
- **`calculateActualRipple()`**: Calculate the actual passband ripple achieved
- **`getRecommendedRipples()`**: Get recommended ripple values for different use cases

## Usage Examples

### Direct ChebyshevFilter Usage

```javascript
import { ChebyshevFilter } from './src/chebyshev-filter.js';

// Lowpass filter with 1 dB ripple
const lpFilter = ChebyshevFilter.design('lowpass', 100, 1000, 4, 1.0);

// Highpass filter with 0.5 dB ripple
const hpFilter = ChebyshevFilter.design('highpass', 200, 1000, 4, 0.5);

// Bandpass filter with 0.1 dB ripple (very low ripple for audio)
const bpFilter = ChebyshevFilter.design('bandpass', [150, 250], 1000, 4, 0.1);

// Calculate actual achieved ripple
const actualRipple = ChebyshevFilter.calculateActualRipple(
  lpFilter.b, lpFilter.a, 1000, 100
);

// Get recommended ripple values
const recommendations = ChebyshevFilter.getRecommendedRipples();
console.log(recommendations.audio); // 0.1 dB
```

### Backward Compatible Usage

```javascript
import { IIRDesigner } from './src/iir.js';

// Still works exactly as before
const filter = IIRDesigner.cheby1('lowpass', 100, 1000, 4, 1.0);
```

## Recommended Ripple Values

The `getRecommendedRipples()` method provides suggested ripple values for different applications:

- **Audio**: 0.1 dB - Very low ripple for high-quality audio
- **Communication**: 0.5 dB - Low ripple for communication systems
- **General**: 1.0 dB - General purpose applications
- **Moderate**: 2.0 dB - Moderate ripple tolerance
- **High**: 3.0 dB - High ripple tolerance

## Error Handling

The refactored ChebyshevFilter provides comprehensive error handling:

```javascript
try {
  // Invalid order
  ChebyshevFilter.design('lowpass', 100, 1000, 0, 1.0);
} catch (error) {
  console.log(error.message); // "Order must be >= 1"
}

try {
  // Invalid ripple
  ChebyshevFilter.design('lowpass', 100, 1000, 4, -1.0);
} catch (error) {
  console.log(error.message); // "Passband ripple must be positive"
}

try {
  // Excessive ripple
  ChebyshevFilter.design('lowpass', 100, 1000, 4, 15.0);
} catch (error) {
  console.log(error.message); // "Passband ripple should be <= 10 dB for practical designs"
}
```

## Comparison with Butterworth

| Feature | Butterworth | Chebyshev Type 1 |
|---------|-------------|------------------|
| **Passband Response** | Maximally flat | Equiripple |
| **Stopband Response** | Gradual rolloff | Steeper rolloff |
| **Ripple Control** | No ripple parameter | Configurable ripple |
| **Transition Band** | Wider | Narrower |
| **Phase Response** | Better | More nonlinear |
| **Use Cases** | General purpose | Sharp cutoff needed |

## File Structure

```
src/
├── base-iir-filter.js      # Abstract base class for IIR filters
├── butterworth-filter.js   # Butterworth filter implementation
├── chebyshev-filter.js     # Chebyshev Type 1 filter implementation
├── iir.js                  # Updated main IIR designer
└── ... (other existing files)
```

## Benefits of Refactoring

### 1. **Consistent Architecture**
- Follows the same pattern as Butterworth filter refactoring
- Reuses BaseIIRFilter for common functionality
- Maintains consistent API design

### 2. **Enhanced Functionality**
- Ripple parameter validation and recommendations
- Actual ripple calculation utility
- Better error handling and messages

### 3. **Improved Maintainability**
- Chebyshev-specific logic isolated in dedicated class
- Common functionality shared through base class
- Clear responsibility boundaries

### 4. **Backward Compatibility**
- Existing code continues to work unchanged
- No breaking changes to public API
- Gradual migration path available

## Future Extensions

The refactored architecture makes it easy to add Chebyshev Type 2 (inverse Chebyshev) filters:

```javascript
export class ChebyshevType2Filter extends BaseIIRFilter {
  static calculatePoles(order, stopbandAttenuation) {
    // Chebyshev Type 2 specific pole calculation
  }
  
  static design(kind, cutoffHz, fs, order, stopbandAttenuation = 40) {
    // Chebyshev Type 2 specific design logic
  }
}
```

## Testing

The refactored code maintains the same mathematical behavior as the original implementation. All existing tests should continue to pass without modification.

## Migration Guide

### For New Code
- Use `ChebyshevFilter.design()` directly for new implementations
- Take advantage of ripple validation and utility methods
- Use recommended ripple values for different applications

### For Existing Code
- No changes required - existing code continues to work
- Consider migrating to direct `ChebyshevFilter` usage for better error handling
- Use utility methods for ripple analysis and recommendations

## Conclusion

This refactoring provides a clean, maintainable implementation of Chebyshev Type 1 filters while maintaining full backward compatibility. The new architecture is consistent with the Butterworth filter refactoring and provides enhanced functionality for ripple control and validation.

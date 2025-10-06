# Linkwitz-Riley Filter Refactoring

## Overview

The Linkwitz-Riley filter generation code has been refactored following the same pattern as the other filter refactorings. This provides a clean, focused interface for Linkwitz-Riley filter design while maintaining backward compatibility.

## Changes Made

### 1. Created `LinkwitzRileyFilter` Class (`src/linkwitz-riley-filter.js`)

A dedicated class specifically for Linkwitz-Riley filter design:

- **Extends BaseIIRFilter**: Inherits common functionality from the base class
- **Linkwitz-Riley-specific design logic**: Cascades two identical Butterworth filters
- **Even order validation**: Ensures order is even (automatically adjusts if odd)
- **Specialized design methods**: Separate methods for different filter types
- **Additional utility methods**: 
  - `getActualOrder()` - Calculate actual filter order
  - `getHalfOrder()` - Calculate half order for base Butterworth filter
  - `getNumberOfSections()` - Calculate total number of sections
  - `getRecommendedOrders()` - Get recommended orders for different applications
  - `adjustOrderToEven()` - Adjust odd orders to even
  - `getFilterInfo()` - Get detailed information about filter design
- **Enhanced error handling**: Detailed validation and error messages specific to Linkwitz-Riley filters

### 2. Updated `IIRDesigner` Class (`src/iir.js`)

Modified the main IIR designer to use the new LinkwitzRileyFilter class:

- **Simplified linkwitzRiley method**: Now just delegates to LinkwitzRileyFilter.design()
- **Maintained backward compatibility**: Existing API unchanged
- **Cleaner code**: Removed duplicate Linkwitz-Riley-specific logic

## Key Features of Linkwitz-Riley Filter

### 1. **Even Order Requirement**
- Linkwitz-Riley filters require even orders only
- Automatically adjusts odd orders to the next even order
- Provides clear error messages for invalid orders

### 2. **Cascade Design**
- Linkwitz-Riley filters are cascades of two identical Butterworth filters
- Order 4 → two 2nd-order Butterworth filters cascaded
- Order 6 → two 3rd-order Butterworth filters cascaded
- Provides steeper rolloff than single Butterworth filters

### 3. **Enhanced Validation**
- Order validation (must be ≥ 2, must be even)
- Automatic order adjustment for odd orders
- Clear error messages for invalid parameters

### 4. **Utility Methods**
- **`getActualOrder()`**: Calculate actual filter order (always even)
- **`getHalfOrder()`**: Calculate half order for base Butterworth filter
- **`getNumberOfSections()`**: Calculate total number of sections
- **`getRecommendedOrders()`**: Get recommended orders for different use cases
- **`adjustOrderToEven()`**: Adjust odd orders to even
- **`getFilterInfo()`**: Get detailed information about filter design

## Usage Examples

### Direct LinkwitzRileyFilter Usage

```javascript
import { LinkwitzRileyFilter } from './src/linkwitz-riley-filter.js';

// 4th order lowpass filter
const lpFilter = LinkwitzRileyFilter.design('lowpass', 100, 1000, 4);

// 6th order highpass filter
const hpFilter = LinkwitzRileyFilter.design('highpass', 200, 1000, 6);

// Get filter information
const info = LinkwitzRileyFilter.getFilterInfo(5); // 5 → 6
console.log(info.description); // "Linkwitz-Riley 6th order (3rd order Butterworth cascaded twice)"

// Get recommended orders
const recommendations = LinkwitzRileyFilter.getRecommendedOrders();
console.log(recommendations.standard); // 4
```

### Backward Compatible Usage

```javascript
import { IIRDesigner } from './src/iir.js';

// Still works exactly as before
const filter = IIRDesigner.linkwitzRiley('lowpass', 100, 1000, 4);
```

## Recommended Orders

The `getRecommendedOrders()` method provides suggested orders for different applications:

- **Basic**: 2nd order - Simple applications
- **Standard**: 4th order - General purpose audio
- **High**: 6th order - High-quality audio
- **Premium**: 8th order - Professional audio
- **Professional**: 12th order - Studio applications

## Error Handling

The refactored LinkwitzRileyFilter provides comprehensive error handling:

```javascript
try {
  // Order too low
  LinkwitzRileyFilter.design('lowpass', 100, 1000, 1);
} catch (error) {
  console.log(error.message); // "Order must be >= 2 for Linkwitz-Riley filters"
}

try {
  // Invalid cutoff frequency
  LinkwitzRileyFilter.design('lowpass', 600, 1000, 4);
} catch (error) {
  console.log(error.message); // "Cutoff frequency must be 0 < fc < fs/2"
}
```

## Filter Characteristics

| Feature | Linkwitz-Riley | Butterworth | Chebyshev Type 1 | Chebyshev Type 2 |
|---------|----------------|-------------|------------------|------------------|
| **Order Requirement** | Even only | Any | Any | Any |
| **Design Method** | Cascade of 2 Butterworth | Single filter | Single filter | Single filter |
| **Rolloff Rate** | 6 dB/octave per section | 6 dB/octave per pole | Variable | Variable |
| **Phase Response** | Better than single Butterworth | Good | More nonlinear | Most nonlinear |
| **Use Cases** | Audio crossovers | General purpose | Sharp cutoff needed | Sharp stopband needed |

## Order Adjustment

Linkwitz-Riley filters automatically adjust odd orders to even:

| Requested Order | Actual Order | Half Order | Description |
|----------------|--------------|------------|-------------|
| 2 | 2 | 1 | 1st order Butterworth cascaded twice |
| 3 | 4 | 2 | 2nd order Butterworth cascaded twice |
| 4 | 4 | 2 | 2nd order Butterworth cascaded twice |
| 5 | 6 | 3 | 3rd order Butterworth cascaded twice |
| 6 | 6 | 3 | 3rd order Butterworth cascaded twice |

## File Structure

```
src/
├── base-iir-filter.js      # Abstract base class for IIR filters
├── butterworth-filter.js   # Butterworth filter implementation
├── chebyshev-filter.js     # Chebyshev Type 1 filter implementation
├── chebyshev-type2-filter.js # Chebyshev Type 2 filter implementation
├── linkwitz-riley-filter.js # Linkwitz-Riley filter implementation
├── iir.js                  # Updated main IIR designer
└── ... (other existing files)
```

## Benefits of Refactoring

### 1. **Consistent Architecture**
- Follows the same pattern as other filter refactorings
- Reuses BaseIIRFilter for common functionality
- Maintains consistent API design

### 2. **Enhanced Functionality**
- Order adjustment and validation utilities
- Application recommendations
- Detailed filter information methods
- Better error handling and messages

### 3. **Improved Maintainability**
- Linkwitz-Riley-specific logic isolated in dedicated class
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
- Use `LinkwitzRileyFilter.design()` directly for new implementations
- Take advantage of order adjustment and utility methods
- Use recommended orders for different applications

### For Existing Code
- No changes required - existing code continues to work
- Consider migrating to direct `LinkwitzRileyFilter` usage for better error handling
- Use utility methods for enhanced functionality

## Conclusion

This refactoring provides a clean, maintainable implementation of Linkwitz-Riley filters while maintaining full backward compatibility. The new architecture is consistent with the other filter refactorings and provides enhanced functionality for order management and validation.

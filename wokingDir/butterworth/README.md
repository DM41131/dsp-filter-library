# Butterworth Filter Designer

An interactive web-based tool for designing and analyzing Butterworth digital filters with comprehensive visualization capabilities.

## Features

- **Interactive Filter Design**: Design low-pass, high-pass, band-pass, and band-stop Butterworth filters
- **Real-time Visualization**: 
  - Frequency response (magnitude and phase)
  - Z-plane pole/zero plots
  - Group delay analysis
- **Comprehensive Controls**: Adjustable filter parameters with real-time updates
- **Professional UI**: Modern, responsive interface with tabbed visualization

## Files

- `index.html` - Main application interface
- `butterworth.js` - Core filter design and analysis library
- `test.html` - Test page to verify functionality
- `README.md` - This documentation

## Usage

### Opening the Application

1. Open `index.html` in a modern web browser
2. The application will load with a default 4th-order low-pass Butterworth filter

### Designing Filters

1. **Select Filter Type**: Choose from low-pass, high-pass, band-pass, or band-stop
2. **Set Parameters**:
   - **Sampling Frequency**: Adjust the sampling rate (1kHz - 192kHz)
   - **Filter Order**: Set the filter order (1-20)
   - **Cutoff Frequency**: For low/high-pass filters
   - **Band Frequencies**: For band-pass/band-stop filters (low and high frequencies)
3. **Design Filter**: Click the "Design Filter" button to generate the filter

### Viewing Results

The application provides four visualization tabs:

#### 1. Frequency Response
- **Magnitude Plot**: Shows the filter's frequency response in dB
- Logarithmic frequency scale for better visualization
- Automatic scaling and grid lines

#### 2. Phase Response
- **Phase Plot**: Shows the filter's phase response in degrees
- Useful for analyzing phase distortion
- Wrapped phase display

#### 3. Z-Plane
- **Pole/Zero Plot**: Shows filter poles (×) and zeros (○) in the complex z-plane
- Unit circle reference for stability analysis
- Interactive scaling and zoom

#### 4. Group Delay
- **Group Delay Plot**: Shows the filter's group delay in samples
- Important for analyzing phase distortion
- Useful for audio applications

### Filter Information Panel

The left panel displays:
- **Filter Specifications**: Type, order, sampling frequency, cutoff frequencies
- **Filter Characteristics**: -3dB frequency, DC gain, passband ripple
- **Real-time Updates**: Information updates as you change parameters

## Technical Details

### Filter Design

The tool uses the DSP library's `IIRDesigner.butterworth()` method for filter design:
- Bilinear transformation for analog-to-digital conversion
- Proper frequency prewarping for accurate cutoff frequencies
- Second-order section (SOS) decomposition for numerical stability

### Frequency Analysis

- **Frequency Response**: Calculated using `ZDomain.freqz()`
- **Group Delay**: Calculated using `ZDomain.groupDelay()`
- **Poles/Zeros**: Found using Durand-Kerner root-finding algorithm

### Visualization

- **Chart.js**: Used for all plotting and visualization
- **Logarithmic Scales**: Frequency axes use logarithmic scaling
- **Responsive Design**: Adapts to different screen sizes

## Browser Compatibility

- Modern browsers with ES6 module support
- Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+
- Requires internet connection for Chart.js CDN

## Testing

Run `test.html` to verify the implementation:
1. Open `test.html` in a browser
2. Click "Run Tests" to execute comprehensive tests
3. All tests should pass for a working implementation

## Dependencies

- **DSP Library**: Uses the local DSP filter library (`../../lib/index.js`)
- **Chart.js**: CDN-loaded for visualization
- **No additional dependencies**: Pure JavaScript implementation

## Examples

### Low-Pass Filter
```javascript
// Design a 4th-order low-pass filter at 1kHz
const filter = designer.designFilter('lowpass', 1000, 4, 44100);
```

### Band-Pass Filter
```javascript
// Design a 6th-order band-pass filter from 500Hz to 2kHz
const filter = designer.designFilter('bandpass', [500, 2000], 6, 44100);
```

### Frequency Response
```javascript
// Get frequency response with 1024 points
const freqResponse = designer.getFrequencyResponse(1024);
console.log(freqResponse.magnitude); // Magnitude in dB
console.log(freqResponse.phase);     // Phase in degrees
```

## Troubleshooting

### Common Issues

1. **"No filter designed yet" error**: Click "Design Filter" button first
2. **Invalid frequency range**: Ensure cutoff frequencies are within Nyquist limit
3. **Chart not displaying**: Check browser console for JavaScript errors
4. **Module import errors**: Ensure the DSP library is properly built

### Performance Tips

- Use lower filter orders for faster computation
- Reduce frequency response points for quicker updates
- Close unused browser tabs to free memory

## License

MIT License - See the main project license for details.


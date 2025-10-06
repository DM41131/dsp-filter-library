// chebyshev-refactored-example.js — Example usage of refactored Chebyshev Type 1 filter
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ChebyshevFilter } from '../src/chebyshev-filter.js';
import { IIRDesigner } from '../src/iir.js';

/**
 * Example demonstrating the refactored Chebyshev Type 1 filter design
 */
async function demonstrateRefactoredChebyshev() {
  console.log('=== Refactored Chebyshev Type 1 Filter Example ===\n');

  const fs = 1000; // Sampling frequency
  const order = 4;
  const cutoffFreq = 100; // Hz

  try {
    // Example 1: Lowpass filter with different ripple values
    console.log('1. Lowpass filters with different ripple values:');
    
    const ripples = [0.1, 0.5, 1.0, 2.0, 3.0];
    ripples.forEach(ripple => {
      const filter = ChebyshevFilter.design('lowpass', cutoffFreq, fs, order, ripple);
      const actualRipple = ChebyshevFilter.calculateActualRipple(filter.b, filter.a, fs, cutoffFreq);
      console.log(`   Ripple ${ripple} dB: Actual = ${actualRipple.toFixed(3)} dB, Sections = ${filter.sections.length}`);
    });
    console.log();

    // Example 2: Highpass filter using the new ChebyshevFilter class directly
    console.log('2. Highpass filter (direct ChebyshevFilter usage):');
    const hpFilter = ChebyshevFilter.design('highpass', 200, fs, order, 1.0);
    console.log(`   Numerator coefficients: [${hpFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${hpFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${hpFilter.sections.length}\n`);

    // Example 3: Bandpass filter using the new ChebyshevFilter class directly
    console.log('3. Bandpass filter (direct ChebyshevFilter usage):');
    const bpFilter = ChebyshevFilter.design('bandpass', [150, 250], fs, order, 0.5);
    console.log(`   Numerator coefficients: [${bpFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${bpFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${bpFilter.sections.length}\n`);

    // Example 4: Using the original IIRDesigner interface (now uses refactored code internally)
    console.log('4. Lowpass filter (via IIRDesigner - backward compatible):');
    const legacyFilter = IIRDesigner.cheby1('lowpass', cutoffFreq, fs, order, 1.0);
    console.log(`   Numerator coefficients: [${legacyFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${legacyFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${legacyFilter.sections.length}\n`);

    // Example 5: Recommended ripple values for different applications
    console.log('5. Recommended ripple values for different applications:');
    const recommendations = ChebyshevFilter.getRecommendedRipples();
    Object.entries(recommendations).forEach(([application, ripple]) => {
      console.log(`   ${application}: ${ripple} dB`);
    });
    console.log();

    // Example 6: Error handling demonstration
    console.log('6. Error handling demonstration:');
    try {
      ChebyshevFilter.design('lowpass', cutoffFreq, fs, 0, 1.0); // Invalid order
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    try {
      ChebyshevFilter.design('lowpass', cutoffFreq, fs, order, -1.0); // Invalid ripple
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    try {
      ChebyshevFilter.design('lowpass', cutoffFreq, fs, order, 15.0); // Excessive ripple
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    // Example 7: Comparison with Butterworth filter
    console.log('\n7. Comparison with Butterworth filter:');
    const { ButterworthFilter } = await import('../src/butterworth-filter.js');
    const bwFilter = ButterworthFilter.design('lowpass', cutoffFreq, fs, order);
    const chebyFilter = ChebyshevFilter.design('lowpass', cutoffFreq, fs, order, 1.0);
    
    console.log(`   Butterworth - Numerator: [${bwFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Chebyshev   - Numerator: [${chebyFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Butterworth - Sections: ${bwFilter.sections.length}`);
    console.log(`   Chebyshev   - Sections: ${chebyFilter.sections.length}`);

    console.log('\n=== Refactoring Benefits ===');
    console.log('✓ Clean separation of concerns');
    console.log('✓ Dedicated ChebyshevFilter class');
    console.log('✓ Reusable BaseIIRFilter base class');
    console.log('✓ Comprehensive error handling and validation');
    console.log('✓ Ripple parameter validation and recommendations');
    console.log('✓ Backward compatibility maintained');
    console.log('✓ Better code organization and maintainability');

  } catch (error) {
    console.error('Error in demonstration:', error.message);
  }
}

// Run the demonstration
demonstrateRefactoredChebyshev().catch(console.error);

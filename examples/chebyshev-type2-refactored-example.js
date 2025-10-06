// chebyshev-type2-refactored-example.js — Example usage of refactored Chebyshev Type 2 filter
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ChebyshevType2Filter } from '../src/chebyshev-type2-filter.js';
import { IIRDesigner } from '../src/iir.js';

/**
 * Example demonstrating the refactored Chebyshev Type 2 filter design
 */
async function demonstrateRefactoredChebyshevType2() {
  console.log('=== Refactored Chebyshev Type 2 Filter Example ===\n');

  const fs = 1000; // Sampling frequency
  const order = 4;
  const stopbandEdge = 150; // Hz (stopband edge frequency)

  try {
    // Example 1: Lowpass filter with different stopband attenuations
    console.log('1. Lowpass filters with different stopband attenuations:');
    
    const attenuations = [20, 30, 40, 50, 60];
    attenuations.forEach(attenuation => {
      const filter = ChebyshevType2Filter.design('lowpass', stopbandEdge, fs, order, attenuation);
      const actualAttenuation = ChebyshevType2Filter.calculateActualStopbandAttenuation(
        filter.b, filter.a, fs, stopbandEdge
      );
      const finiteZeros = ChebyshevType2Filter.getNumberOfFiniteZeros(order);
      console.log(`   ${attenuation} dB: Actual = ${actualAttenuation.toFixed(3)} dB, Zeros = ${finiteZeros}, Sections = ${filter.sections.length}`);
    });
    console.log();

    // Example 2: Highpass filter using the new ChebyshevType2Filter class directly
    console.log('2. Highpass filter (direct ChebyshevType2Filter usage):');
    const hpFilter = ChebyshevType2Filter.design('highpass', 200, fs, order, 40);
    console.log(`   Numerator coefficients: [${hpFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${hpFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${hpFilter.sections.length}\n`);

    // Example 3: Bandpass filter using the new ChebyshevType2Filter class directly
    console.log('3. Bandpass filter (direct ChebyshevType2Filter usage):');
    const bpFilter = ChebyshevType2Filter.design('bandpass', [150, 250], fs, order, 40);
    console.log(`   Numerator coefficients: [${bpFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${bpFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${bpFilter.sections.length}\n`);

    // Example 4: Using the original IIRDesigner interface (now uses refactored code internally)
    console.log('4. Lowpass filter (via IIRDesigner - backward compatible):');
    const legacyFilter = IIRDesigner.cheby2('lowpass', stopbandEdge, fs, order, 40);
    console.log(`   Numerator coefficients: [${legacyFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${legacyFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${legacyFilter.sections.length}\n`);

    // Example 5: Recommended stopband attenuation values for different applications
    console.log('5. Recommended stopband attenuation values for different applications:');
    const recommendations = ChebyshevType2Filter.getRecommendedStopbandAttenuations();
    console.log('   Application     | Recommended Attenuation');
    console.log('   ----------------|-------------------------');
    Object.entries(recommendations).forEach(([application, attenuation]) => {
      console.log(`   ${application.padEnd(15)} | ${attenuation} dB`);
    });
    console.log();

    // Example 6: Finite zeros analysis
    console.log('6. Finite Zeros Analysis:');
    console.log('   Order | Finite Zero Pairs');
    console.log('   ------|------------------');
    for (let ord = 2; ord <= 8; ord++) {
      const zeros = ChebyshevType2Filter.getNumberOfFiniteZeros(ord);
      console.log(`   ${ord}     | ${zeros}`);
    }
    console.log();

    // Example 7: Error handling demonstration
    console.log('7. Error handling demonstration:');
    try {
      ChebyshevType2Filter.design('lowpass', stopbandEdge, fs, 0, 40); // Invalid order
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    try {
      ChebyshevType2Filter.design('lowpass', stopbandEdge, fs, order, -10); // Invalid attenuation
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    try {
      ChebyshevType2Filter.design('lowpass', stopbandEdge, fs, order, 5); // Too low attenuation
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    try {
      ChebyshevType2Filter.design('lowpass', stopbandEdge, fs, order, 150); // Too high attenuation
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    // Example 8: Comparison with other filter types
    console.log('\n8. Filter Type Comparison (4th order, 150 Hz stopband edge):');
    const { ButterworthFilter } = await import('../src/butterworth-filter.js');
    const { ChebyshevFilter } = await import('../src/chebyshev-filter.js');
    
    const bwFilter = ButterworthFilter.design('lowpass', 100, fs, order);
    const ch1Filter = ChebyshevFilter.design('lowpass', 100, fs, order, 1.0);
    const ch2Filter = ChebyshevType2Filter.design('lowpass', stopbandEdge, fs, order, 40);
    
    console.log(`   Butterworth     - Numerator: [${bwFilter.b.slice(0, 3).map(x => x.toFixed(6)).join(', ')}...]`);
    console.log(`   Chebyshev Type 1 - Numerator: [${ch1Filter.b.slice(0, 3).map(x => x.toFixed(6)).join(', ')}...]`);
    console.log(`   Chebyshev Type 2 - Numerator: [${ch2Filter.b.slice(0, 3).map(x => x.toFixed(6)).join(', ')}...]`);
    console.log(`   Butterworth     - Sections: ${bwFilter.sections.length}`);
    console.log(`   Chebyshev Type 1 - Sections: ${ch1Filter.sections.length}`);
    console.log(`   Chebyshev Type 2 - Sections: ${ch2Filter.sections.length}`);

    console.log('\n=== Refactoring Benefits ===');
    console.log('✓ Clean separation of concerns');
    console.log('✓ Dedicated ChebyshevType2Filter class');
    console.log('✓ Reusable BaseIIRFilter base class');
    console.log('✓ Comprehensive error handling and validation');
    console.log('✓ Stopband attenuation parameter validation and recommendations');
    console.log('✓ Finite zeros analysis utilities');
    console.log('✓ Backward compatibility maintained');
    console.log('✓ Better code organization and maintainability');

  } catch (error) {
    console.error('Error in demonstration:', error.message);
  }
}

// Run the demonstration
demonstrateRefactoredChebyshevType2().catch(console.error);

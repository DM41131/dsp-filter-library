// butterworth-refactored-example.js — Example usage of refactored Butterworth filter
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ButterworthFilter } from '../src/butterworth-filter.js';
import { IIRDesigner } from '../src/iir.js';

/**
 * Example demonstrating the refactored Butterworth filter design
 */
function demonstrateRefactoredButterworth() {
  console.log('=== Refactored Butterworth Filter Example ===\n');

  const fs = 1000; // Sampling frequency
  const order = 4;

  try {
    // Example 1: Lowpass filter using the new ButterworthFilter class directly
    console.log('1. Lowpass filter (direct ButterworthFilter usage):');
    const lpFilter = ButterworthFilter.design('lowpass', 100, fs, order);
    console.log(`   Numerator coefficients: [${lpFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${lpFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${lpFilter.sections.length}\n`);

    // Example 2: Highpass filter using the new ButterworthFilter class directly
    console.log('2. Highpass filter (direct ButterworthFilter usage):');
    const hpFilter = ButterworthFilter.design('highpass', 200, fs, order);
    console.log(`   Numerator coefficients: [${hpFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${hpFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${hpFilter.sections.length}\n`);

    // Example 3: Bandpass filter using the new ButterworthFilter class directly
    console.log('3. Bandpass filter (direct ButterworthFilter usage):');
    const bpFilter = ButterworthFilter.design('bandpass', [150, 250], fs, order);
    console.log(`   Numerator coefficients: [${bpFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${bpFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${bpFilter.sections.length}\n`);

    // Example 4: Using the original IIRDesigner interface (now uses refactored code internally)
    console.log('4. Lowpass filter (via IIRDesigner - backward compatible):');
    const legacyFilter = IIRDesigner.butterworth('lowpass', 100, fs, order);
    console.log(`   Numerator coefficients: [${legacyFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Denominator coefficients: [${legacyFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Number of sections: ${legacyFilter.sections.length}\n`);

    // Example 5: Error handling demonstration
    console.log('5. Error handling demonstration:');
    try {
      ButterworthFilter.design('lowpass', 500, fs, 0); // Invalid order
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    try {
      ButterworthFilter.design('lowpass', 600, fs, order); // Invalid cutoff frequency
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    console.log('\n=== Refactoring Benefits ===');
    console.log('✓ Clean separation of concerns');
    console.log('✓ Dedicated ButterworthFilter class');
    console.log('✓ Reusable BaseIIRFilter base class');
    console.log('✓ Comprehensive error handling and validation');
    console.log('✓ Backward compatibility maintained');
    console.log('✓ Better code organization and maintainability');

  } catch (error) {
    console.error('Error in demonstration:', error.message);
  }
}

// Run the demonstration
demonstrateRefactoredButterworth();

// linkwitz-riley-refactored-example.js — Example usage of refactored Linkwitz-Riley filter
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { LinkwitzRileyFilter } from '../src/linkwitz-riley-filter.js';
import { IIRDesigner } from '../src/iir.js';
import { ButterworthFilter } from '../src/butterworth-filter.js';

/**
 * Example demonstrating the refactored Linkwitz-Riley filter design
 */
function demonstrateRefactoredLinkwitzRiley() {
  console.log('=== Refactored Linkwitz-Riley Filter Example ===\n');

  const fs = 1000; // Sampling frequency
  const cutoffFreq = 100; // Hz

  try {
    // Example 1: Different orders of Linkwitz-Riley filters
    console.log('1. Linkwitz-Riley filters with different orders:');
    
    const orders = [2, 3, 4, 5, 6, 8];
    orders.forEach(order => {
      const filter = LinkwitzRileyFilter.design('lowpass', cutoffFreq, fs, order);
      const info = LinkwitzRileyFilter.getFilterInfo(order);
      console.log(`   Order ${order}: ${info.description}`);
      console.log(`     Actual order: ${info.actualOrder}, Sections: ${info.sections}, Adjusted: ${info.isAdjusted}`);
      console.log(`     Numerator: [${filter.b.slice(0, 3).map(x => x.toFixed(6)).join(', ')}...]`);
    });
    console.log();

    // Example 2: Lowpass and highpass filters
    console.log('2. Lowpass and highpass Linkwitz-Riley filters:');
    
    const lpFilter = LinkwitzRileyFilter.design('lowpass', cutoffFreq, fs, 4);
    const hpFilter = LinkwitzRileyFilter.design('highpass', cutoffFreq, fs, 4);
    
    console.log(`   Lowpass - Numerator: [${lpFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Lowpass - Denominator: [${hpFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Highpass - Numerator: [${hpFilter.b.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`   Highpass - Denominator: [${hpFilter.a.map(x => x.toFixed(6)).join(', ')}]`);
    console.log();

    // Example 3: Comparison with Butterworth filter
    console.log('3. Comparison with Butterworth filter (4th order):');
    
    const lrFilter = LinkwitzRileyFilter.design('lowpass', cutoffFreq, fs, 4);
    const bwFilter = ButterworthFilter.design('lowpass', cutoffFreq, fs, 4);
    
    console.log(`   Linkwitz-Riley - Numerator: [${lrFilter.b.slice(0, 3).map(x => x.toFixed(6)).join(', ')}...]`);
    console.log(`   Butterworth     - Numerator: [${bwFilter.b.slice(0, 3).map(x => x.toFixed(6)).join(', ')}...]`);
    console.log(`   Linkwitz-Riley - Sections: ${lrFilter.sections.length}`);
    console.log(`   Butterworth     - Sections: ${bwFilter.sections.length}`);
    console.log();

    // Example 4: Using the original IIRDesigner interface (backward compatible)
    console.log('4. Backward compatibility test:');
    
    const legacyFilter = IIRDesigner.linkwitzRiley('lowpass', cutoffFreq, fs, 4);
    const bMatch = JSON.stringify(lrFilter.b) === JSON.stringify(legacyFilter.b);
    const aMatch = JSON.stringify(lrFilter.a) === JSON.stringify(legacyFilter.a);
    const sectionsMatch = lrFilter.sections.length === legacyFilter.sections.length;
    
    console.log(`   Numerator coefficients match: ${bMatch ? '✓' : '✗'}`);
    console.log(`   Denominator coefficients match: ${aMatch ? '✓' : '✗'}`);
    console.log(`   Number of sections match: ${sectionsMatch ? '✓' : '✗'}`);
    console.log();

    // Example 5: Order adjustment demonstration
    console.log('5. Order adjustment demonstration:');
    
    const oddOrder = 5;
    const adjustedOrder = LinkwitzRileyFilter.adjustOrderToEven(oddOrder);
    const actualOrder = LinkwitzRileyFilter.getActualOrder(oddOrder);
    const halfOrder = LinkwitzRileyFilter.getHalfOrder(oddOrder);
    
    console.log(`   Requested order: ${oddOrder}`);
    console.log(`   Adjusted order: ${adjustedOrder}`);
    console.log(`   Actual order: ${actualOrder}`);
    console.log(`   Half order (for Butterworth): ${halfOrder}`);
    console.log();

    // Example 6: Recommended orders for different applications
    console.log('6. Recommended orders for different applications:');
    const recommendations = LinkwitzRileyFilter.getRecommendedOrders();
    Object.entries(recommendations).forEach(([application, order]) => {
      const info = LinkwitzRileyFilter.getFilterInfo(order);
      console.log(`   ${application.padEnd(12)}: ${order}th order (${info.description})`);
    });
    console.log();

    // Example 7: Error handling demonstration
    console.log('7. Error handling demonstration:');
    
    try {
      LinkwitzRileyFilter.design('lowpass', cutoffFreq, fs, 1); // Too low order
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    try {
      LinkwitzRileyFilter.design('lowpass', cutoffFreq, fs, 0); // Invalid order
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    try {
      LinkwitzRileyFilter.design('lowpass', 600, fs, 4); // Invalid cutoff frequency
    } catch (error) {
      console.log(`   Caught expected error: ${error.message}`);
    }

    // Example 8: Filter characteristics
    console.log('\n8. Linkwitz-Riley Filter Characteristics:');
    console.log('   ✓ Even order only (automatically adjusted if odd)');
    console.log('   ✓ Cascade of two identical Butterworth filters');
    console.log('   ✓ Steeper rolloff than single Butterworth');
    console.log('   ✓ Better phase response than single Butterworth');
    console.log('   ✓ Commonly used in audio crossover networks');
    console.log('   ✓ Provides 6 dB/octave per Butterworth section');

    console.log('\n=== Refactoring Benefits ===');
    console.log('✓ Clean separation of concerns');
    console.log('✓ Dedicated LinkwitzRileyFilter class');
    console.log('✓ Reusable BaseIIRFilter base class');
    console.log('✓ Comprehensive error handling and validation');
    console.log('✓ Order adjustment and validation utilities');
    console.log('✓ Application recommendations');
    console.log('✓ Backward compatibility maintained');
    console.log('✓ Better code organization and maintainability');

  } catch (error) {
    console.error('Error in demonstration:', error.message);
  }
}

// Run the demonstration
demonstrateRefactoredLinkwitzRiley();

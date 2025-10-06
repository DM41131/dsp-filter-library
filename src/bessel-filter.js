import { BaseIIRFilter } from './base-iir-filter.js';
import { ComplexNum, C } from './complex.js';
import { Util } from './utils.js';
import { FIRDesigner } from './fir.js';

/**
 * Bessel Filter Designer
 * 
 * Bessel filters are characterized by maximally flat group delay (linear phase response)
 * in the passband. They are commonly used in applications where phase linearity is critical.
 * 
 * Key characteristics:
 * - Maximally flat group delay
 * - Linear phase response in passband
 * - Gradual rolloff in stopband
 * - No ripple in passband or stopband
 * - Preserves signal shape (minimal distortion)
 */
export class BesselFilter extends BaseIIRFilter {
    
    /**
     * Design a Bessel filter (unified interface)
     * @param {string} kind - Filter type ('lowpass', 'highpass', 'bandpass', 'bandstop')
     * @param {number|number[]} cutoffHz - Cutoff frequency(ies)
     * @param {number} fs - Sampling frequency
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static design(kind, cutoffHz, fs, order) {
        // Enforce maximum order limit for IIR filters
        if (order > 12) {
            throw new Error(`Bessel filter order ${order} exceeds maximum allowed order of 12. For higher orders, consider using cascaded lower-order sections or alternative filter types.`);
        }
        
        switch (kind) {
            case 'lowpass':
                return this.designLowPass(cutoffHz, fs, order);
            case 'highpass':
                return this.designHighPass(cutoffHz, fs, order);
            case 'bandpass':
                if (Array.isArray(cutoffHz) && cutoffHz.length === 2) {
                    return this.designBandPass(cutoffHz[0], cutoffHz[1], fs, order);
                }
                throw new Error('Bandpass requires [lowCutoff, highCutoff] frequencies');
            case 'bandstop':
                if (Array.isArray(cutoffHz) && cutoffHz.length === 2) {
                    return this.designBandStop(cutoffHz[0], cutoffHz[1], fs, order);
                }
                throw new Error('Bandstop requires [lowCutoff, highCutoff] frequencies');
            default:
                throw new Error(`Unsupported filter type: ${kind}`);
        }
    }
    
    /**
     * Design a Bessel lowpass filter
     * @param {number} cutoffHz - Cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designLowPass(cutoffHz, fs, order) {
        // True Bessel IIR filter implementation
        const wc = Util.prewarp(cutoffHz, fs);
        const poles = this.calculateBesselPoles(order);
        
        // Convert to digital filter using bilinear transform
        return this.fromPrototype('lowpass', fs, poles, 1, wc);
    }
    
    /**
     * Design a Bessel highpass filter
     * @param {number} cutoffHz - Cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designHighPass(cutoffHz, fs, order) {
        // True Bessel IIR filter implementation
        const wc = Util.prewarp(cutoffHz, fs);
        const poles = this.calculateBesselPoles(order);
        
        // Apply highpass transformation (s -> 1/s)
        const transformedPoles = poles.map(p => C.div(C.of(1, 0), p));
        
        return this.fromPrototype('highpass', fs, transformedPoles, -1, wc);
    }
    
    /**
     * Design a Bessel bandpass filter using lowpass + highpass combination
     * @param {number} lowCutoffHz - Lower cutoff frequency in Hz
     * @param {number} highCutoffHz - Upper cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designBandPass(lowCutoffHz, highCutoffHz, fs, order) {
        // Design highpass filter at lowCutoffHz
        const hpFilter = this.designHighPass(lowCutoffHz, fs, order);
        
        // Design lowpass filter at highCutoffHz
        const lpFilter = this.designLowPass(highCutoffHz, fs, order);
        
        // Combine filters by cascading (multiplying transfer functions)
        const combinedB = Util.polymul(hpFilter.b, lpFilter.b);
        const combinedA = Util.polymul(hpFilter.a, lpFilter.a);
        const combinedSections = hpFilter.sections.concat(lpFilter.sections);
        
        return { b: combinedB, a: combinedA, sections: combinedSections };
    }
    
    /**
     * Design a Bessel bandstop filter using parallel highpass + lowpass combination
     * @param {number} lowCutoffHz - Lower cutoff frequency in Hz
     * @param {number} highCutoffHz - Upper cutoff frequency in Hz
     * @param {number} fs - Sampling frequency in Hz
     * @param {number} order - Filter order
     * @returns {Object} Filter coefficients {b, a, sections}
     */
    static designBandStop(lowCutoffHz, highCutoffHz, fs, order) {
        // Design lowpass filter at lowCutoffHz
        const lpFilter = this.designLowPass(lowCutoffHz, fs, order);
        
        // Design highpass filter at highCutoffHz
        const hpFilter = this.designHighPass(highCutoffHz, fs, order);
        
        // For bandstop: H_bandstop(s) = H_lp(s) + H_hp(s)
        // This requires parallel combination (addition) of transfer functions
        // Convert to common denominator and add numerators
        const commonA = Util.polymul(lpFilter.a, hpFilter.a);
        const lpNum = Util.polymul(lpFilter.b, hpFilter.a);
        const hpNum = Util.polymul(hpFilter.b, lpFilter.a);
        const combinedB = Util.polyadd(lpNum, hpNum);
        
        // Combine sections by creating a parallel structure
        const combinedSections = [
            ...lpFilter.sections.map(s => ({ b: s.b.slice(), a: s.a.slice() })),
            ...hpFilter.sections.map(s => ({ b: s.b.slice(), a: s.a.slice() }))
        ];
        
        return { b: combinedB, a: commonA, sections: combinedSections };
    }
    
    /**
     * Calculate Bessel filter poles
     * @param {number} order - Filter order
     * @returns {Array} Array of complex poles
     */
    static calculateBesselPoles(order) {
        // Bessel filter poles are the roots of the Bessel polynomial
        // For low orders, we can use pre-calculated values
        const poleSets = {
            1: [C.of(-1, 0)],
            2: [C.of(-1.5, 0.8660254037844386), C.of(-1.5, -0.8660254037844386)],
            3: [C.of(-2.322185354626086, 0), C.of(-1.838907322686957, 1.754380959783721), C.of(-1.838907322686957, -1.754380959783721)],
            4: [C.of(-2.103789397179628, 0.6657060219931349), C.of(-2.103789397179628, -0.6657060219931349), C.of(-1.896210602820372, 1.744447419188405), C.of(-1.896210602820372, -1.744447419188405)],
            5: [C.of(-2.324674303181611, 0), C.of(-2.048290428681656, 1.000044768299361), C.of(-2.048290428681656, -1.000044768299361), C.of(-1.673416736234146, 1.673416736234146), C.of(-1.673416736234146, -1.673416736234146)],
            6: [C.of(-2.132906311462530, 0.4718706301774892), C.of(-2.132906311462530, -0.4718706301774892), C.of(-1.905412542845325, 1.552914270615124), C.of(-1.905412542845325, -1.552914270615124), C.of(-1.606938159156189, 1.606938159156189), C.of(-1.606938159156189, -1.606938159156189)],
            7: [C.of(-2.324674303181611, 0), C.of(-2.048290428681656, 1.000044768299361), C.of(-2.048290428681656, -1.000044768299361), C.of(-1.673416736234146, 1.673416736234146), C.of(-1.673416736234146, -1.673416736234146), C.of(-1.414213562373095, 1.414213562373095), C.of(-1.414213562373095, -1.414213562373095)],
            8: [C.of(-2.132906311462530, 0.4718706301774892), C.of(-2.132906311462530, -0.4718706301774892), C.of(-1.905412542845325, 1.552914270615124), C.of(-1.905412542845325, -1.552914270615124), C.of(-1.606938159156189, 1.606938159156189), C.of(-1.606938159156189, -1.606938159156189), C.of(-1.414213562373095, 1.414213562373095), C.of(-1.414213562373095, -1.414213562373095)],
            9: [C.of(-2.324674303181611, 0), C.of(-2.048290428681656, 1.000044768299361), C.of(-2.048290428681656, -1.000044768299361), C.of(-1.673416736234146, 1.673416736234146), C.of(-1.673416736234146, -1.673416736234146), C.of(-1.414213562373095, 1.414213562373095), C.of(-1.414213562373095, -1.414213562373095), C.of(-1.224744871391589, 1.224744871391589), C.of(-1.224744871391589, -1.224744871391589)],
            10: [C.of(-2.132906311462530, 0.4718706301774892), C.of(-2.132906311462530, -0.4718706301774892), C.of(-1.905412542845325, 1.552914270615124), C.of(-1.905412542845325, -1.552914270615124), C.of(-1.606938159156189, 1.606938159156189), C.of(-1.606938159156189, -1.606938159156189), C.of(-1.414213562373095, 1.414213562373095), C.of(-1.414213562373095, -1.414213562373095), C.of(-1.224744871391589, 1.224744871391589), C.of(-1.224744871391589, -1.224744871391589)]
        };
        
        if (poleSets[order]) {
            return poleSets[order];
        }
        
        // For higher orders, use numerical calculation
        return this.calculateBesselPolesNumerical(order);
    }
    
    /**
     * Calculate Bessel poles numerically for higher orders
     * @param {number} order - Filter order
     * @returns {Array} Array of complex poles
     */
    static calculateBesselPolesNumerical(order) {
        // This is a simplified numerical approach
        // In practice, this would use more sophisticated root-finding algorithms
        
        const poles = [];
        
        // For even orders, all poles are complex conjugate pairs
        if (order % 2 === 0) {
            for (let i = 0; i < order / 2; i++) {
                const angle = (2 * i + 1) * Math.PI / (2 * order);
                const real = -Math.cos(angle);
                const imag = Math.sin(angle);
                poles.push(C.of(real, imag));
                poles.push(C.of(real, -imag));
            }
        } else {
            // For odd orders, one real pole and complex conjugate pairs
            poles.push(C.of(-1, 0));
            for (let i = 0; i < (order - 1) / 2; i++) {
                const angle = (2 * i + 1) * Math.PI / (2 * order);
                const real = -Math.cos(angle);
                const imag = Math.sin(angle);
                poles.push(C.of(real, imag));
                poles.push(C.of(real, -imag));
            }
        }
        
        return poles;
    }
    
    /**
     * Calculate Bessel polynomial coefficients
     * @param {number} order - Filter order
     * @returns {Array} Array of polynomial coefficients
     */
    static calculateBesselPolynomial(order) {
        // Bessel polynomials are defined recursively
        // B_n(s) = (2n-1)B_{n-1}(s) + s^2 B_{n-2}(s)
        
        if (order === 0) return [1];
        if (order === 1) return [1, 1];
        
        let b_n_minus_2 = [1]; // B_0(s) = 1
        let b_n_minus_1 = [1, 1]; // B_1(s) = 1 + s
        
        for (let n = 2; n <= order; n++) {
            const b_n = new Array(n + 1).fill(0);
            
            // (2n-1) * B_{n-1}(s)
            for (let i = 0; i < b_n_minus_1.length; i++) {
                b_n[i] += (2 * n - 1) * b_n_minus_1[i];
            }
            
            // s^2 * B_{n-2}(s) - shift by 2 positions
            for (let i = 0; i < b_n_minus_2.length; i++) {
                b_n[i + 2] += b_n_minus_2[i];
            }
            
            b_n_minus_2 = b_n_minus_1;
            b_n_minus_1 = b_n;
        }
        
        return b_n_minus_1;
    }
    
    /**
     * Get recommended filter orders for Bessel filters
     * @returns {Array} Array of recommended orders
     */
    static getRecommendedOrders() {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }
    
    /**
     * Calculate group delay for Bessel filter
     * @param {number} order - Filter order
     * @param {number} frequency - Frequency in Hz
     * @param {number} fs - Sampling frequency
     * @returns {number} Group delay in seconds
     */
    static calculateGroupDelay(order, frequency, fs) {
        // Bessel filters have maximally flat group delay
        // The group delay is approximately constant in the passband
        const normalizedFreq = 2 * Math.PI * frequency / fs;
        
        // Simplified group delay calculation
        // In practice, this would be calculated from the filter's phase response
        const groupDelay = order / (2 * Math.PI * frequency);
        
        return Math.max(0, groupDelay);
    }
    
    /**
     * Get Bessel filter characteristics
     * @param {number} order - Filter order
     * @returns {Object} Filter characteristics
     */
    static getCharacteristics(order) {
        const characteristics = {
            1: { groupDelay: 1.0, rolloff: -6, phase: 'Linear' },
            2: { groupDelay: 1.5, rolloff: -12, phase: 'Linear' },
            3: { groupDelay: 2.0, rolloff: -18, phase: 'Linear' },
            4: { groupDelay: 2.5, rolloff: -24, phase: 'Linear' },
            5: { groupDelay: 3.0, rolloff: -30, phase: 'Linear' },
            6: { groupDelay: 3.5, rolloff: -36, phase: 'Linear' },
            7: { groupDelay: 4.0, rolloff: -42, phase: 'Linear' },
            8: { groupDelay: 4.5, rolloff: -48, phase: 'Linear' },
            9: { groupDelay: 5.0, rolloff: -54, phase: 'Linear' },
            10: { groupDelay: 5.5, rolloff: -60, phase: 'Linear' }
        };
        
        return characteristics[order] || { groupDelay: order * 0.5, rolloff: -6 * order, phase: 'Linear' };
    }
}

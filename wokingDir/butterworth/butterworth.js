// butterworth.js — Butterworth Filter Design and Analysis Tool
// Author: AI Assistant
// License: MIT

// Import the DSP library functions from the minified version
// Note: This will be loaded via script tag in the HTML file

// Access the global DSP library
let IIRDesigner, ZDomain, C;

// Wait for DSP library to be available
function initializeDSPLibrary() {
    if (window.DSPFilterLibrary) {
        ({ IIRDesigner, ZDomain, C } = window.DSPFilterLibrary);
        return true;
    }
    return false;
}

/**
 * Butterworth Filter Designer and Analyzer
 * Provides comprehensive Butterworth filter design with visualization capabilities
 */
class ButterworthDesigner {
    constructor() {
        this.currentFilter = null;
        this.fs = 44100; // Default sampling frequency
    }

    /**
     * Design a Butterworth filter
     * @param {string} type - Filter type: 'lowpass', 'highpass', 'bandpass', 'bandstop'
     * @param {number|Array} cutoff - Cutoff frequency(ies) in Hz
     * @param {number} order - Filter order
     * @param {number} fs - Sampling frequency in Hz
     * @returns {Object} Filter coefficients and metadata
     */
    designFilter(type, cutoff, order, fs = 44100) {
        this.fs = fs;
        
        // Check if DSP library is available
        if (!initializeDSPLibrary()) {
            throw new Error('DSP library not loaded. Please wait and try again.');
        }
        
        try {
            const result = IIRDesigner.butterworth(type, cutoff, fs, order);
            this.currentFilter = {
                type: type,
                cutoff: cutoff,
                order: order,
                fs: fs,
                b: result.b,
                a: result.a,
                sections: result.sections || []
            };
            return this.currentFilter;
        } catch (error) {
            throw new Error(`Filter design failed: ${error.message}`);
        }
    }

    /**
     * Calculate frequency response
     * @param {number} N - Number of frequency points
     * @returns {Object} Frequency response data
     */
    getFrequencyResponse(N = 1024) {
        if (!this.currentFilter) {
            throw new Error('No filter designed yet');
        }

        const { b, a } = this.currentFilter;
        const freqz = ZDomain.freqz(b, a, N);
        
        const frequencies = [];
        const magnitude = [];
        const phase = [];
        
        for (let i = 0; i < N; i++) {
            const f = (i * this.fs) / (2 * N);
            frequencies.push(f);
            magnitude.push(freqz.mag[i]);
            phase.push(freqz.phase[i] * 180 / Math.PI);
        }

        return {
            frequencies,
            magnitude,
            phase,
            complex: freqz.H
        };
    }

    /**
     * Calculate group delay
     * @param {number} N - Number of frequency points
     * @returns {Object} Group delay data
     */
    getGroupDelay(N = 1024) {
        if (!this.currentFilter) {
            throw new Error('No filter designed yet');
        }

        const { b, a } = this.currentFilter;
        const groupDelayData = ZDomain.groupDelay(b, a, N);
        
        const frequencies = [];
        for (let i = 0; i < N; i++) {
            frequencies.push((i * this.fs) / (2 * N));
        }

        return {
            frequencies,
            groupDelay: groupDelayData.gd
        };
    }

    /**
     * Calculate impulse response
     * @param {number} N - Number of samples
     * @returns {Object} Impulse response data
     */
    getImpulseResponse(N = 256) {
        if (!this.currentFilter) {
            throw new Error('No filter designed yet');
        }

        // Create unit impulse
        const impulse = new Array(N).fill(0);
        impulse[0] = 1;

        // Apply filter using the DSP library
        const response = this.currentFilter.b.length > 0 ? 
            this._applyIIRFilter(impulse) : 
            this._applyFIRFilter(impulse);

        // Create time axis
        const timeSamples = Array.from({length: N}, (_, i) => i);

        return {
            time: timeSamples,
            amplitude: response
        };
    }

    /**
     * Get filter coefficients
     * @returns {Object} Filter coefficients data
     */
    getCoefficients() {
        if (!this.currentFilter) {
            throw new Error('No filter designed yet');
        }

        const { b, a } = this.currentFilter;
        
        // Create coefficient data for plotting
        const bCoeffs = b.map((value, index) => ({ index, value, type: 'b' }));
        const aCoeffs = a.map((value, index) => ({ index, value, type: 'a' }));

        return {
            b: bCoeffs,
            a: aCoeffs,
            bValues: b,
            aValues: a
        };
    }

    /**
     * Apply IIR filter to input signal
     * @param {Array} input - Input signal
     * @returns {Array} Filtered signal
     */
    _applyIIRFilter(input) {
        const { b, a } = this.currentFilter;
        const output = new Array(input.length).fill(0);
        
        for (let n = 0; n < input.length; n++) {
            let sum = 0;
            
            // Feedforward part (b coefficients)
            for (let k = 0; k < b.length && n - k >= 0; k++) {
                sum += b[k] * input[n - k];
            }
            
            // Feedback part (a coefficients, skip a[0] which is 1)
            for (let k = 1; k < a.length && n - k >= 0; k++) {
                sum -= a[k] * output[n - k];
            }
            
            output[n] = sum;
        }
        
        return output;
    }

    /**
     * Apply FIR filter to input signal
     * @param {Array} input - Input signal
     * @returns {Array} Filtered signal
     */
    _applyFIRFilter(input) {
        const { b } = this.currentFilter;
        const output = new Array(input.length).fill(0);
        
        for (let n = 0; n < input.length; n++) {
            let sum = 0;
            for (let k = 0; k < b.length && n - k >= 0; k++) {
                sum += b[k] * input[n - k];
            }
            output[n] = sum;
        }
        
        return output;
    }

    /**
     * Get poles and zeros for z-plane plot
     * @returns {Object} Poles and zeros data
     */
    getPolesAndZeros() {
        if (!this.currentFilter) {
            throw new Error('No filter designed yet');
        }

        const { b, a } = this.currentFilter;
        
        // Find roots of numerator (zeros) and denominator (poles)
        const zeros = this.findRoots(b);
        const poles = this.findRoots(a);
        
        return {
            zeros: zeros,
            poles: poles,
            unitCircle: this.generateUnitCircle()
        };
    }

    /**
     * Find roots of polynomial using Durand-Kerner method
     * @param {Array} coeffs - Polynomial coefficients
     * @returns {Array} Array of complex roots
     */
    findRoots(coeffs) {
        const n = coeffs.length - 1;
        if (n === 0) return [];
        
        // Initial guess for roots
        const roots = [];
        for (let i = 0; i < n; i++) {
            const angle = (2 * Math.PI * i) / n;
            roots.push(C.of(Math.cos(angle), Math.sin(angle)));
        }
        
        // Durand-Kerner iteration
        for (let iter = 0; iter < 50; iter++) {
            const newRoots = [];
            for (let i = 0; i < n; i++) {
                let numerator = this.evaluatePolynomial(coeffs, roots[i]);
                let denominator = 1;
                
                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        const diff = C.sub(roots[i], roots[j]);
                        denominator = C.mul(denominator, diff);
                    }
                }
                
                const correction = C.div(numerator, denominator);
                newRoots.push(C.sub(roots[i], correction));
            }
            
            // Check convergence
            let converged = true;
            for (let i = 0; i < n; i++) {
                const diff = C.sub(newRoots[i], roots[i]);
                if (Math.abs(diff.re) > 1e-10 || Math.abs(diff.im) > 1e-10) {
                    converged = false;
                    break;
                }
            }
            
            roots.splice(0, n, ...newRoots);
            if (converged) break;
        }
        
        return roots;
    }

    /**
     * Evaluate polynomial at complex point
     * @param {Array} coeffs - Polynomial coefficients
     * @param {ComplexNum} z - Complex point
     * @returns {ComplexNum} Polynomial value
     */
    evaluatePolynomial(coeffs, z) {
        let result = C.of(0, 0);
        let zPower = C.of(1, 0);
        
        for (let i = coeffs.length - 1; i >= 0; i--) {
            result = C.add(result, C.mul(C.of(coeffs[i], 0), zPower));
            if (i > 0) {
                zPower = C.mul(zPower, z);
            }
        }
        
        return result;
    }

    /**
     * Generate unit circle points for z-plane plot
     * @returns {Array} Unit circle points
     */
    generateUnitCircle() {
        const points = [];
        const n = 100;
        for (let i = 0; i <= n; i++) {
            const angle = (2 * Math.PI * i) / n;
            points.push({
                re: Math.cos(angle),
                im: Math.sin(angle)
            });
        }
        return points;
    }

    /**
     * Get filter specifications
     * @returns {Object} Filter specifications
     */
    getFilterSpecs() {
        if (!this.currentFilter) {
            return null;
        }

        const { type, cutoff, order, fs } = this.currentFilter;
        
        return {
            type: type,
            cutoff: cutoff,
            order: order,
            fs: fs,
            nyquist: fs / 2,
            normalizedCutoff: Array.isArray(cutoff) ? 
                cutoff.map(f => f / (fs / 2)) : 
                cutoff / (fs / 2)
        };
    }

    /**
     * Calculate filter characteristics
     * @returns {Object} Filter characteristics
     */
    getFilterCharacteristics() {
        if (!this.currentFilter) {
            return null;
        }

        const freqResponse = this.getFrequencyResponse();
        const { magnitude, phase } = freqResponse;
        
        // Find -3dB point
        const targetDb = -3;
        let minus3dbFreq = null;
        for (let i = 0; i < magnitude.length - 1; i++) {
            if (magnitude[i] >= targetDb && magnitude[i + 1] < targetDb) {
                // Linear interpolation
                const t = (targetDb - magnitude[i]) / (magnitude[i + 1] - magnitude[i]);
                minus3dbFreq = freqResponse.frequencies[i] + t * (freqResponse.frequencies[i + 1] - freqResponse.frequencies[i]);
                break;
            }
        }

        // Find passband ripple
        const passbandEnd = Math.min(this.currentFilter.cutoff * 1.5, this.fs / 2);
        const passbandEndIndex = Math.floor((passbandEnd / (this.fs / 2)) * magnitude.length);
        const passbandMagnitude = magnitude.slice(0, passbandEndIndex);
        const passbandRipple = Math.max(...passbandMagnitude) - Math.min(...passbandMagnitude);

        return {
            minus3dbFreq: minus3dbFreq,
            passbandRipple: passbandRipple,
            dcGain: magnitude[0],
            nyquistGain: magnitude[magnitude.length - 1]
        };
    }
}

/**
 * Utility functions for plotting and visualization
 */
class PlotUtils {
    /**
     * Create data for magnitude response plot
     * @param {Object} freqResponse - Frequency response data
     * @param {number} minFreq - Minimum frequency to display
     * @param {number} maxFreq - Maximum frequency to display
     * @returns {Object} Plot data
     */
    static createMagnitudePlot(freqResponse, minFreq = 1, maxFreq = null) {
        const { frequencies, magnitude } = freqResponse;
        const maxF = maxFreq || Math.max(...frequencies);
        
        const plotData = [];
        for (let i = 0; i < frequencies.length; i++) {
            if (frequencies[i] >= minFreq && frequencies[i] <= maxF) {
                plotData.push({
                    x: frequencies[i],
                    y: magnitude[i]
                });
            }
        }
        
        return {
            data: plotData,
            xLabel: 'Frequency (Hz)',
            yLabel: 'Magnitude (Linear)',
            title: 'Frequency Response - Magnitude'
        };
    }

    /**
     * Create data for phase response plot
     * @param {Object} freqResponse - Frequency response data
     * @param {number} minFreq - Minimum frequency to display
     * @param {number} maxFreq - Maximum frequency to display
     * @returns {Object} Plot data
     */
    static createPhasePlot(freqResponse, minFreq = 1, maxFreq = null) {
        const { frequencies, phase } = freqResponse;
        const maxF = maxFreq || Math.max(...frequencies);
        
        const plotData = [];
        for (let i = 0; i < frequencies.length; i++) {
            if (frequencies[i] >= minFreq && frequencies[i] <= maxF) {
                plotData.push({
                    x: frequencies[i],
                    y: phase[i]
                });
            }
        }
        
        return {
            data: plotData,
            xLabel: 'Frequency (Hz)',
            yLabel: 'Phase (degrees)',
            title: 'Frequency Response - Phase'
        };
    }

    /**
     * Create data for z-plane plot
     * @param {Object} polesZeros - Poles and zeros data
     * @returns {Object} Plot data
     */
    static createZPlanePlot(polesZeros) {
        const { zeros, poles, unitCircle } = polesZeros;
        
        return {
            unitCircle: unitCircle,
            zeros: zeros.map(z => ({ x: z.re, y: z.im })),
            poles: poles.map(p => ({ x: p.re, y: p.im })),
            xLabel: 'Real',
            yLabel: 'Imaginary',
            title: 'Z-Plane - Poles and Zeros'
        };
    }

    /**
     * Create data for group delay plot
     * @param {Object} groupDelayData - Group delay data
     * @param {number} minFreq - Minimum frequency to display
     * @param {number} maxFreq - Maximum frequency to display
     * @returns {Object} Plot data
     */
    static createGroupDelayPlot(groupDelayData, minFreq = 1, maxFreq = null) {
        const { frequencies, groupDelay } = groupDelayData;
        const maxF = maxFreq || Math.max(...frequencies);
        
        const plotData = [];
        for (let i = 0; i < frequencies.length; i++) {
            if (frequencies[i] >= minFreq && frequencies[i] <= maxF) {
                plotData.push({
                    x: frequencies[i],
                    y: groupDelay[i]
                });
            }
        }
        
        return {
            data: plotData,
            xLabel: 'Frequency (Hz)',
            yLabel: 'Group Delay (samples)',
            title: 'Group Delay'
        };
    }
}

// Export default designer instance
const butterworthDesigner = new ButterworthDesigner();

// Make classes available globally
window.ButterworthDesigner = ButterworthDesigner;
window.PlotUtils = PlotUtils;
window.butterworthDesigner = butterworthDesigner;

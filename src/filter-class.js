// filter-class.js — Main Filter class and operations
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { ComplexNum as C } from './complex.js';
import { FIRDesigner } from './fir.js';
import { IIRDesigner } from './iir.js';
import { ZDomain } from './zdomain.js';

export class Filter {
    constructor(b, a = [1], sections = []) {
        if (Math.abs(a[0] - 1) > 1e-12) {
            b = b.map(v => v / a[0]);
            a = a.map(v => v / a[0]);
        }
        this.b = b.slice();
        this.a = a.slice();
        this.sections = (sections || []).map(s => ({ b: s.b.slice(), a: [1, s.a[1], s.a[2]] }));

        if (this.sections.length > 0) {
            this._sosState = this.sections.map(() => ({ w1: 0, w2: 0 }));
        } else if (this.a.length === 1) {
            this._firIdx = 0;
            this._firBuf = new Array(this.b.length).fill(0);
        } else {
            const N = Math.max(this.b.length, this.a.length) - 1;
            this._iirW = new Array(N).fill(0);
        }
    }

    reset() {
        if (this._sosState) this._sosState.forEach(s => { s.w1 = 0; s.w2 = 0; });
        if (this._firBuf) this._firBuf.fill(0), this._firIdx = 0;
        if (this._iirW) this._iirW.fill(0);
    }

    processSample(x) {
        if (this.sections.length > 0) {
            let v = x;
            for (let i = 0; i < this.sections.length; i++) {
                const { b, a } = this.sections[i];
                const st = this._sosState[i];
                const w0 = v - a[1]*st.w1 - a[2]*st.w2;
                const y0 = b[0]*w0 + b[1]*st.w1 + b[2]*st.w2;
                st.w2 = st.w1; st.w1 = w0;
                v = y0;
            }
            return v;
        }

        if (this.a.length === 1) {
            this._firBuf[this._firIdx] = x;
            let y = 0, idx = this._firIdx;
            for (let k = 0; k < this.b.length; k++) {
                y += this.b[k] * this._firBuf[idx];
                idx = (idx - 1 + this._firBuf.length) % this._firBuf.length;
            }
            this._firIdx = (this._firIdx + 1) % this._firBuf.length;
            return y;
        }

        let wn = x;
        for (let k = 1; k < this.a.length; k++) wn -= this.a[k] * (this._iirW[k-1] || 0);
        let yn = this.b[0]*wn;
        for (let k = 1; k < this.b.length; k++) yn += (this._iirW[k-1] || 0) * this.b[k];
        for (let k = this._iirW.length-1; k > 0; k--) this._iirW[k] = this._iirW[k-1];
        this._iirW[0] = wn;
        return yn;
    }

    applySignal(x) {
        const y = new Array(x.length);
        for (let i=0;i<x.length;i++) y[i] = this.processSample(x[i]);
        return y;
    }

    frequencyResponse(fs, N = 1024) {
        const fr = ZDomain.freqz(this.b, this.a, N);
        const f = fr.w.map(w => w * fs / (2*Math.PI));
        return { f, mag: fr.mag, phase: fr.phase, H: fr.H };
    }

    toJSON(){ 
        return { b: this.b.slice(), a: this.a.slice() }; 
    }

    static fromTF(b,a){ 
        return new Filter(b,a); 
    }
    
    static designFIR(kind, cutoffHz, fs, order, window='hann'){
        const tf = FIRDesigner.design(kind, cutoffHz, fs, order, window);
        return new Filter(tf.b, tf.a);
    }
    
    static designButter(kind, cutoffHz, fs, order){
        const result = IIRDesigner.butterworth(kind, cutoffHz, fs, order);
        return new Filter(result.b, result.a, result.sections);
    }
    
    static designCheby1(kind, cutoffHz, fs, order, rp=1){
        const result = IIRDesigner.cheby1(kind, cutoffHz, fs, order, rp);
        return new Filter(result.b, result.a, result.sections);
    }
}

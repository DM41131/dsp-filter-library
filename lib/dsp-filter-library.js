import './core/Complex.js';
import './core/util.js';
import './core/Polynomial.js';
import './core/Roots.js';
import './analog/Prototypes.js';
import './digital/BLT.js';
import './digital/SOS.js';
import './digital/Response.js';
import './fir/Windows.js';
import { FIRDesigner } from './fir/FIRDesigner.js';
import './fir/FIRZeros.js';
import { IIRDesigner } from './iir/IIRDesigner.js';
import './model/FIRFilter.js';
import './model/IIRFilter.js';

// Main FilterDSP class

class FilterDSP {
  static designFIR(spec){ return new FIRDesigner(spec).design(); }
  static designIIR(spec){ return new IIRDesigner(spec).design(); }
}

export { FilterDSP };
//# sourceMappingURL=dsp-filter-library.js.map

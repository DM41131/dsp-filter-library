'use strict';

require('./core/Complex.cjs');
require('./core/util.cjs');
require('./core/Polynomial.cjs');
require('./core/Roots.cjs');
require('./analog/Prototypes.cjs');
require('./digital/BLT.cjs');
require('./digital/SOS.cjs');
require('./digital/Response.cjs');
require('./fir/Windows.cjs');
var fir_FIRDesigner = require('./fir/FIRDesigner.cjs');
require('./fir/FIRZeros.cjs');
var iir_IIRDesigner = require('./iir/IIRDesigner.cjs');
require('./model/FIRFilter.cjs');
require('./model/IIRFilter.cjs');

// Main FilterDSP class

class FilterDSP {
  static designFIR(spec){ return new fir_FIRDesigner.FIRDesigner(spec).design(); }
  static designIIR(spec){ return new iir_IIRDesigner.IIRDesigner(spec).design(); }
}

exports.FilterDSP = FilterDSP;
//# sourceMappingURL=dsp-filter-library.cjs.map

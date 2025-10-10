// Main FilterDSP class
import { FIRDesigner } from "./fir/FIRDesigner.js";
import { IIRDesigner } from "./iir/IIRDesigner.js";

export class FilterDSP {
  static designFIR(spec){ return new FIRDesigner(spec).design(); }
  static designIIR(spec){ return new IIRDesigner(spec).design(); }
}

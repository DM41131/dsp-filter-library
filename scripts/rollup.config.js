// rollup.config.js — Rollup configuration for DSP Filter Library
// Author: Davit Akobia <dav.akobia@gmail.com>
// License: MIT

import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const input = {
  'index': 'src/index.js',
  'dsp-filter-library': 'src/dsp-filter-library.js',
  'core/Complex': 'src/core/Complex.js',
  'core/util': 'src/core/util.js',
  'core/Polynomial': 'src/core/Polynomial.js',
  'core/Roots': 'src/core/Roots.js',
  'analog/Prototypes': 'src/analog/Prototypes.js',
  'digital/BLT': 'src/digital/BLT.js',
  'digital/SOS': 'src/digital/SOS.js',
  'digital/Response': 'src/digital/Response.js',
  'fir/Windows': 'src/fir/Windows.js',
  'fir/FIRDesigner': 'src/fir/FIRDesigner.js',
  'fir/FIRZeros': 'src/fir/FIRZeros.js',
  'iir/IIRDesigner': 'src/iir/IIRDesigner.js',
  'model/FIRFilter': 'src/model/FIRFilter.js',
  'model/IIRFilter': 'src/model/IIRFilter.js'
};

const external = [];

const plugins = [
  nodeResolve({
    preferBuiltins: false
  }),
  commonjs()
];

export default [
  // ESM build
  {
    input,
    output: {
      dir: 'lib',
      format: 'es',
      entryFileNames: '[name].js',
      sourcemap: true
    },
    plugins,
    external
  },
  // CJS build
  {
    input,
    output: {
      dir: 'lib',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      sourcemap: true,
      exports: 'auto'
    },
    plugins,
    external
  },
  // Minified UMD build (single file)
  {
    input: 'src/index.js',
    output: {
      file: 'lib/dsp-filter-library.min.js',
      format: 'umd',
      name: 'DSPFilterLibrary',
      sourcemap: true
    },
    plugins: [
      ...plugins,
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true,
          pure_funcs: ['console.log']
        },
        mangle: {
          toplevel: true
        }
      })
    ],
    external: []
  },
  // Minified ES module build (single file)
  {
    input: 'src/index.js',
    output: {
      file: 'lib/dsp-filter-library.esm.min.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      ...plugins,
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true,
          pure_funcs: ['console.log']
        },
        mangle: {
          toplevel: true
        }
      })
    ],
    external: []
  }
];

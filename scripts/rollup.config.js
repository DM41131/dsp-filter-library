import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const input = {
  'index': 'src/index.js',
  'complex': 'src/complex.js',
  'utils': 'src/utils.js',
  'fft': 'src/fft.js',
  'windows': 'src/windows.js',
  'fir': 'src/fir.js',
  'iir': 'src/iir.js',
  'zdomain': 'src/zdomain.js',
  'filter': 'src/filter-class.js'
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

import { terser } from '@rollup/plugin-terser';

export default [
  {
    input: 'index.js',
    output: {
      file: 'dist/sorcherer.umd.js',
      format: 'umd',
      name: 'Sorcherer',
      globals: {
        three: 'THREE'
      },
      exports: 'named'
    },
    external: ['three']
  },
  {
    input: 'index.js',
    output: {
      file: 'dist/sorcherer.umd.min.js',
      format: 'umd',
      name: 'Sorcherer',
      globals: {
        three: 'THREE'
      },
      exports: 'named'
    },
    external: ['three'],
    plugins: [terser()]
  }
];

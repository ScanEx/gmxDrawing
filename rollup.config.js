import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-porter';

export default [
  {
    input: 'example/drawing.js',
    output: { 
        file: 'public/main.js',
        format: 'iife',
        name: 'Example',
        sourcemap: true,
    },
    plugins: [
        resolve(),
        commonjs(),
        css({ dest: 'public/main.css', minified: false }),
        babel({
            extensions: ['.js', '.mjs'],
            exclude: ['node_modules/@babel/**', 'node_modules/core-js/**'],
            include: ['src/**', 'example/**']
        }),
    ],
  },
  {
    input: pkg.module,
    external: ['leaflet', 'leaflet-geomixer-rollup'],
    output: { 
        file: pkg.main,
        format: 'cjs',        
        sourcemap: true,
        globals: {
          'leaflet': 'L'
        },
    },
    plugins: [
        resolve(),
        commonjs(),
        css({ dest: 'dist/gmx-drawing.css', minified: false }),
        babel({
            extensions: ['.js', '.mjs'],
            exclude: ['node_modules/@babel/**', 'node_modules/core-js/**'],
            include: ['index.js','src/**']
        }),
    ],
  },
];
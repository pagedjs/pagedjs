import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import json from 'rollup-plugin-json';
// import builtins from 'rollup-plugin-node-builtins';
// import globals from 'rollup-plugin-node-globals';

import pkg from './package.json';

import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

const plugins = [
	resolve(),
	commonjs(),
	json(),
	// globals(),
	// builtins(),
	serve({
		port: 9090,
		contentBase: './',
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Service-Worker-Allowed": "/",
		}
	}),
	livereload({
		watch: ['dist', 'examples']
	})
];

export default [
	{
		input: "./src/polyfill/polyfill.js",
		output: {
			name: 'PagedPolyfill',
			file: "./dist/paged.polyfill.js",
			format: 'umd'
		},
		plugins: plugins
	}
];

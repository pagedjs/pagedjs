import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

import pkg from './package.json';

const plugins = [
	resolve(),
	commonjs({
		include: 'node_modules/**'
	}),
	json()
];

export default [
	// browser-friendly UMD build
	{
		input: pkg.module,
		output: {
			name: 'Paged',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: plugins
	},

	{
		input: pkg.module,
		output: {
				name: "PagedModule",
				file: "./dist/paged.esm.js",
				format: 'es'
		},
		plugins: plugins
	},

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

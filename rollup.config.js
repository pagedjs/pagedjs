import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import pkg from './package.json';

const plugins = [
	resolve(),
	commonjs()
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
		output: [
			{
				file: pkg.main,
				format: 'cjs'
			},
		]
	}
];

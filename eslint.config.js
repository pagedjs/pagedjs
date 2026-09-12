import js from "@eslint/js";
import globals from "globals";

export default [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
		},
		rules: {
			"indent": [
				"error",
				"tab",
				{
					"VariableDeclarator": { "var": 2, "let": 2, "const": 3 },
					"SwitchCase": 1,
				},
			],
			"linebreak-style": ["error", "unix"],
			"quotes": ["warn", "double"],
			"semi": ["error", "always"],
			"no-console": ["error", { "allow": ["warn", "error"] }],
			"no-unused-vars": ["error", { "vars": "all", "args": "none" }],
			"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
		},
	},
];

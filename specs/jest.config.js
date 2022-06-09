export default {
	testMatch: ["**/?(*.)(spec).js?(x)"],
	globalSetup: "./jest_helpers/setup.js",
	globalTeardown: "./jest_helpers/teardown.js",
	testEnvironment: "./jest_helpers/puppeteer_environment.js",
	setupFilesAfterEnv: ["./jest_helpers/setup_tests.js"],
	transform: {
		"\\.js$": ["babel-jest", { configFile: "./babel-jest.config.json" }]
	},
};

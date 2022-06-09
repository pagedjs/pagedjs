export default {
	testMatch: ["**/?(*.)(test).js"],
	testEnvironment: "jsdom",
	transform: {
		"\\.js$": ["babel-jest", { configFile: "./babel-jest.config.json" }]
	},
};

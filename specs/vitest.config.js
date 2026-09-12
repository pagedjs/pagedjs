import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["**/*.spec.js"],
		globals: true,
		globalSetup: "./test_helpers/setup.js",
		setupFiles: ["./test_helpers/setup_tests.js"],
		testTimeout: 10000,
		hookTimeout: 30000,
	},
});

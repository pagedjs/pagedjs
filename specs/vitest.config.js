import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		root: __dirname,
		include: ["**/*.spec.js"],
		globals: true,
		globalSetup: [path.join(__dirname, "jest_helpers/setup.js")],
		setupFiles: [path.join(__dirname, "jest_helpers/setup_tests.js")],
		testTimeout: 10000,
	},
});

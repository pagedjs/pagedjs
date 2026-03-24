import { defineConfig } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	testDir: ".",
	testMatch: "**/*.spec.js",
	timeout: 10000,
	globalTimeout: 600000,
	webServer: {
		command: "node test_helpers/server.js",
		cwd: __dirname,
		port: 9999,
		reuseExistingServer: true,
	},
	use: {
		baseURL: "http://localhost:9999",
	},
});

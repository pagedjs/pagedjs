import { defineConfig } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PAGED_SPEC_PORT ?? 9999);

export default defineConfig({
	testDir: ".",
	testMatch: "**/*.spec.js",
	timeout: 10000,
	globalTimeout: 600000,
	forbidOnly: true,
	outputDir: path.join(__dirname, "../test-results/specs"),
	snapshotPathTemplate: path.join(__dirname, "../test-results/pdf/{testFilePath}/{arg}{ext}"),
	webServer: {
		command: "node test_helpers/server.js",
		cwd: __dirname,
		port,
		reuseExistingServer: false,
	},
	use: {
		baseURL: `http://localhost:${port}`,
	},
});

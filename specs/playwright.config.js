import { defineConfig } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfReview = process.env.PAGED_PDF_REVIEW === "true";

export default defineConfig({
	testDir: ".",
	testMatch: ["**/*.spec.js"],
	timeout: 10000,
	globalTimeout: 600000,
	forbidOnly: true,
	outputDir: path.join(__dirname, "../test-results/specs"),
	...(pdfReview && {
		snapshotPathTemplate: path.join(
			__dirname,
			"../test-results/pdf/{testFilePath}/{arg}{ext}",
		),
	}),
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

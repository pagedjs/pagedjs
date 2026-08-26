import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.PAGED_TEST_PORT ?? 8989);

export default defineConfig({
	testDir: ".",
	testMatch: "*.test.js",
	timeout: 15000,
	globalTimeout: 600000,
	workers: 8,
	forbidOnly: true,
	webServer: {
		command: `serve . -p ${PORT} --no-clipboard --symlinks`,
		cwd: "..",
		port: PORT,
		reuseExistingServer: true,
	},
	use: {
		browserName: "chromium",
		headless: true,
		baseURL: `http://localhost:${PORT}`,
	},
	reporter: [["list"]],
});

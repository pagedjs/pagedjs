/**
 * The page each browser case runs in: the import-map harness, with any page
 * error or `console.error` failing the test at teardown. A handler that warns
 * on malformed input asserts on `console.warn`, which is left alone.
 */
import { test as base, expect } from "@playwright/test";

export const test = base.extend({
	page: async ({ page }, use) => {
		const failures = [];
		page.on("pageerror", (error) => failures.push(error.message));
		page.on("console", (message) => {
			if (message.type() === "error") failures.push(message.text());
		});

		await page.goto("/test/harness.html");
		await use(page);

		expect(failures, "Unexpected browser errors").toEqual([]);
	},
});

/**
 * Import a case module into the page and run the one case named `name`.
 *
 * @param {import("@playwright/test").Page} page
 * @param {string} modulePath - Server-absolute path to the case module.
 * @param {string} name
 */
export async function runBrowserCase(page, modulePath, name) {
	await page.evaluate(
		async ({ modulePath, name }) => {
			const suite = await import("/test/browser-suite.js");
			suite.resetSuite();
			await import(modulePath);
			await suite.runCase(name);
		},
		{ modulePath, name },
	);
}

export { expect };

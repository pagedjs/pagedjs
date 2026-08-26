import { test as base, expect } from "@playwright/test";

export { expect };

/**
 * A blank page with an import map for `fragmentainers` and its subpaths,
 * for handler tests that drive Fragmenter directly via page.evaluate().
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		const failures = [];
		page.on("pageerror", (error) => failures.push(error.message));
		page.on("console", (message) => {
			if (message.type() === "error") failures.push(message.text());
		});
		await page.goto("/specs/handlers/harness.html");
		await use(page);
		expect(failures, "Unexpected browser errors").toEqual([]);
	},
});

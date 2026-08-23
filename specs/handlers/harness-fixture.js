import { test as base, expect } from "@playwright/test";

export { expect };

/**
 * A blank page with an import map for `fragmentainers` and its subpaths,
 * for handler tests that drive Fragmenter directly via page.evaluate().
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		page.on("pageerror", (error) => console.error(error));
		await page.goto("/specs/handlers/harness.html");
		await use(page);
	},
});

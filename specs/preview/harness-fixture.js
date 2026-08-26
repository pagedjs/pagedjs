import { test as base, expect } from "@playwright/test";

export { expect };

/**
 * A blank page with the source entry on `window.Paged`, for tests that
 * drive the whole preview pipeline through `PagedPreview`.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		const failures = [];
		page.on("pageerror", (error) => failures.push(error.message));
		page.on("console", (message) => {
			if (message.type() === "error") failures.push(message.text());
		});
		await page.goto("/specs/preview/harness.html");
		await page.waitForFunction(() => window.pagedReady === true);
		await use(page);
		expect(failures, "Unexpected browser errors").toEqual([]);
	},
});

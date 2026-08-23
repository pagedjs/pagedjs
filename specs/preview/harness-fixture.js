import { test as base, expect } from "@playwright/test";

export { expect };

/**
 * A blank page with the built ES bundle on `window.Paged`, for tests that
 * drive the whole preview pipeline through `PagedPreview`.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		page.on("pageerror", (error) => console.error(error));
		await page.goto("/specs/preview/harness.html");
		await page.waitForFunction(() => window.pagedReady === true);
		await use(page);
	},
});

import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG } from "../../test_helpers/constants.js";


test.describe("undisplayed", () => {
	let page;

	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("filters/script-elements/script-elements.html");
	});


	test("script elements should not be appended in the layout", async () => {
		let el = await page.$("#pagedScript");
		expect(el).toBe(null);
	});
});

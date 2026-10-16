import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG } from "../../test_helpers/constants.js";


test.describe("undisplayed", () => {
	let page;

	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("filters/undisplayed/undisplayed.html");
	});


	test("should not break display: none elements to new page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => r.length);
		expect(pages).toBe(2);

		let el = await page.$("#displayNoneStyle");
		expect(el).not.toBe(null);
	});

});

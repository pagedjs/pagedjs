import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG } from "../../test_helpers/constants.js";


test.describe("long table", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("splits/tables/long-table.html");
	});


	// TODO: the following test will put the table on the next page but it should ignore the rule break-inside: avoid because the table does not fit on the next page
	// this issue can be reproduced on v0.1.40
	test.skip("should ignore break-inside:avoid when the element (table) does not fit on a page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => r.length);
		expect(pages).toBe(2);
	});
}
);

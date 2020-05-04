const TIMEOUT = 10000;

describe("long table", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("splits/tables/long-table.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	// TODO: the following test will put the table on the next page but it should ignore the rule break-inside: avoid because the table does not fit on the next page
	// this issue can be reproduced on v0.1.40
	it.skip("should ignore break-inside:avoid when the element (table) does not fit on a page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => r.length);
		expect(pages).toBe(2);
	});
}
);

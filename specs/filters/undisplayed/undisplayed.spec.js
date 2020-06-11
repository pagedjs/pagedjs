const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("undisplayed", () => {
	let page;

	beforeAll(async () => {
		page = await loadPage("filters/undisplayed/undisplayed.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should not break display: none elements to new page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => r.length);
		expect(pages).toBe(2);

		let el = await page.$("#displayNoneStyle");
		expect(el).not.toBe(null);
	});

});

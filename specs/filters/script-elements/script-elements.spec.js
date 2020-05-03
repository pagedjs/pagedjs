const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("undisplayed", () => {
	let page;

	beforeAll(async () => {
		page = await loadPage("filters/script-elements/script-elements.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("script elements should not be appended in the layout", async () => {
		let el = await page.$("#pagedScript");
		expect(el).toBe(null);
	});
});

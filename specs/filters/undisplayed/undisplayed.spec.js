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

	it("display: none elements should not be appended in the layout", async () => {
		let el = await page.$("#displayNoneInlineStyle");
		expect(el).toBe(null);
		el = await page.$("#displayNoneStyle");
		expect(el).toBe(null);
		el = await page.$("#displayNoneWithPageBreak");
		expect(el).not.toBe(null);
	});
});

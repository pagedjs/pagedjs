const TIMEOUT = 10000;

describe("visible inline styles", () => {
	let page;

	beforeAll(async () => {
		page = await loadPage("filters/undisplayed/inline-styles.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("keeps consecutive chapters on separate pages", async () => {
		const chapters = await page.$$eval(".pagedjs_page", (pages) => pages.map((sheet) =>
			Array.from(sheet.querySelectorAll(".chapter"), (chapter) => chapter.textContent.trim())
		));
		expect(chapters).toEqual([["Chapter one"], ["Chapter two"]]);
	});
});

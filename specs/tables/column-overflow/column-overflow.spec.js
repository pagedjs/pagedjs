const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("column-overflow", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("tables/column-overflow/column-overflow.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 2 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	it("page 2 should have wrapped text", async () => {
		let text = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		expect(text).toContain("placeholde1 placeholde2");
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
}
);

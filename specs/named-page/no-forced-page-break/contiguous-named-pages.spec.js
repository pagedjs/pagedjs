const TIMEOUT = 10000;

describe("contiguous-named-pages", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("named-page/no-forced-page-break/contiguous-named-pages.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should not force a page break and render only 1 page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(1);
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
}
);

const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("fractional-pixels", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("breaks/fractional-pixels/fractional-pixels.html");
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

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
}
);

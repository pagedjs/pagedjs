const TIMEOUT = 10000;

describe("stops-rendering-early", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("issues/stops-rendering-early/stops-rendering-early.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 5 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});
		expect(pages).toEqual(5);
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(4);
		});
	}
}
);

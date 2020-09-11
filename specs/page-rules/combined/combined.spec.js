const TIMEOUT = 10000;

describe("combined", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("page-rules/combined/combined.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 1 page", async () => {
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
});

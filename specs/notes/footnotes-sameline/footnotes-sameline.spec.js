const TIMEOUT = 10000;

describe("footnotes-sameline", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("notes/footnotes-sameline/footnotes-sameline.html");
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

	it("should have three callouts on page 1", async () => {
		let callouts = await page.$$eval("[data-page-number='1'] [data-footnote-call]", (r) => r.length);
		expect(callouts).toEqual(3);
	});

	it("should have only 3 footnote on page 1", async () => {
		let callouts = await page.$$eval("[data-page-number='1'] [data-footnote-marker]", (r) => r.length);
		expect(callouts).toEqual(3);
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

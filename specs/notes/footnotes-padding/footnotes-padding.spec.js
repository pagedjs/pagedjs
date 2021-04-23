const TIMEOUT = 10000;

describe("footnotes padding", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("notes/footnotes-padding/footnotes-padding.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 6 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});

	it("cut the footnote on page 1", async () => {
		let textStart = await page.$eval("[data-page-number='1']", (r) => r.textContent);
		expect(textStart).toContain("The Haarlem Legend of the Invention of Printing by");
		expect(textStart).not.toContain("Lourens Janszoon Coster");
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

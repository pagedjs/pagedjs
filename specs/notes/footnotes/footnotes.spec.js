const TIMEOUT = 10000;

describe("footnotes", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("notes/footnotes/footnotes.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 14 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(14);
	});

	it("page 2 footnote", async () => {
		let textContent = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		// callout
		expect(textContent).toContain("Legend");

		// callout
		expect(textContent).toContain("Incunabula");
	});

	it("page 4 long footnote", async () => {
		let textContent = await page.$eval("[data-page-number='4']", (r) => r.textContent);

		// callout
		expect(textContent).toContain("centuries before");

		// footnote
		expect(textContent).toContain("ipse eruditio fiat");
	});

	it("page 5 split footnote", async () => {
		let textContent = await page.$eval("[data-page-number='5']", (r) => r.textContent);

		// callout
		expect(textContent).toContain("Angelo Roccha");

		// footnote
		expect(textContent).toContain("Characteres");
	});

	it("page 6 footnote split from page 5", async () => {
		let textContent = await page.$eval("[data-page-number='6']", (r) => r.textContent);

		// footnote
		expect(textContent).toContain("enim a primis");
	});


	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(2);
			expect(pdf).toMatchPDFSnapshot(3);
			expect(pdf).toMatchPDFSnapshot(4);
		});
	}
}
);

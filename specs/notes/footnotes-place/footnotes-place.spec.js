const TIMEOUT = 10000;

describe("footnotes-place", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("notes/footnotes-place/footnotes-place.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 3 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(3);
	});

	it("should have two callouts on page 1", async () => {
		let callouts = await page.$$eval("[data-page-number='1'] [data-footnote-call]", (r) => r.length);
		expect(callouts).toEqual(2);
	});

	it("should have only one footnote on page 1", async () => {
		let textStart = await page.$eval("[data-page-number='1']", (r) => r.textContent);
		expect(textStart).toContain("Annales Hirsaugienses");
		expect(textStart).not.toContain("Origines");
	});

	it("should place footnote 2 on page 2", async () => {
		let textStart = await page.$eval("[data-page-number='2']", (r) => r.textContent);
		expect(textStart).toContain("Origines");
	});


	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
			expect(pdf).toMatchPDFSnapshot(3);
		});
	}
}
);

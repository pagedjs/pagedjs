const TIMEOUT = 10000;

describe("footnotes lastpage", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("notes/footnotes-lastpage/footnotes-lastpage.html");
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

	it("not display footnote 4 on page 2", async () => {
		let textStart = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		// line
		expect(textStart).toContain("sand-cast bodies");

		// footnote
		expect(textStart).not.toContain("three-line pica");
	});

	it("should display footnote 4 on page 3", async () => {
		let textStart = await page.$eval("[data-page-number='3']", (r) => r.textContent);

		// line
		expect(textStart).not.toContain("sand-cast bodies");

		// footnote
		expect(textStart).toContain("three-line pica");
	});

	it("not display footnote 8 on page 5", async () => {
		let textStart = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		// line
		expect(textStart).toContain("sand-cast bodies");

		// footnote
		expect(textStart).not.toContain("three-line pica");
	});

	it("should display footnote 8 on page 6", async () => {
		let textStart = await page.$eval("[data-page-number='3']", (r) => r.textContent);

		// line
		expect(textStart).not.toContain("sand-cast bodies");

		// footnote
		expect(textStart).toContain("three-line pica");
	});


	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
			expect(pdf).toMatchPDFSnapshot(3);

			expect(pdf).toMatchPDFSnapshot(4);
			expect(pdf).toMatchPDFSnapshot(5);
			expect(pdf).toMatchPDFSnapshot(6);
		});
	}
}
);

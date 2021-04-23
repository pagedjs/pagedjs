const TIMEOUT = 10000;

describe("footnote-policy", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("notes/footnote-policy/footnote-policy.html");
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

	it("display auto footnotes should split text", async () => {
		let textStart = await page.$eval("[data-page-number='1']", (r) => r.textContent);

		expect(textStart).toContain("Characteres");

		let textEnd = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		expect(textEnd).toContain("genus typos me vidisse");
	});

	it("display line footnotes should stay with the callout line", async () => {
		let textStart = await page.$eval("[data-page-number='4']", (r) => r.textContent);

		// line
		expect(textStart).toContain("Strasburg");

		// footnote
		expect(textStart).toContain("Argentoratensi");
	});

	it("display block footnotes should stay with the callout paragraph block", async () => {
		let textStart = await page.$eval("[data-page-number='6']", (r) => r.textContent);

		// paragraph
		expect(textStart).toContain("The legend");

		// footnote
		expect(textStart).toContain("Argentoratensi");
	});


	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(2);
			expect(pdf).toMatchPDFSnapshot(3);
			expect(pdf).toMatchPDFSnapshot(4);
			expect(pdf).toMatchPDFSnapshot(6);
		});
	}
}
);

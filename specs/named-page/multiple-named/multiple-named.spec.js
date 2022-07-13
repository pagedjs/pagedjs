const TIMEOUT = 10000;

describe("multiple-named", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("named-page/multiple-named/multiple-named.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should put contet and preamble on a single page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(1);
	});

	it("should put contet and preamble on a page with a green background", async () => {
		let textColor = await page.$eval("#page-1", (pg) => window.getComputedStyle(pg).backgroundColor);

		expect(textColor).toContain("rgb(0, 128, 0)"); // green
	});



	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
});

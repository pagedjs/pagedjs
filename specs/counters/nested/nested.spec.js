const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("counter-pages", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("counters/nested/nested.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should have a reset and increment on first h1", async () => {
		let text = await page.$eval("[data-page-number='1'] .pagedjs_page_content h1", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel1 1 titleLevel2 0");
	});

	it("should have a increment on first h2", async () => {
		let text = await page.$eval("[data-page-number='1'] .pagedjs_page_content h2", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel2 1");
	});

	it("should have a reset and increment on first h3", async () => {
		let text = await page.$eval("[data-page-number='2'] .pagedjs_page_content h3", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel3 1");
	});

	it("should have a reset and increment on last h1", async () => {
		let text = await page.$eval("[data-page-number='7'] .pagedjs_page_content h1", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel1 1 titleLevel2 -4");
	});

	it("should have a increment on last h2", async () => {
		let text = await page.$eval("[data-page-number='8'] .pagedjs_page_content h2", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel2 1");
	});

	it("should have a reset and increment on last h3", async () => {
		let text = await page.$eval("[data-page-number='8'] .pagedjs_page_content h3", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel3 0");
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(8);
		});
	}
}
);

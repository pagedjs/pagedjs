const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("counter-increment-negative-page", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("target/target-counter/counter-increment-negative-page.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("first page should have a page increment of -1", async () => {
		const counterIncrement = await page.$eval("[data-page-number='1']", (element) => window.getComputedStyle(element).counterIncrement);
		expect(counterIncrement).toEqual("page -1");
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			const pdf = await page.pdf(PDF_SETTINGS);
			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
			expect(pdf).toMatchPDFSnapshot(4);
		});
	}
});

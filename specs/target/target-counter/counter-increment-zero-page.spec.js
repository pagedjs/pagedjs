const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("counter-increment-zero-page", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("target/target-counter/counter-increment-zero-page.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("cover page (first) should have a page increment of 0", async () => {
		const counterIncrement = await page.$eval("[data-page-number='1']", (element) => window.getComputedStyle(element).counterIncrement);
		expect(counterIncrement).toEqual("page 0");
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			const pdf = await page.pdf(PDF_SETTINGS);
			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
			expect(pdf).toMatchPDFSnapshot(3);
			expect(pdf).toMatchPDFSnapshot(5);
		});
	}
});

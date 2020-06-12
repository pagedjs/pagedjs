const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("counter-increment-positive-page", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("target/target-counter/counter-increment-positive-page.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("all pages should have a page increment of 2", async () => {
		const firstPageCounterIncrement = await page.$eval("[data-page-number='1']", (element) => window.getComputedStyle(element).counterIncrement);
		const secondPageCounterIncrement = await page.$eval("[data-page-number='2']", (element) => window.getComputedStyle(element).counterIncrement);
		const thirdPageCounterIncrement = await page.$eval("[data-page-number='3']", (element) => window.getComputedStyle(element).counterIncrement);
		const fourthPageCounterIncrement = await page.$eval("[data-page-number='4']", (element) => window.getComputedStyle(element).counterIncrement);
		expect(firstPageCounterIncrement).toEqual("page 2");
		expect(secondPageCounterIncrement).toEqual("page 2");
		expect(thirdPageCounterIncrement).toEqual("page 2");
		expect(fourthPageCounterIncrement).toEqual("page 2");
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

const TIMEOUT = 10000;

describe("ignore-undisplayed-nodes", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("named-page/no-forced-page-break/ignore-undisplayed-nodes.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should not force a page break after an undisplayed element and render only 2 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await generatePdf("named-page/no-forced-page-break/ignore-undisplayed-nodes.html");

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
});

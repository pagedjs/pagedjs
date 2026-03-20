const TIMEOUT = 10000;

describe("css is awesome", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("hyphens/awesome/awesome.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it.skip("should render 7 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(7);
	});

	it.skip("page 1 should have a hyphen", async () => {
		let text = await page.$eval("[data-page-number='1']", (r) => r.textContent);

		expect(text).toContain("\u2010");
	});

	it.skip("page 5 should NOT have a hyphen", async () => {
		let text = await page.$eval("[data-page-number='5']", (r) => r.textContent);

		expect(text).not.toContain("\u2010");
	});


	if (!DEBUG) {
		it.skip("should create a pdf", async () => {
			let pdf = await generatePdf("hyphens/awesome/awesome.html");

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
}
);

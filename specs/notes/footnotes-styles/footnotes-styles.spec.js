const TIMEOUT = 10000;

describe("footnotes-styles", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("notes/footnotes-styles/footnotes-styles.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 2 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	it("should have three callouts on page 1", async () => {
		let callouts = await page.$$eval("[data-page-number='1'] [data-footnote-call]", (r) => r.length);
		expect(callouts).toEqual(3);
	});

	it("should have red colored callouts", async () => {
		let color = await page.$eval("[data-page-number='1'] [data-footnote-call]", (r) => window.getComputedStyle(r, "::after").color);
		expect(color).toContain("rgb(255, 0, 0)"); // red
	});

	it("should have 30px font-size for callouts", async () => {
		let size = await page.$eval("[data-page-number='1'] [data-footnote-call]", (r) => window.getComputedStyle(r, "::after").fontSize);
		expect(size).toEqual("30px");
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
}
);

const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("in-top-level", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("breaks/in-top-level/in-top-level.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 4 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(4);
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
			expect(pdf).toMatchPDFSnapshot(3);
			expect(pdf).toMatchPDFSnapshot(4);
		});
	}
}
);

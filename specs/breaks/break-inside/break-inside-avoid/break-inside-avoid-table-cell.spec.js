const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("break-inside-avoid-table-cell", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("breaks/break-inside/break-inside-avoid/break-inside-avoid-table-cell.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	xit("should render 2 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	if (!DEBUG) {
		xit("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
});

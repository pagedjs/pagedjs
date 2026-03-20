const TIMEOUT = 10000;

describe("content-none", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("generate-content/content-none/content-none.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 5 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(5);
	});


	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await generatePdf("generate-content/content-none/content-none.html");

			expect(pdf).toMatchPDFSnapshot(3);
			expect(pdf).toMatchPDFSnapshot(4);
		});
	}
}
);

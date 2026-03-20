const TIMEOUT = 10000;

describe("issue", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("margin-boxes/text-align/text-align.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it.skip("should render 6 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});


	if (!DEBUG) {
		it.skip("should create a pdf", async () => {
			let pdf = await generatePdf("margin-boxes/text-align/text-align.html");

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
}
);

const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("infinite-loop", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("infinite-loop/infinite-loop.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	// TODO: the following test will produce an infinite loop (the element cannot fit on a page)
	// this issue can be reproduced on v0.1.40
	it.skip("should render 1 page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => r.length);
		expect(pages).toBe(1);
	});

	if (!DEBUG) {
		it.skip("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);
			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
});

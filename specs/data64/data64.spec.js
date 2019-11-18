const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("default", async () => {
	let page;
	let rendered;
	beforeAll(async () => {
		page = await loadPage("data64/data64.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("pseudo element with data:/image should appear", async () => {
		
		let data = await page.$eval("#test" , (r) => window.getComputedStyle(r, "::before").content);
		
		expect(data).toEqual("url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 54 14'><g fill='none' fill-rule='evenodd' transform='translate(1 1)' stroke-width='.5'><circle cx='6' cy='6' r='6' fill='%23FF5F56' stroke='%23E0443E'></circle><circle cx='26' cy='6' r='6' fill='%23FFBD2E' stroke='%23DEA123'></circle><circle cx='46' cy='6' r='6' fill='%2327C93F' stroke='%231AAB29'></circle></g></svg>\")");
	});

	// if (!DEBUG) {
	// 	it('should create a pdf', async () => {
	// 		let pdf = await page.pdf(PDF_SETTINGS);

	// 		expect(pdf).toMatchPDFSnapshot(1);
	// 	})
	// }
}
);

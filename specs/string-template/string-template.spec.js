const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("string-template", () => {
	let page;

	beforeAll(async () => {
		page = await loadPage("string-template/string-template.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page?.close();
		}
	});

	it("should generate preview from string template", async () => {
		const pdfPreview = await page.$eval("#preview", previewSection => previewSection.innerHTML);
		expect(pdfPreview).toMatchSnapshot();
	});
});

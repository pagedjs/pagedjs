const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("element with position: fixed", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("position-fixed/position-fixed.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("Page 2 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-2 .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	it("Page 3 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-3 .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	it("Page 4 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-4 .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	it("Page 5 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-5 .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	it("Page 2 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-2 .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	it("Page 3 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-3 .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	it("Page 4 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-4 .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	it("Page 5 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-5 .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
}
);

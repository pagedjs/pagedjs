const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("default", () => {
	let page;

	beforeAll(async () => {
		page = await loadPage("math/math.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("math elements should not throw an exception", async () => {
		let count = await page.$$eval("math" , (r) => {
			// eslint-disable-next-line no-console
			return r.length;
		});
		expect(count).toEqual(96);
	});
});

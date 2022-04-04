const TIMEOUT = 10000; // Some book might take longer than this to renderer

// the test for the target counters are problematics as we can’t find a way to find their value without recreating the whole thing in js.
describe("target-counter", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("target/target-counter/target-counter.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("Cross reference should include See p. text", async () => {
		let text = await page.$eval("#ref-call", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("(See p. ");
	});

	it("link to element with ID \"chap2.dot\" must been parsed by the lib", async () => {
		let text = await page.$eval("#dot-id", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("counter");
	});


	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
}
);

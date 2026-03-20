const TIMEOUT = 10000;

describe("lists", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("splits/lists/lists.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should give the first list item on page 1 and number of 1", async () => {
		let itemnum = await page.$eval("[data-page-number='1'] section li:nth-of-type(1)", (r) => {
			return r.getAttribute("data-item-num");
		});

		expect(itemnum).toBe("1");
	});

	it("should give the first list item on page 2 and number of 7", async () => {
		let itemnum = await page.$eval("[data-page-number='2'] section li:nth-of-type(1)", (r) => {
			return r.getAttribute("data-item-num");
		});

		expect(itemnum).toBe("7");
	});

	it("should give the first list item on page 3 no list item style", async () => {
		let item = await page.$eval("[data-page-number='3'] section li:nth-of-type(1)", (r) => {
			return window.getComputedStyle(r)["list-style"];
		});

		expect(item).toContain("none");
	});


	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await generatePdf("splits/lists/lists.html");

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
			expect(pdf).toMatchPDFSnapshot(3);
		});
	}
}
);

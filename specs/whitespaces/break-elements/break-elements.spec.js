const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("break-elements", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("whitespaces/break-elements/break-elements.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should render 2 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	// Note that this test really relies on the PDF matching. It is possible
	// for the element to be there in the DOM but not be displayed (as it is
	// with other tests).
	it("should include point 9", async () => {
		let tenthRowFirstData = await page.$eval("table tr:nth-child(10) td:nth-child(1)", (r) => {
			return r.textContent;
		});

		expect(tenthRowFirstData).toEqual("9.");
	});

	it("should include point 9 on page 1", async () => {
		let point9 = await page.$eval("table tr:nth-child(10) td:nth-child(1)", (r) => {
			let pageId = r.closest(".pagedjs_page").dataset.pageNumber;
			return pageId;
		});

		expect(point9).toEqual("1");
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
}
);

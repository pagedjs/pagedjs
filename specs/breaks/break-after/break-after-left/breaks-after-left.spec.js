const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('break-after-left', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('breaks/break-after/break-after-left/break-after-left.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render 38 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(38);
		})

		it('should render page 4 as left', async () => {
			let isLeft = await page.$eval("[data-page-number='4']", (r) => {
				return r.classList.contains("pagedjs_left_page");
			});

			expect(isLeft).toEqual(true);
		})

		it('page 4 should be Section 2', async () => {
			let text = await page.$eval("[data-page-number='4']", (r) => r.textContent);

			expect(text).toContain('Section 2');
		})

		it('should render page 7 as blank', async () => {
			let isBlank = await page.$eval("[data-page-number='7']", (r) => {
				return r.classList.contains("pagedjs_blank_page");
			});

			expect(isBlank).toEqual(true);
		})

		it('should render page 8 as left', async () => {
			let isLeft = await page.$eval("[data-page-number='8']", (r) => {
				return r.classList.contains("pagedjs_left_page");
			});

			expect(isLeft).toEqual(true);
		})

		it('page 8 should be Section 3', async () => {
			let text = await page.$eval("[data-page-number='8']", (r) => r.textContent);

			expect(text).toContain('Section 3');
		})

		it('page 9 should break after h2', async () => {
			let text = await page.$eval("[data-page-number='9']", (r) => r.textContent);

			expect(text.trim()).toEqual('A - h2 (inline element)');
		})

		it('should render page 10 as left', async () => {
			let isLeft = await page.$eval("[data-page-number='10']", (r) => {
				return r.classList.contains("pagedjs_left_page");
			});

			expect(isLeft).toEqual(true);
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(4);
				expect(pdf).toMatchPDFSnapshot(7);
				expect(pdf).toMatchPDFSnapshot(8);
				expect(pdf).toMatchPDFSnapshot(9);
				expect(pdf).toMatchPDFSnapshot(10);
			})
		}
	}
)

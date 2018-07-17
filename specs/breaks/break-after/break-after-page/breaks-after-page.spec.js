const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('break-after-page', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('breaks/break-after/break-after-page/break-after-page.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render 31 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(31);
		})

		it('should render page 2 as left', async () => {
			let isLeft = await page.$eval("[data-page-number='2']", (r) => {
				return r.classList.contains("pagedjs_left_page");
			});

			expect(isLeft).toEqual(true);
		})

		it('page 3 should be Section 1', async () => {
			let text = await page.$eval("[data-page-number='2']", (r) => r.textContent);

			expect(text).toContain('Section 1');
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

		it('should render page 7 as right', async () => {
			let isRight = await page.$eval("[data-page-number='7']", (r) => {
				return r.classList.contains("pagedjs_right_page");
			});

			expect(isRight).toEqual(true);
		})

		it('page 7 should be Section 3', async () => {
			let text = await page.$eval("[data-page-number='7']", (r) => r.textContent);

			expect(text).toContain('Section 3');
		})

		it('page 8 should break after h2', async () => {
			let text = await page.$eval("[data-page-number='8']", (r) => r.textContent);

			expect(text.trim()).toEqual('A - h2 (inline element)');
		})

		it('should render page 9 as right', async () => {
			let isRight = await page.$eval("[data-page-number='9']", (r) => {
				return r.classList.contains("pagedjs_right_page");
			});

			expect(isRight).toEqual(true);
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(2);
				expect(pdf).toMatchPDFSnapshot(4);
				expect(pdf).toMatchPDFSnapshot(7);
				expect(pdf).toMatchPDFSnapshot(8);
				expect(pdf).toMatchPDFSnapshot(9);
			})
		}
	}
)

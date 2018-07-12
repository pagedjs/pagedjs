const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('break-before-left', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('breaks/break-before/break-before-left/break-before-left.html')
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

		it('should render page 1 as blank', async () => {
			let isBlank = await page.$eval("[data-page-number='1']", (r) => {
				return r.classList.contains("pagedjs_blank_page");
			});

			expect(isBlank).toEqual(true);
		})

		it('should render page 2 as left', async () => {
			let isLeft = await page.$eval("[data-page-number='2']", (r) => {
				return r.classList.contains("pagedjs_left_page");
			});

			expect(isLeft).toEqual(true);
		})

		it('page 2 should be Section', async () => {
			let text = await page.$eval("[data-page-number='2']", (r) => r.textContent);

			expect(text).toContain('Section');
		})

		it('should render page 3 as blank', async () => {
			let isBlank = await page.$eval("[data-page-number='3']", (r) => {
				return r.classList.contains("pagedjs_blank_page");
			});

			expect(isBlank).toEqual(true);
		})

		it('should render page 4 as left', async () => {
			let isLeft = await page.$eval("[data-page-number='4']", (r) => {
				return r.classList.contains("pagedjs_left_page");
			});

			expect(isLeft).toEqual(true);
		})

		it('page 4 should be Section 1', async () => {
			let text = await page.$eval("[data-page-number='4']", (r) => r.textContent);

			expect(text).toContain('Section 1');
		})

		it('should render page 11 as blank', async () => {
			let isBlank = await page.$eval("[data-page-number='11']", (r) => {
				return r.classList.contains("pagedjs_blank_page");
			});

			expect(isBlank).toEqual(true);
		})

		it('page 12 include h2', async () => {
			let text = await page.$eval("[data-page-number='12']", (r) => r.textContent);

			expect(text).toContain('A - h2 (inline element)');
		})

		it('should render page 12 as left', async () => {
			let isLeft = await page.$eval("[data-page-number='12']", (r) => {
				return r.classList.contains("pagedjs_left_page");
			});

			expect(isLeft).toEqual(true);
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(2);
				expect(pdf).toMatchPDFSnapshot(3);
				expect(pdf).toMatchPDFSnapshot(4);
				expect(pdf).toMatchPDFSnapshot(11);
				expect(pdf).toMatchPDFSnapshot(12);
			})
		}
	}
)

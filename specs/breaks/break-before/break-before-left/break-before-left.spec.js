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

		it('should render 36 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(36);
		})

		// it('should render page 1 as blank', async () => {
		// 	let isBlank = await page.$eval("[data-page-number='1']", (r) => {
		// 		return r.classList.contains("pagedjs_blank_page");
		// 	});
		//
		// 	expect(isBlank).toEqual(true);
		// })

		it('should render page 1 as right', async () => {
			let isLeft = await page.$eval("[data-page-number='1']", (r) => {
				return r.classList.contains("pagedjs_right_page");
			});

			expect(isLeft).toEqual(true);
		})

		it('page 1 should be Section', async () => {
			let text = await page.$eval("[data-page-number='1']", (r) => r.textContent);

			expect(text).toContain('Section');
		})

		it('page 2 should be Section 1', async () => {
			let text = await page.$eval("[data-page-number='2']", (r) => r.textContent);

			expect(text).toContain('Section 1');
		})

		it('should render page 7 as blank', async () => {
			let isBlank = await page.$eval("[data-page-number='7']", (r) => {
				return r.classList.contains("pagedjs_blank_page");
			});

			expect(isBlank).toEqual(true);
		})

		it('page 10 include h2', async () => {
			let text = await page.$eval("[data-page-number='10']", (r) => r.textContent);

			expect(text).toContain('A - h2 (inline element)');
		})


		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(2);
				expect(pdf).toMatchPDFSnapshot(7);
				expect(pdf).toMatchPDFSnapshot(10);
			})
		}
	}
)

const TIMEOUT = 10000;

describe('duplicate-headers', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('issues/duplicate-headers/duplicate-headers.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render 6 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(6);
		})

		it('page 1 header should be "chapter"', async () => {
			let text = await page.$eval("[data-page-number='1'] .pagedjs_margin-top-left > .pagedjs_margin-content", (r) => r.textContent);

			expect(text).toContain('chapter');
		})

		it('page 3 header should be "chapter nth"', async () => {
			let text = await page.$eval("[data-page-number='3'] .pagedjs_margin-top-left > .pagedjs_margin-content", (r) => r.textContent);

			expect(text).toContain('chapter nth');
		})

		it('page 4 header should be "chapter left"', async () => {
			let text = await page.$eval("[data-page-number='4'] .pagedjs_margin-top-left > .pagedjs_margin-content", (r) => r.textContent);

			expect(text).toContain('chapter left');
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(3);
				expect(pdf).toMatchPDFSnapshot(4);
			})
		}
	}
)

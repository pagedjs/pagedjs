const TIMEOUT = 10000;

describe('named-page', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('named-page/named-page/named-page.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render 8 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(8);
		})

		it('should not give page 1 a named class', async () => {
			let chapter = await page.$eval("[data-page-number='1']", (r) => {
				return r.classList.contains("pagedjs_chapter_page");
			});

			expect(chapter).toBe(false);
		})

		it('should give the page 3 a named class', async () => {
			let chapter = await page.$eval("[data-page-number='3']", (r) => {
				return r.classList.contains("pagedjs_chapter_page");
			});

			expect(chapter).toBe(true);
		})

		it('should give the page 4 a named class', async () => {
			let chapter = await page.$eval("[data-page-number='4']", (r) => {
				return r.classList.contains("pagedjs_chapter_page");
			});

			expect(chapter).toBe(true);
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

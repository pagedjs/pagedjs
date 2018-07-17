const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('first-page-of-page-group', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('page-selector/page-group/first-page-of-page-group/first-page-of-page-group.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should not give page 1 a named first page class', async () => {
			let chapter = await page.$eval("[data-page-number='1']", (r) => {
				return r.classList.contains("pagedjs_chapter_first_page");
			});

			expect(chapter).toBe(false);
		})

		it('should have a named first page class on page 2', async () => {
			let chapter = await page.$eval("[data-page-number='2']", (r) => {
				return r.classList.contains("pagedjs_chapter_first_page");
			});

			expect(chapter).toBe(true);
		})

		it('should have bottom center text on page 2', async () => {
			let text = await page.$eval("[data-page-number='2'] .pagedjs_margin-bottom-center > .pagedjs_margin-content", (r) => window.getComputedStyle(r, '::after').content);
			expect(text).toContain("first page of the chapter");
		})

		it('should not give page 3 a named first page class', async () => {
			let chapter = await page.$eval("[data-page-number='3']", (r) => {
				return r.classList.contains("pagedjs_chapter_first_page");
			});

			expect(chapter).toBe(false);
		})

		it('should have a named first page class on page 5', async () => {
			let chapter = await page.$eval("[data-page-number='5']", (r) => {
				return r.classList.contains("pagedjs_chapter_first_page");
			});

			expect(chapter).toBe(true);
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(2);
				expect(pdf).toMatchPDFSnapshot(3);
			})
		}
	}
)

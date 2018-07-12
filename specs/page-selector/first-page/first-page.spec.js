const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('first-page', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('page-selector/first-page/first-page.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should have a first page class on page 1', async () => {
			let chapter = await page.$eval("[data-page-number='1']", (r) => {
				return r.classList.contains("pagedjs_first_page");
			});

			expect(chapter).toBe(true);
		})

		it('should not give page 2 a first page class', async () => {
			let chapter = await page.$eval("[data-page-number='2']", (r) => {
				return r.classList.contains("pagedjs_first_page");
			});

			expect(chapter).toBe(false);
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(2);
			})
		}
	}
)

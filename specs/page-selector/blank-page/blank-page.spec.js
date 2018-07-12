const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('blank-page', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('page-selector/blank-page/blank-page.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should have an empty class on page 6', async () => {
			let chapter = await page.$eval("[data-page-number='4']", (r) => {
				return r.classList.contains("pagedjs_blank_page");
			});

			expect(chapter).toBe(true);
		})

		it('should not give page 1 an empty class', async () => {
			let chapter = await page.$eval("[data-page-number='1']", (r) => {
				return r.classList.contains("pagedjs_blank_page");
			});

			expect(chapter).toBe(false);
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(6);
			})
		}
	}
)

const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('page-spread', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('page-selector/page-spread/page-spread.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

    it('should render page 2 as left', async () => {
			let isLeft = await page.$eval("[data-page-number='2']", (r) => {
				return r.classList.contains("pagedjs_left_page");
			});

			expect(isLeft).toEqual(true);
		})

    it('should render page 3 as right', async () => {
      let isRight = await page.$eval("[data-page-number='3']", (r) => {
        return r.classList.contains("pagedjs_right_page");
      });

      expect(isRight).toEqual(true);
    })

		it('should have bottom center text of right on the first page', async () => {
			let text = await page.$eval("[data-page-number='1'] .pagedjs_margin-bottom-center > .pagedjs_margin-content", (r) => window.getComputedStyle(r, '::after').content);
			expect(text).toContain("right");
		})

    it('should have a yellow background on page 6', async () => {
			let color = await page.$eval("[data-page-number='6']", (r) => window.getComputedStyle(r).backgroundColor);
			expect(color).toContain('rgb(255, 255, 0)'); // yellow
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(3);
			})
		}
	}
)

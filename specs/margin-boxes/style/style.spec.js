const TIMEOUT = 10000;

describe('text-align', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('margin-boxes/style/style.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('Render the top-left-corner with a crimson background', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-left-corner", (r) => {
				return window.getComputedStyle(r)["background-color"];
			});

			expect(pages).toEqual("rgb(220, 20, 60)");
		})

		it('Render the left-top with a cornflowerblue border', async () => {
			let pages = await page.$eval(".pagedjs_margin-left-top", (r) => {
				return window.getComputedStyle(r)["border-color"];
			});

			expect(pages).toEqual("rgb(100, 149, 237)");
		})


		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

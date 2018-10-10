const TIMEOUT = 10000;

describe('numbering', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('splits/numbering/numbering.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should give the section 1 paragraph 1 a number of 1', async () => {
			let counter = await page.$eval("[data-page-number='1'] section p:nth-of-type(1)", (r) => {
				return r.getAttribute("data-counter-paragraph-value");
			});

			expect(counter).toBe("1");
		})

		it('should give the section 1 paragraph 2 a number of 2', async () => {
			let counter = await page.$eval("[data-page-number='1'] section p:nth-of-type(2)", (r) => {
				return r.getAttribute("data-counter-paragraph-value");
			});

			expect(counter).toBe("2");
		})

		it('should give the section 1 paragraph 3 a number of 3, on page 2', async () => {
			let counter = await page.$eval("[data-page-number='2'] section p:nth-of-type(2)", (r) => {
				return r.getAttribute("data-counter-paragraph-value");
			});

			expect(counter).toBe("3");
		})


		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(2);
				expect(pdf).toMatchPDFSnapshot(4);
			})
		}
	}
)

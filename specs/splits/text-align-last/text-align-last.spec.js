const TIMEOUT = 10000;

describe('text-align-last', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('splits/text-align-last/text-align-last.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should give the first paragraph on page 1 a text-align-last of justify', async () => {
			let align = await page.$eval("[data-page-number='1'] section p:nth-of-type(1)", (r) => {
				return window.getComputedStyle(r)["text-align-last"];
			});

			expect(align).toBe("justify");
		})

    it('should give the first paragraph on page 2 a text-align-last of auto', async () => {
      let align = await page.$eval("[data-page-number='2'] section p:nth-of-type(1)", (r) => {
        return window.getComputedStyle(r)["text-align-last"];
      });

      expect(align).toBe("auto");
    })

    it('should give the first paragraph on page 3 a text-align-last of auto', async () => {
			let align = await page.$eval("[data-page-number='3'] section p:nth-of-type(1)", (r) => {
				return window.getComputedStyle(r)["text-align-last"];
			});

			expect(align).toBe("auto");
		})

    it('should give the first paragraph on page 4 a text-align-last of auto', async () => {
      let align = await page.$eval("[data-page-number='4'] section p:nth-of-type(1)", (r) => {
        return window.getComputedStyle(r)["text-align-last"];
      });

      expect(align).toBe("auto");
    })




		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(2);
        expect(pdf).toMatchPDFSnapshot(3);
				expect(pdf).toMatchPDFSnapshot(4);
			})
		}
	}
)

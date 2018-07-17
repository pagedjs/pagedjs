const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('spread-of-page-group', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('page-selector/page-group/spread-of-page-group/spread-of-page-group.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should have no background on page 1', async () => {
			let color = await page.$eval("[data-page-number='1']", (r) => window.getComputedStyle(r).backgroundColor);
			expect(color).toContain('rgba(0, 0, 0, 0)'); // transparent
		})

		it('should have a yellow background on page 3', async () => {
			let color = await page.$eval("[data-page-number='3']", (r) => window.getComputedStyle(r).backgroundColor);
			expect(color).toContain('rgb(255, 255, 0)'); // yellow
		})

		it('should have a red background on page 4', async () => {
			let color = await page.$eval("[data-page-number='4']", (r) => window.getComputedStyle(r).backgroundColor);
			expect(color).toContain('rgb(255, 0, 0)'); // red
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

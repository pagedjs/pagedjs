const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('target-counter', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('target/target-counter/target-counter.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('Cross reference should include See p. text', async () => {
			let text = await page.$eval("#ref-call", (r) => window.getComputedStyle(r, '::after').content);
			expect(text).toContain("(See p. ");
		})


		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

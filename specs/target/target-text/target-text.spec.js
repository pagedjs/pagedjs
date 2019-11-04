const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('target-text', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('target/target-text/target-text.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('Table of content should include chapter titles', async () => {
			let text = await page.$eval("nav li:first-of-type a" , (r) => window.getComputedStyle(r, '::after').content);
			expect(text).toContain("Lorem ipsum dolor sit amet");
		})


		// if (!DEBUG) {
		// 	it('should create a pdf', async () => {
		// 		let pdf = await page.pdf(PDF_SETTINGS);

		// 		expect(pdf).toMatchPDFSnapshot(1);
		// 	})
		// }
	}
)

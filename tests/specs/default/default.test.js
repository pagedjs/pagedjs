const path = require('path');
const gs = require('ghostscript4js')
const fs = require('fs');
const { toMatchImageSnapshot } = require('jest-image-snapshot');
const rimraf = require('rimraf');

const timeout = 10000;
const handleError = (error) => {
	console.error(error);
};

describe('break', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			expect.extend({ toMatchImageSnapshot });

			page = await browser.newPage()
			page.addListener('pageerror', handleError);
			page.addListener('error', handleError);
			let renderedResolve;
			rendered = new Promise(function(resolve) {
				renderedResolve = resolve;
			});
			await page.exposeFunction('onPagesRendered', (msg, width, height, orientation) => {
				renderedResolve(msg, width, height, orientation);
			});
			await page.goto(global.origin+'/tests/specs/default/default.html', { waitUntil: 'networkidle2' });

			return rendered;
		}, timeout)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render text', async () => {
			let text = await page.evaluate(() => document.body.textContent);
			expect(text).toContain('Chapter 1. Loomings.');
		})

		it('should render 1 page', async () => {
			let pages = await page.$$eval(".pages", (r) => r.length);
			expect(pages).toBe(1);
		})

		it('should create a pdf', async () => {
			let outputPath = path.join(__dirname, './output.pdf');
			let pdf = await page.pdf({
					path: outputPath,
					printBackground: true,
					displayHeaderFooter: false,
					margin: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					}
					// format: 'A4'
				}).catch((e) => {
					console.error(e);
				});

			// Output an image from the pdf
			let pdfImage;
			try {
				// create image
				let imagePath = path.join(__dirname, './output.png');
				let page = 1;
				gs.executeSync(`-dFirstPage=${page} -dLastPage=${page} -sDEVICE=pngalpha -o ${imagePath} -sDEVICE=pngalpha -r144 ${outputPath}`)
				// load image
				pdfImage = fs.readFileSync(imagePath);
				// remove output
				if (!DEBUG) {
					rimraf.sync(imagePath);
					rimraf.sync(outputPath);
				}
			} catch (err) {
			  throw err
			}

			expect(pdfImage).toMatchImageSnapshot();
		})
	}
)

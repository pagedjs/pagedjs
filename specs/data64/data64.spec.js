import { test, expect } from "../test_helpers/fixtures.js";
import { DEBUG } from "../test_helpers/constants.js";


test.describe("default", () => {
	let page;

	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("data64/data64.html");
	});


	test("pseudo element using content with url(\"data:image/svg+xml,<svg>...<.svg>\") function should appear", async () => {
		let data = await page.$eval("#stringSVGDoubleQuotes" , (r) => window.getComputedStyle(r, "::before").content);
		expect(data).toEqual("url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 54 14'><g fill='none' fill-rule='evenodd' transform='translate(1 1)' stroke-width='.5'><circle cx='6' cy='6' r='6' fill='%23FF5F56' stroke='%23E0443E'></circle><circle cx='26' cy='6' r='6' fill='%23FFBD2E' stroke='%23DEA123'></circle><circle cx='46' cy='6' r='6' fill='%2327C93F' stroke='%231AAB29'></circle></g></svg>\")");
	});

	test("pseudo element using content with url('data:image/svg+xml,<svg>...<.svg>') function should appear", async () => {
		let data = await page.$eval("#stringSVGSingleQuotes" , (r) => window.getComputedStyle(r, "::before").content);
		expect(data).toEqual("url(\"data:image/svg+xml,<svg xmlns=\\\"http://www.w3.org/2000/svg\\\" viewBox=\\\"0 0 54 14\\\"><g fill=\\\"none\\\" fill-rule=\\\"evenodd\\\" transform=\\\"translate(1 1)\\\" stroke-width=\\\".5\\\"><circle cx=\\\"6\\\" cy=\\\"6\\\" r=\\\"6\\\" fill=\\\"%23FF5F56\\\" stroke=\\\"%23E0443E\\\"></circle><circle cx=\\\"26\\\" cy=\\\"6\\\" r=\\\"6\\\" fill=\\\"%23FFBD2E\\\" stroke=\\\"%23DEA123\\\"></circle><circle cx=\\\"46\\\" cy=\\\"6\\\" r=\\\"6\\\" fill=\\\"%2327C93F\\\" stroke=\\\"%231AAB29\\\"></circle></g></svg>\")");
	});

	test("pseudo element using content with url(data:image/svg+xml;base64,...) function should appear", async () => {
		let data = await page.$eval("#rawBase64" , (r) => window.getComputedStyle(r, "::before").content);
		expect(data).toEqual("url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA1NCAxNCc+PGcgZmlsbD0nbm9uZScgZmlsbC1ydWxlPSdldmVub2RkJyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgxIDEpJyBzdHJva2Utd2lkdGg9Jy41Jz48Y2lyY2xlIGN4PSc2JyBjeT0nNicgcj0nNicgZmlsbD0nI0ZGNUY1Nicgc3Ryb2tlPScjRTA0NDNFJz48L2NpcmNsZT48Y2lyY2xlIGN4PScyNicgY3k9JzYnIHI9JzYnIGZpbGw9JyNGRkJEMkUnIHN0cm9rZT0nI0RFQTEyMyc+PC9jaXJjbGU+PGNpcmNsZSBjeD0nNDYnIGN5PSc2JyByPSc2JyBmaWxsPScjMjdDOTNGJyBzdHJva2U9JyMxQUFCMjknPjwvY2lyY2xlPjwvZz48L3N2Zz4=\")");
	});
});

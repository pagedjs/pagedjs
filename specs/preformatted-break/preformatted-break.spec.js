describe("preformatted indentation across pages", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("preformatted-break/preformatted-break.html");
		await page.rendered;
	}, 10000);

	afterAll(async () => {
		await page.close();
	});

	it("keeps the complete source text", async () => {
		let text = await page.$$eval(".pagedjs_page .code-block", blocks => blocks.map(block => block.textContent).join(""));
		expect(text).toBe("function demo() {\n    let x;\n    let y;\n    let z;\n    return x + y + z;\n}");
	});

	it("keeps indentation on the continuation page", async () => {
		let parts = await page.$$eval(".pagedjs_page .code-block", blocks => blocks.map(block => block.textContent));
		expect(parts).toHaveLength(2);
		expect(parts[1]).toMatch(/^ {4}let /);
	});

	it("draws the continuation four spaces from the code block edge", async () => {
		let position = await page.evaluate(() => {
			let blocks = document.querySelectorAll(".pagedjs_page .code-block");
			let block = blocks[1];
			let node = block.querySelector("code").firstChild;
			let offset = node.textContent.search(/\S/);
			let range = document.createRange();
			range.setStart(node, offset);
			range.setEnd(node, offset + 1);
			let canvas = document.createElement("canvas");
			let context = canvas.getContext("2d");
			context.font = window.getComputedStyle(block).font;
			return {
				actual: range.getBoundingClientRect().left - block.getBoundingClientRect().left,
				expected: context.measureText("    ").width
			};
		});
		expect(position.actual).toBeCloseTo(position.expected, 1);
	});
});

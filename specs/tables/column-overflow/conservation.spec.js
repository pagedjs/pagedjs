import { test, expect } from "@playwright/test";

test("column-overflow conserves cells across two completed pages", async ({ page }, testInfo) => {
	await page.addInitScript(() => { window.PagedConfig = { auto: false }; });
	await page.goto("/specs/tables/column-overflow/column-overflow.html");
	try {
		const result = await page.evaluate(async () => {
			const { PagedPreview, Fragmenter } = window.Paged;
			const normalize = (text) => text.replace(/\s+/g, " ").trim();
			const source = document.querySelector("section");
			const sourceCells = Array.from(source.querySelectorAll("tbody td"), (cell, i) => {
				cell.dataset.sourceCell = String(i);
				return cell.textContent.match(/\S+/g) || [];
			});
			const originalNext = Fragmenter.prototype.next;
			let calls = 0;
			let completed = false;
			Fragmenter.prototype.next = function () {
				if (calls >= 8) throw new Error("Table did not complete within eight next() calls");
				calls++;
				const result = originalNext.call(this);
				completed ||= result.done;
				return result;
			};
			const previewer = new PagedPreview();
			window.tableReviewPreview = previewer;
			try {
				await previewer.preview(source, undefined, document.body);
			} finally {
				Fragmenter.prototype.next = originalNext;
			}
			await Promise.all(previewer.pages.map((sheet) => sheet.updateComplete));
			const pages = previewer.pages.map((sheet) => {
				const area = sheet.shadowRoot.querySelector(".page-area").getBoundingClientRect();
				const rectangles = [];
				const walker = document.createTreeWalker(sheet.querySelector("table"), NodeFilter.SHOW_TEXT);
				while (walker.nextNode()) {
					if (!walker.currentNode.textContent.trim()) continue;
					const range = document.createRange();
					range.selectNodeContents(walker.currentNode);
					for (const rect of range.getClientRects()) {
						if (rect.width > 0 && rect.height > 0) rectangles.push(rect.toJSON());
					}
				}
				return {
					area: area.toJSON(), rectangles,
					header: Array.from(sheet.querySelectorAll("thead th"), (cell) => normalize(cell.textContent)),
					body: normalize(sheet.querySelector("tbody")?.textContent || ""),
				};
			});
			return {
				completed, calls,
				finalTokenNull: previewer.currentFlow.fragments.at(-1)?.breakToken === null,
				sourceCells,
				outputCells: sourceCells.map((_, i) => Array.from(
					previewer.querySelectorAll(`[data-source-cell="${i}"]`),
					(cell) => cell.textContent.match(/\S+/g) || [],
				).flat()),
				pages,
			};
		});
		await testInfo.attach("table-layout", {
			body: JSON.stringify(result, null, 2), contentType: "application/json",
		});
		expect(result.completed).toBe(true);
		expect(result.finalTokenNull).toBe(true);
		expect.soft(result.pages).toHaveLength(2);
		expect.soft(result.pages[0].body).not.toBe("");
		expect.soft(result.pages[1].body).toContain("placeholde1 placeholde2");
		expect(result.outputCells).toEqual(result.sourceCells);
		for (const sheet of result.pages) {
			expect(sheet.header).toEqual(["No", "Title"]);
			expect(sheet.rectangles.length).toBeGreaterThan(0);
			for (const rect of sheet.rectangles) {
				expect(rect.left).toBeGreaterThanOrEqual(sheet.area.left - 1);
				expect(rect.top).toBeGreaterThanOrEqual(sheet.area.top - 1);
				expect(rect.right).toBeLessThanOrEqual(sheet.area.right + 1);
				expect(rect.bottom).toBeLessThanOrEqual(sheet.area.bottom + 1);
			}
		}
	} finally {
		try {
			const sheets = page.locator("paged-page");
			for (let i = 0; i < await sheets.count(); i++) {
				await testInfo.attach(`page-${i + 1}`, {
					body: await sheets.nth(i).screenshot(), contentType: "image/png",
				});
			}
		} finally {
			await page.evaluate(() => window.tableReviewPreview?.destroy());
		}
	}
});

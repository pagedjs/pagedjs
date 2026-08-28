import { test, expect } from "./harness-fixture.js";

const PAGE_CSS = "@page { size: 300px 200px; margin: 10px; } p { margin: 0; }";

test.describe("PagedPreview flow lifecycle", () => {
	test("beforeFlow runs on the normalized fragment before layout and its mutations render", async ({
		page,
	}) => {
		const result = await page.evaluate(async (css) => {
			const { PagedPreview } = window.Paged;
			const previewer = new PagedPreview();
			let sawFragment = false;
			previewer.hooks.beforeFlow.register((fragment) => {
				sawFragment = fragment instanceof DocumentFragment;
				fragment.querySelector("p").setAttribute("data-hooked", "");
			});
			await previewer.preview("<p>hello</p>", [{ css }], document.body);
			const hooked = previewer.querySelector("p[data-hooked]") !== null;
			previewer.destroy();
			return { sawFragment, hooked };
		}, PAGE_CSS);
		expect(result.sawFragment).toBe(true);
		expect(result.hooked).toBe(true);
	});

	test("flow(content) renders the supplied content, not stale content", async ({ page }) => {
		const result = await page.evaluate(async (css) => {
			const { PagedPreview } = window.Paged;
			const previewer = new PagedPreview();
			await previewer.preview("<p>first</p>", [{ css }], document.body);
			const firstText = previewer.textContent.trim();
			await previewer.flow("<p>second</p>", [{ css }]);
			const secondText = previewer.textContent.trim();
			previewer.destroy();
			return { firstText, secondText };
		}, PAGE_CSS);
		expect(result.firstText).toContain("first");
		expect(result.secondText).toContain("second");
		expect(result.secondText).not.toContain("first");
	});

	test("a re-render destroys the prior flow; destroy() destroys the current one", async ({
		page,
	}) => {
		const result = await page.evaluate(async (css) => {
			const { PagedPreview, Fragmenter } = window.Paged;
			const PseudoElements = Fragmenter.handlers.find((h) => h.name === "PseudoElements");
			const previewer = new PagedPreview();
			await previewer.preview("<p>one</p>", [{ css }], document.body);
			const first = previewer.currentFlow;
			const firstHadHandlers = first.handlers.get(PseudoElements) !== null;
			await previewer.flow("<p>two</p>", [{ css }]);
			const second = previewer.currentFlow;
			const firstDestroyed = first.handlers.get(PseudoElements) === null;
			const secondAlive = second.handlers.get(PseudoElements) !== null;
			previewer.destroy();
			const secondDestroyed = second.handlers.get(PseudoElements) === null;
			return {
				distinct: first !== second,
				firstHadHandlers,
				firstDestroyed,
				secondAlive,
				secondDestroyed,
				cleared: previewer.currentFlow === null,
			};
		}, PAGE_CSS);
		expect(result.distinct).toBe(true);
		expect(result.firstHadHandlers).toBe(true);
		expect(result.firstDestroyed).toBe(true);
		expect(result.secondAlive).toBe(true);
		expect(result.secondDestroyed).toBe(true);
		expect(result.cleared).toBe(true);
	});

	test("two previewers render concurrently with independent handler instances", async ({
		page,
	}) => {
		const result = await page.evaluate(async (css) => {
			const { PagedPreview, Fragmenter } = window.Paged;
			const PseudoElements = Fragmenter.handlers.find((h) => h.name === "PseudoElements");
			const a = new PagedPreview();
			const b = new PagedPreview();
			await Promise.all([
				a.preview("<p>alpha</p><p>alpha</p>", [{ css }], document.body),
				b.preview("<p>beta</p>", [{ css }], document.body),
			]);
			const ha = a.currentFlow.handlers.get(PseudoElements);
			const hb = b.currentFlow.handlers.get(PseudoElements);
			const res = {
				aPages: a.pages.length,
				bPages: b.pages.length,
				bothAlive: ha !== null && hb !== null,
				distinct: ha !== hb,
				aText: a.textContent,
				bText: b.textContent,
			};
			a.destroy();
			b.destroy();
			return res;
		}, PAGE_CSS);
		expect(result.aPages).toBeGreaterThan(0);
		expect(result.bPages).toBeGreaterThan(0);
		expect(result.bothAlive).toBe(true);
		expect(result.distinct).toBe(true);
		expect(result.aText).toContain("alpha");
		expect(result.bText).toContain("beta");
		expect(result.bText).not.toContain("alpha");
	});
});

test.describe("pagedjs handlers in the catalog", () => {
	test("the package entry appends Footnote once", async ({ page }) => {
		const result = await page.evaluate(() => {
			const { Fragmenter, Footnote, pagedHandlers } = window.Paged;
			const count = Fragmenter.handlers.filter((h) => h === Footnote).length;
			return { count, listed: pagedHandlers.includes(Footnote) };
		});
		expect(result.count).toBe(1);
		expect(result.listed).toBe(true);
	});

	test("pagedHandlers lists every handler the package registers", async ({ page }) => {
		const names = await page.evaluate(() =>
			window.Paged.pagedHandlers.map((Handler) => Handler.name),
		);
		expect(names).toEqual([
			"Footnote",
			"PageCounter",
			"NamedStrings",
			"RunningElements",
			"TargetText",
			"TargetCounters",
		]);
	});

	test("float: footnote renders a footnote area through PagedPreview", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { PagedPreview } = window.Paged;
			const css =
				"@page { size: 400px 400px; margin: 0; } p { margin: 0; } .fn { float: footnote; }";
			const previewer = new PagedPreview();
			await previewer.preview(
				"<p>Main text<span class=\"fn\">Footnote body text</span></p>",
				[{ css }],
				document.body,
			);
			const area = previewer.querySelector(".footnote-area");
			const res = {
				hasArea: area !== null,
				areaText: area ? area.textContent : "",
				hasCall: previewer.querySelector("[data-footnote-call]") !== null,
			};
			previewer.destroy();
			return res;
		});
		expect(result.hasArea).toBe(true);
		expect(result.areaText).toContain("Footnote body text");
		expect(result.hasCall).toBe(true);
	});
});

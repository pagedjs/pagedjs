import { test, expect } from "./harness-fixture.js";

test.describe("Footnote flow — split across pages (auto policy)", () => {
	test("body taller than cap splits across two pages", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter, ConstraintSpace, FRAGMENTATION_PAGE } = await (async () => {
				const { Fragmenter } = await import("fragmentainers");
				const { ConstraintSpace, FRAGMENTATION_PAGE } = await import("fragmentainers/fragmentation");
				await import("/src/handlers/index.js");
				return { Fragmenter, ConstraintSpace, FRAGMENTATION_PAGE };
			})();

			const sheet = new CSSStyleSheet();
			sheet.replaceSync(
				":root { --footnote-max-height: 150px; } .fn { --float: footnote; }",
			);

			const tmpl = document.createElement("template");
			tmpl.innerHTML = `<div style="margin:0;padding:0">
				<div style="height:80px;margin:0;padding:0">
					text <span class="fn" style="display:block;height:260px;margin:0;padding:0">long body line 1<br>line 2<br>line 3<br>line 4<br>line 5<br>line 6<br>line 7<br>line 8<br>line 9<br>line 10</span>
				</div>
			</div>`;

			const flow = new Fragmenter(tmpl.content, {
				constraintSpace: new ConstraintSpace({
					availableInlineSize: 400,
					availableBlockSize: 300,
					fragmentainerBlockSize: 300,
					fragmentationType: FRAGMENTATION_PAGE,
				}),
				styles: [sheet],
			});

			const pages = [];
			for (const el of flow) {
				pages.push(el);
				if (pages.length >= 4) break;
			}

			const readPage = (i) => {
				if (!pages[i]) return null;
				document.body.appendChild(pages[i]);
				const area = pages[i].querySelector(".footnote-area");
				const marker = area?.querySelector("[data-footnote-marker]") ?? null;
				const cont = area?.querySelector("[data-footnote-continuation]") ?? null;
				const out = {
					hasArea: !!area,
					hasMarker: !!marker,
					hasContinuation: !!cont,
				};
				pages[i].remove();
				return out;
			};

			const summary = pages.map((_, i) => readPage(i));
			flow.destroy();
			return { pageCount: pages.length, summary };
		});
		expect(result.pageCount).toBeGreaterThanOrEqual(2);
		expect(result.summary[0].hasArea).toBe(true);
		expect(result.summary[0].hasMarker).toBe(true);
		expect(result.summary[1].hasArea).toBe(true);
		expect(result.summary[1].hasContinuation).toBe(true);
	});
});

test.describe("Footnote flow — policy fallback (line / block)", () => {
	test("line policy: body that exceeds cap pushes its containing block forward", async ({
		page,
	}) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { ConstraintSpace, FRAGMENTATION_PAGE } = await import("fragmentainers/fragmentation");
			await import("/src/handlers/index.js");

			const sheet = new CSSStyleSheet();
			sheet.replaceSync(
				":root { --footnote-max-height: 150px; } .fn { --float: footnote; --footnote-policy: line; }",
			);

			const tmpl = document.createElement("template");
			tmpl.innerHTML = `<div style="margin:0;padding:0">
				<div id="p1" style="height:80px;margin:0;padding:0">filler</div>
				<div id="p2" style="height:40px;margin:0;padding:0">ref <span class="fn" style="display:block;height:260px">huge footnote</span></div>
			</div>`;

			const flow = new Fragmenter(tmpl.content, {
				constraintSpace: new ConstraintSpace({
					availableInlineSize: 400,
					availableBlockSize: 300,
					fragmentainerBlockSize: 300,
					fragmentationType: FRAGMENTATION_PAGE,
				}),
				styles: [sheet],
			});

			const pages = [];
			for (const el of flow) {
				pages.push(el);
				if (pages.length >= 3) break;
			}

			const read = (i) => {
				document.body.appendChild(pages[i]);
				const call = pages[i].querySelector("[data-footnote-call]");
				const area = pages[i].querySelector(".footnote-area");
				const info = { hasCall: !!call, hasArea: !!area };
				pages[i].remove();
				return info;
			};
			const summary = pages.map((_, i) => read(i));
			flow.destroy();
			return { count: pages.length, summary };
		});

		// The call's containing <div id="p2"> gets pushed to page 2; the
		// footnote body also lives on page 2. Page 1 has no call / no area.
		expect(result.count).toBeGreaterThanOrEqual(2);
		expect(result.summary[0].hasCall).toBe(false);
		expect(result.summary[0].hasArea).toBe(false);
		expect(result.summary[1].hasCall).toBe(true);
		expect(result.summary[1].hasArea).toBe(true);
	});
});

test.describe("Footnote flow — --footnote-max-height cap", () => {
	test("cap from :root limits the footnote area", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { PageResolver } = await import("fragmentainers");
			await import("/src/handlers/index.js");

			const sheet = new CSSStyleSheet();
			sheet.replaceSync(
				":root { --footnote-max-height: 60px; }" +
					"@page { size: 400px 300px; margin: 0; }" +
					".fn { --float: footnote; }",
			);

			const tmpl = document.createElement("template");
			tmpl.innerHTML = `<div style="margin:0;padding:0">
				<div style="height:40px;margin:0;padding:0">ref <span class="fn" style="display:block;height:200px">body</span></div>
			</div>`;

			const flow = new Fragmenter(tmpl.content, {
				resolver: PageResolver.fromStyleSheets([sheet]),
				styles: [sheet],
			});
			const pages = [];
			for (const el of flow) {
				pages.push(el);
				if (pages.length >= 3) break;
			}

			document.body.appendChild(pages[0]);
			const area = pages[0].querySelector(".footnote-area");
			const areaRect = area ? area.getBoundingClientRect() : null;
			const out = {
				hasArea: !!area,
				areaHeight: areaRect?.height,
			};
			pages[0].remove();
			flow.destroy();
			return out;
		});

		expect(result.hasArea).toBe(true);
		// The area content is capped at 60px — area itself should not exceed it.
		expect(result.areaHeight).toBeLessThanOrEqual(61);
	});
});

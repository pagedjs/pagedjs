import { test, expect } from "./harness-fixture.js";

test.describe("Footnotes in paged media (browser)", () => {
	test("places footnote body at bottom of the page", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { ConstraintSpace, FRAGMENTATION_PAGE } = await import("fragmentainers/fragmentation");
			await import("/src/handlers/index.js");

			const css = ".fn { --float: footnote; }";
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(css);

			const template = document.createElement("template");
			template.innerHTML = `<div style="margin: 0; padding: 0;">
        <p style="height: 100px; margin: 0; padding: 0;">
          Main text
          <span class="fn">Footnote body text</span>
        </p>
      </div>`;

			const layout = new Fragmenter(template.content, {
				constraintSpace: new ConstraintSpace({
					availableInlineSize: 400,
					availableBlockSize: 400,
					fragmentainerBlockSize: 400,
					fragmentationType: FRAGMENTATION_PAGE,
				}),
				styles: [sheet],
			});
			const flow = layout.flow();
			const count = flow.fragmentainerCount;

			const elements = [...flow];
			const el = elements[0];
			document.body.appendChild(el);

			const area = el.querySelector(".footnote-area");
			const areaExists = area !== null;
			const childCount = area ? area.children.length : 0;
			const hasMarker =
				area && area.children[0] ? area.children[0].hasAttribute("data-footnote-marker") : false;
			const text = area && area.children[0] ? area.children[0].textContent : "";
			el.remove();
			layout.destroy();

			return { count, areaExists, childCount, hasMarker, text };
		});
		expect(result.count).toBe(1);
		expect(result.areaExists).toBe(true);
		expect(result.childCount).toBe(1);
		expect(result.hasMarker).toBe(true);
		expect(result.text).toContain("Footnote body text");
	});

	test("places footnotes on their forced-break segments", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { ConstraintSpace, FRAGMENTATION_PAGE } = await import("fragmentainers/fragmentation");
			await import("/src/handlers/index.js");

			const sheet = new CSSStyleSheet();
			sheet.replaceSync(".fn { --float: footnote; } p { height: 100px; margin: 0; }");

			const template = document.createElement("template");
			template.innerHTML = `<p>One<span class="fn">First footnote</span></p>
				<p style="break-before: page">Two<span class="fn">Second footnote</span></p>`;

			const layout = new Fragmenter(template.content, {
				constraintSpace: new ConstraintSpace({
					availableInlineSize: 400,
					availableBlockSize: 300,
					fragmentainerBlockSize: 300,
					fragmentationType: FRAGMENTATION_PAGE,
				}),
				styles: [sheet],
			});
			const pages = [...layout.flow()];
			const footnotes = pages.map((element) => {
				document.body.appendChild(element);
				const text = element.querySelector("[data-footnote-area]")?.textContent ?? "";
				element.remove();
				return text;
			});
			layout.destroy();
			return footnotes;
		});

		expect(result).toHaveLength(2);
		expect(result[0]).toContain("First footnote");
		expect(result[0]).not.toContain("Second footnote");
		expect(result[1]).not.toContain("First footnote");
		expect(result[1]).toContain("Second footnote");
	});

	test("measures bodies at each page's inline size", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { PageResolver } = await import("fragmentainers/resolvers");
			await import("/src/handlers/index.js");

			const sheet = new CSSStyleSheet();
			sheet.replaceSync(
				".fn { --float: footnote; } p { margin: 0; height: 150px; break-inside: avoid; }",
			);
			const body =
				"a body long enough to wrap onto several lines at the narrow width of the first page and onto fewer at the full width of the second";
			// The second paragraph and its footnote land on page 1.
			const html = `<p>One<span class="fn">${body}</span></p><p>Two<span class="fn">${body}</span></p>`;

			// Footnote area height per page for pages described by `rules`.
			const areaHeights = (rules) => {
				const template = document.createElement("template");
				template.innerHTML = html;
				const layout = new Fragmenter(template.content, {
					resolver: new PageResolver(rules, { inlineSize: 400, blockSize: 300 }),
					styles: [sheet],
				});
				const heights = [...layout.flow()].map((el) => {
					document.body.appendChild(el);
					const height = parseFloat(el.querySelector(".footnote-area")?.style.height) || 0;
					el.remove();
					return height;
				});
				layout.destroy();
				return heights;
			};

			// First page 200px wide, second 400px; reference: every page 400px.
			const mixed = areaHeights([{ pseudo: ["first"], margin: { left: "100px", right: "100px" } }]);
			const wide = areaHeights([]);
			return { mixed, wide };
		});
		expect(result.mixed).toHaveLength(2);
		expect(result.wide).toHaveLength(2);
		// The narrow first page wraps the body onto more lines.
		expect(result.mixed[0]).toBeGreaterThan(result.wide[0]);
		// The second page's body is measured at that page's width, not the first's.
		expect(result.mixed[1]).toBe(result.wide[1]);
	});

	test("inserts a footnote call marker in place of the body", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { ConstraintSpace, FRAGMENTATION_PAGE } = await import("fragmentainers/fragmentation");
			await import("/src/handlers/index.js");

			const css = ".fn { --float: footnote; }";
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(css);

			const template = document.createElement("template");
			template.innerHTML = `<div style="margin: 0; padding: 0;">
        <p style="height: 100px; margin: 0; padding: 0;">
          Before<span class="fn">Body</span>After
        </p>
      </div>`;

			const layout = new Fragmenter(template.content, {
				constraintSpace: new ConstraintSpace({
					availableInlineSize: 400,
					availableBlockSize: 400,
					fragmentainerBlockSize: 400,
					fragmentationType: FRAGMENTATION_PAGE,
				}),
				styles: [sheet],
			});
			const flow = layout.flow();
			const elements = [...flow];
			const el = elements[0];
			document.body.appendChild(el);

			const call = el.querySelector("[data-footnote-call]");
			const callExists = call !== null;
			const tagName = call ? call.tagName : null;
			el.remove();
			layout.destroy();

			return { callExists, tagName };
		});
		expect(result.callExists).toBe(true);
		expect(result.tagName).toBe("A");
	});

	test("handles multiple footnotes on the same page", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { ConstraintSpace, FRAGMENTATION_PAGE } = await import("fragmentainers/fragmentation");
			await import("/src/handlers/index.js");

			const css = ".fn { --float: footnote; }";
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(css);

			const template = document.createElement("template");
			template.innerHTML = `<div style="margin: 0; padding: 0;">
        <p style="height: 80px; margin: 0; padding: 0;">
          First<span class="fn">First footnote</span>
        </p>
        <p style="height: 80px; margin: 0; padding: 0;">
          Second<span class="fn">Second footnote</span>
        </p>
      </div>`;

			const layout = new Fragmenter(template.content, {
				constraintSpace: new ConstraintSpace({
					availableInlineSize: 400,
					availableBlockSize: 400,
					fragmentainerBlockSize: 400,
					fragmentationType: FRAGMENTATION_PAGE,
				}),
				styles: [sheet],
			});
			const flow = layout.flow();
			const elements = [...flow];
			const el = elements[0];
			document.body.appendChild(el);

			const area = el.querySelector(".footnote-area");
			const areaExists = area !== null;
			const childCount = area ? area.children.length : 0;
			const text0 = area && area.children[0] ? area.children[0].textContent : "";
			const text1 = area && area.children[1] ? area.children[1].textContent : "";
			el.remove();
			layout.destroy();

			return { areaExists, childCount, text0, text1 };
		});
		expect(result.areaExists).toBe(true);
		expect(result.childCount).toBe(2);
		expect(result.text0).toContain("First footnote");
		expect(result.text1).toContain("Second footnote");
	});

	test("footnote reduces available content space causing page break", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { ConstraintSpace, FRAGMENTATION_PAGE } = await import("fragmentainers/fragmentation");
			await import("/src/handlers/index.js");

			const css = ".fn { --float: footnote; }";
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(css);

			const template = document.createElement("template");
			template.innerHTML = `<div style="margin: 0; padding: 0;">
        <div style="margin: 0; padding: 0;">
          <div class="fn" style="height: 150px; margin: 0; padding: 0;">Footnote body</div>
        </div>
        <div style="height: 100px; margin: 0; padding: 0;"></div>
        <div style="height: 100px; margin: 0; padding: 0;"></div>
        <div style="height: 100px; margin: 0; padding: 0;"></div>
      </div>`;

			const layout = new Fragmenter(template.content, {
				constraintSpace: new ConstraintSpace({
					availableInlineSize: 400,
					availableBlockSize: 400,
					fragmentainerBlockSize: 400,
					fragmentationType: FRAGMENTATION_PAGE,
				}),
				styles: [sheet],
			});
			const flow = layout.flow();
			const count = flow.fragmentainerCount;
			layout.destroy();
			return { count };
		});
		expect(result.count).toBeGreaterThanOrEqual(2);
	});

	test("page without footnotes has no footnote area", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { ConstraintSpace, FRAGMENTATION_PAGE } = await import("fragmentainers/fragmentation");
			await import("/src/handlers/index.js");

			const css = ".fn { --float: footnote; }";
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(css);

			const template = document.createElement("template");
			template.innerHTML = `<div style="margin: 0; padding: 0;">
        <div style="height: 100px; margin: 0; padding: 0;">No footnotes here</div>
      </div>`;

			const layout = new Fragmenter(template.content, {
				constraintSpace: new ConstraintSpace({
					availableInlineSize: 400,
					availableBlockSize: 400,
					fragmentainerBlockSize: 400,
					fragmentationType: FRAGMENTATION_PAGE,
				}),
				styles: [sheet],
			});
			const flow = layout.flow();
			const elements = [...flow];
			const el = elements[0];
			document.body.appendChild(el);

			const area = el.querySelector(".footnote-area");
			const areaIsNull = area === null;
			el.remove();
			layout.destroy();
			return { areaIsNull };
		});
		expect(result.areaIsNull).toBe(true);
	});

	test("footnote call and body stay on the same page", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { Fragmenter } = await import("fragmentainers");
			const { ConstraintSpace, FRAGMENTATION_PAGE } = await import("fragmentainers/fragmentation");
			await import("/src/handlers/index.js");

			const css = ".fn { --float: footnote; }";
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(css);

			const template = document.createElement("template");
			template.innerHTML = `<div style="margin: 0; padding: 0;">
        <div style="height: 100px; margin: 0; padding: 0;">Page 1 content</div>
        <div style="height: 100px; margin: 0; padding: 0;">
          Page 2 text<span class="fn">Page 2 footnote</span>
        </div>
      </div>`;

			const layout = new Fragmenter(template.content, {
				constraintSpace: new ConstraintSpace({
					availableInlineSize: 400,
					availableBlockSize: 200,
					fragmentainerBlockSize: 200,
					fragmentationType: FRAGMENTATION_PAGE,
				}),
				styles: [sheet],
			});
			const flow = layout.flow();
			const elements = [...flow];

			let pageWithCall = -1;
			let pageWithBody = -1;

			for (let i = 0; i < elements.length; i++) {
				document.body.appendChild(elements[i]);
				const call = elements[i].querySelector("[data-footnote-call]");
				const area = elements[i].querySelector(".footnote-area");
				if (call) pageWithCall = i;
				if (area) pageWithBody = i;
				elements[i].remove();
			}

			layout.destroy();
			return { pageWithCall, pageWithBody };
		});
		expect(result.pageWithCall).not.toBe(-1);
		expect(result.pageWithCall).toBe(result.pageWithBody);
	});
});

test.describe("Footnote max-height resolution", () => {
	test("resolves a percentage cap against the available block size", async ({ page }) => {
		const cap = await page.evaluate(async () => {
			const { Footnote } = await import("/src/handlers/index.js");
			const { ConstraintSpace } = await import("fragmentainers/fragmentation");
			const sheet = new CSSStyleSheet();
			sheet.insertRule(":root { --footnote-max-height: 50%; }");
			const handler = new Footnote();
			handler.resetRules();
			handler.matchRule(sheet.cssRules[0]);
			return handler.getFlowCap(new ConstraintSpace({ availableBlockSize: 800 }));
		});
		expect(cap).toBe(400);
	});

	test("resolves an em cap without throwing", async ({ page }) => {
		const cap = await page.evaluate(async () => {
			const { Footnote } = await import("/src/handlers/index.js");
			const { ConstraintSpace } = await import("fragmentainers/fragmentation");
			const sheet = new CSSStyleSheet();
			sheet.insertRule(":root { --footnote-max-height: 10em; }");
			const handler = new Footnote();
			handler.resetRules();
			handler.matchRule(sheet.cssRules[0]);
			return handler.getFlowCap(new ConstraintSpace({ availableBlockSize: 800 }));
		});
		expect(cap).toBe(160);
	});
});

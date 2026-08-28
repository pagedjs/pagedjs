import { test, expect } from "./harness-fixture.js";

/**
 * Each chapter is forced onto its own page, so the page a cross-reference
 * resolves to is known from the document order rather than from measurement.
 */
const CSS = `
@page { size: 300px 200px; margin: 0; }
body { margin: 0; font: 16px/20px monospace; }
h1 { margin: 0; font-size: 16px; break-before: page; }
p { margin: 0; }
/* max-content so each element's width is the width of its generated text. */
nav a, nav span { display: block; width: max-content; text-decoration: none; }

#dec::after { content: target-counter(attr(href), page); }
#rom::after { content: target-counter(attr(href), page, lower-roman); }
#both::after { content: "p." target-counter(attr(href), page) " / " target-counter(attr(href), page, lower-roman); }

/* Controls rendered in the same font, for comparing generated text. */
#ctl-dec::after { content: "4"; }
#ctl-rom::after { content: "iv"; }
#ctl-both::after { content: "p.4 / iv"; }
`;

const CONTENT = `
<nav>
	<a id="dec" href="#four"></a>
	<a id="rom" href="#four"></a>
	<a id="both" href="#four"></a>
	<span id="ctl-dec"></span>
	<span id="ctl-rom"></span>
	<span id="ctl-both"></span>
</nav>
<h1 id="one">One</h1><p>first</p>
<h1 id="two">Two</h1><p>second</p>
<h1 id="four">Four</h1><p>fourth</p>
`;

async function render(page) {
	return page.evaluate(
		async ({ css, content }) => {
			const { PagedPreview } = window.Paged;
			const previewer = new PagedPreview();
			await previewer.preview(content, [{ css }], document.body);

			// The singular form resolves through a real CSS counter, so the
			// stamped reset is the value the browser then formats.
			const resetOf = (id) => {
				const el = previewer.querySelector(`#${id}`);
				return el ? getComputedStyle(el).counterReset : null;
			};
			const widthOf = (id) => {
				const el = previewer.querySelector(`#${id}`);
				return el ? +el.getBoundingClientRect().width.toFixed(2) : null;
			};

			const result = {
				pages: previewer.querySelectorAll("paged-page").length,
				decReset: resetOf("dec"),
				romReset: resetOf("rom"),
				bothReset: resetOf("both"),
				widths: {
					dec: widthOf("dec"),
					rom: widthOf("rom"),
					both: widthOf("both"),
					ctlDec: widthOf("ctl-dec"),
					ctlRom: widthOf("ctl-rom"),
					ctlBoth: widthOf("ctl-both"),
				},
			};
			previewer.destroy();
			return result;
		},
		{ css: CSS, content: CONTENT },
	);
}

test.describe("target counters through the preview pipeline", () => {
	test("resolves a cross-reference to the page its target landed on", async ({ page }) => {
		const result = await render(page);

		// nav, then one chapter per page: the third chapter is page 4.
		expect(result.pages).toBe(4);
		expect(result.decReset).toContain("--paged-tc-0 4");
	});

	test("renders iv and 4 for the same target from one document", async ({ page }) => {
		const result = await render(page);

		expect(result.romReset).toContain("--paged-tc-1 4");
		// The browser formats each occurrence from its own counter style, so
		// one page value renders both ways in a single document.
		expect(result.widths.dec).toBe(result.widths.ctlDec);
		expect(result.widths.rom).toBe(result.widths.ctlRom);
		expect(result.widths.dec).not.toBe(result.widths.rom);
	});

	test("resolves several occurrences inside one content declaration", async ({ page }) => {
		const result = await render(page);

		expect(result.bothReset).toContain("--paged-tc-2 4");
		expect(result.bothReset).toContain("--paged-tc-3 4");
		// Concatenated content parts and one literal string lay out to the same
		// text but round to widths that differ by a subpixel.
		expect(result.widths.both).toBeCloseTo(result.widths.ctlBoth, 1);
	});
});

/**
 * The reference sits exactly at the wrap boundary: with a one-character value
 * its text is a single line, with two characters it wraps. Laying it out
 * against the settled value therefore has to produce different geometry from
 * laying it out against an unresolved one.
 */
const WRAP_CSS = (after) => `
@page { size: 300px 200px; margin: 0; }
body { margin: 0; font: 16px/20px monospace; }
h1 { margin: 0; font-size: 16px; break-before: page; }
p { margin: 0; }
#ref { display: block; text-decoration: none; color: inherit; }
#ref::after { content: ${after}; }
`;

const WRAP_CONTENT = `
<a id="ref" href="#four">aaaa bbbb cccc dddd eeee fffff</a>
<h1 id="a">A</h1><p>x</p>
<h1 id="b">B</h1><p>x</p>
<h1 id="four">Four</h1><p>x</p>
`;

test.describe("a generated counter value that changes pagination", () => {
	test("lays the reference out against the resolved value, not the unresolved one", async ({
		page,
	}) => {
		const result = await page.evaluate(
			async (args) => {
				const { PagedPreview } = window.Paged;
				const run = async (css) => {
					const previewer = new PagedPreview();
					await previewer.preview(args.content, [{ css }], document.body);
					const el = previewer.querySelector("#ref");
					const measured = {
						height: +el.getBoundingClientRect().height.toFixed(2),
						reset: getComputedStyle(el).counterReset,
					};
					previewer.destroy();
					return measured;
				};
				return {
					resolved: await run(args.resolved),
					literal: await run(args.literal),
					unresolved: await run(args.unresolved),
				};
			},
			{
				content: WRAP_CONTENT,
				resolved: WRAP_CSS("target-counter(attr(href), page, lower-roman)"),
				literal: WRAP_CSS("\"iv\""),
				unresolved: WRAP_CSS("\"0\""),
			},
		);

		expect(result.resolved.reset).toContain("--paged-tc-0 4");
		// The settled layout is the one the real value produces from the start.
		expect(result.resolved.height).toBe(result.literal.height);
		// And it is not the layout an unresolved value would have produced,
		// so the pass loop re-laid the reference out after stamping.
		expect(result.unresolved.height).toBe(20);
		expect(result.resolved.height).toBe(40);
	});
});

/**
 * The number a chapter displays comes from its own `::before`, which only
 * exists once the engine has materialized it. Each chapter also starts a page,
 * so the counter has to survive being read one segment at a time.
 */
const PSEUDO_CSS = `
@page { size: 300px 200px; margin: 0; }
body { margin: 0; font: 16px/20px monospace; }
h2 { margin: 0; font-size: 16px; break-before: page; }
h2::before { counter-increment: part; content: counter(part) ". "; }
#ref::after { content: target-counter(attr(href), part); }
/* max-content so each element's width is the width of its rendered text. */
h2, #ctl, #ref { display: block; width: max-content; font-size: 16px; }
#ctl::before { content: "3. "; }
`;

const PSEUDO_CONTENT = `
<a id="ref" href="#three"></a>
<span id="ctl">Three</span>
<h2 id="one">One</h2>
<h2 id="two">Two</h2>
<h2 id="three">Three</h2>
`;

test.describe("a counter incremented by a pseudo element", () => {
	test("reads the number the target's ::before displays", async ({ page }) => {
		const result = await page.evaluate(
			async ({ css, content }) => {
				const { PagedPreview } = window.Paged;
				const previewer = new PagedPreview();
				await previewer.preview(content, [{ css }], document.body);

				const widthOf = (id) => {
					const el = previewer.querySelector(`#${id}`);
					return el ? +el.getBoundingClientRect().width.toFixed(2) : null;
				};
				const ref = previewer.querySelector("#ref");

				const out = {
					reset: ref ? getComputedStyle(ref).counterReset : null,
					// The browser numbers the chapters itself; the control
					// renders the number the last one has to end up with.
					last: widthOf("three"),
					control: widthOf("ctl"),
				};
				previewer.destroy();
				return out;
			},
			{ css: PSEUDO_CSS, content: PSEUDO_CONTENT },
		);

		expect(result.last).toBe(result.control);
		expect(result.reset).toContain("--paged-tc-0 3");
	});
});

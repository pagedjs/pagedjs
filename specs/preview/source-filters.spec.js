import { test, expect } from "./harness-fixture.js";

const CSS = `
@page { size: 300px 200px; margin: 0; }
p { margin: 0; font: 16px/20px monospace; }
#host { height: 20px; }
`;

test.describe("source filters through the preview pipeline", () => {
	test("scripts and comments never reach a composed page", async ({ page }) => {
		const result = await page.evaluate(async (css) => {
			const { PagedPreview } = window.Paged;

			// #host holds no laid-out children, so it composes as a leaf, through
			// cloneNode(true). Given a text child it would rebuild its children
			// instead and drop both nodes, leaving nothing for this to catch.
			const content = document.createDocumentFragment();
			const host = document.createElement("div");
			host.id = "host";
			host.append(document.createComment("keep-me"));
			// Constructed, not parsed: the fragment parsing algorithm marks a
			// parsed <script> already-started, so only this one can still run.
			const script = document.createElement("script");
			script.textContent = "window.pagedFilterProbe = true;";
			host.append(script);
			content.append(host);
			for (let i = 0; i < 40; i++) {
				const p = document.createElement("p");
				p.textContent = `line ${i}`;
				content.append(p);
			}

			const previewer = new PagedPreview();
			await previewer.preview(content, [{ css }], document.body);

			const walker = document.createTreeWalker(previewer, NodeFilter.SHOW_COMMENT);
			let marked = 0;
			for (let node = walker.nextNode(); node; node = walker.nextNode()) {
				if (node.data.includes("keep-me")) marked++;
			}

			const out = {
				pages: previewer.pages.length,
				hosts: previewer.querySelectorAll("#host").length,
				scripts: previewer.querySelectorAll("script").length,
				marked,
				ran: window.pagedFilterProbe === true,
			};
			previewer.destroy();
			return out;
		}, CSS);

		expect(result.pages).toBeGreaterThan(1);
		// The host reaching a page is what makes the absences below meaningful.
		expect(result.hosts).toBeGreaterThan(0);
		expect(result.scripts).toBe(0);
		expect(result.marked).toBe(0);
		expect(result.ran).toBe(false);
	});

	test("a sibling combinator matches across a removed script", async ({ page }) => {
		const css = `
			@page { size: 300px 120px; margin: 0; }
			section { margin: 0; font: 16px/20px monospace; color: rgb(0, 0, 0); }
			.b + .b { color: rgb(0, 128, 0); }
		`;
		const colors = await page.evaluate(async (sheet) => {
			const { PagedPreview } = window.Paged;
			const content = document.createDocumentFragment();

			const first = document.createElement("section");
			first.className = "b";
			first.textContent = "AAA";
			const script = document.createElement("script");
			script.textContent = "window.noop = 1;";
			const second = document.createElement("section");
			second.className = "b";
			second.textContent = Array.from({ length: 30 }, (_, i) => `bee ${i}`).join(" ");
			content.append(first, script, second);

			const previewer = new PagedPreview();
			await previewer.preview(content, [{ css: sheet }], document.body);
			const out = Array.from(previewer.querySelectorAll("section")).map(
				(el) => getComputedStyle(el).color,
			);
			previewer.destroy();
			return out;
		}, css);

		// StyleResolver freezes `+` matches over the source tree and replays them
		// onto continuation fragments, so the script has to be gone before it
		// looks: registered after it, the frozen "no match" wins on every
		// fragment and the whole run stays black.
		expect(colors.length).toBeGreaterThan(2);
		expect(colors[0]).toBe("rgb(0, 0, 0)");
		expect(colors.slice(1).every((color) => color === "rgb(0, 128, 0)")).toBe(true);
	});

	test("display:none subtrees stay in their generated page", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { PagedPreview } = window.Paged;
			const css = `
				@page { size: 300px 120px; margin: 0; }
				#first { break-after: page; }
				p { margin: 0; }
				[data-hidden-style] { display: none; }
			`;
			const previewer = new PagedPreview();
			await previewer.preview(
				`<section id="first">
					<p data-before>before</p>
					<div data-hidden-style><span data-hidden-child>hidden child</span></div>
					<div data-hidden-adjacent style="display: none">adjacent hidden</div>
					<p data-after>after</p>
				</section>
				<section id="second">
					<div data-hidden-inline style="display: none"><span>inline child</span></div>
					<p data-second>second</p>
				</section>`,
				[{ css }],
				document.body,
			);

			const pages = [...previewer.querySelectorAll("paged-page")];
			const styled = pages[0]?.querySelector("[data-hidden-style]");
			const inline = pages[1]?.querySelector("[data-hidden-inline]");
			const out = {
				pages: pages.length,
				styledPerPage: pages.map(
					(printedPage) => printedPage.querySelectorAll("[data-hidden-style]").length,
				),
				adjacentPerPage: pages.map(
					(printedPage) => printedPage.querySelectorAll("[data-hidden-adjacent]").length,
				),
				inlinePerPage: pages.map(
					(printedPage) => printedPage.querySelectorAll("[data-hidden-inline]").length,
				),
				styledDisplay: styled ? getComputedStyle(styled).display : "",
				inlineDisplay: inline ? getComputedStyle(inline).display : "",
				keptDescendant: styled?.querySelector("[data-hidden-child]") !== null,
				firstOrder: [...(styled?.parentElement.children ?? [])].map(
					(element) => element.dataset.before !== undefined
						? "before"
						: element.dataset.hiddenStyle !== undefined
							? "hidden"
							: element.dataset.hiddenAdjacent !== undefined
								? "adjacent"
								: "after",
				),
				secondOrder: [...(inline?.parentElement.children ?? [])].map((element) =>
					element.dataset.hiddenInline !== undefined ? "hidden" : "second"
				),
			};
			previewer.destroy();
			return out;
		});

		expect(result.pages).toBe(2);
		expect(result.styledPerPage).toEqual([1, 0]);
		expect(result.adjacentPerPage).toEqual([1, 0]);
		expect(result.inlinePerPage).toEqual([0, 1]);
		expect(result.styledDisplay).toBe("none");
		expect(result.inlineDisplay).toBe("none");
		expect(result.keptDescendant).toBe(true);
		expect(result.firstOrder).toEqual(["before", "hidden", "adjacent", "after"]);
		expect(result.secondOrder).toEqual(["hidden", "second"]);
	});
});

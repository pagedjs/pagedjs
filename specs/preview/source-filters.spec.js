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
});

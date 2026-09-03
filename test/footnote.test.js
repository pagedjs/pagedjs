import { test, expect } from "./browser-fixture.js";

test.describe("footnotes", () => {
	test("attaches the bodies when the engine applies a constraint space", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			await import("fragmentainers");
			const { ConstraintSpace } = await import("fragmentainers/fragmentation");
			await import("/src/css-transformer/CssTransformer.js");
			const { Footnote } = await import("/src/handlers/footnote.js");
			const FOOTNOTE_CSS = ".note { --float: footnote; display: none }";
			function sheet(css) {
				const styles = new CSSStyleSheet();
				styles.replaceSync(css);
				return styles;
			}
			function prepare(css, html) {
				const styles = [sheet(css)];
				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new Footnote();
				handler.init({}, undefined);
				handler.styles = styles;
				handler.resetRules();
				for (const rule of styles[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, styles };
			}
			function mainMeasurer(styles, content) {
				const measurer = document.createElement("content-measure");
				measurer.injectFragment(content, styles);
				document.body.appendChild(measurer);
				return measurer;
			}
			function space(availableInlineSize, cssInlineSize = null) {
				return new ConstraintSpace({
					availableInlineSize,
					availableBlockSize: 800,
					fragmentainerBlockSize: 800,
					cssInlineSize,
				});
			}
			function footnoteMeasurers() {
				return document.querySelectorAll("content-measure.footnotes");
			}
			function cleanup() {
				for (const measurer of document.querySelectorAll("content-measure")) measurer.remove();
				document.body.replaceChildren();
				document.head.querySelectorAll("style").forEach((style) => style.remove());
				document.adoptedStyleSheets = [];
			}
			cleanup();
			try {
				const { handler, content, styles } = prepare(
					FOOTNOTE_CSS,
					"<p>Body <span class=\"note\">A note.</span></p>",
				);
				mainMeasurer(styles, content);
				__results.push({ actual: (footnoteMeasurers()).length, args: [0], label: undefined });
				handler.applyConstraintSpace(space(600));
				const attached = footnoteMeasurers();
				__results.push({ actual: (attached).length, args: [1], label: undefined });
				__results.push({ actual: attached[0].isConnected, args: [true], label: undefined });
				__results.push({ actual: attached[0].style.width, args: ["600px"], label: undefined });
				__results.push({ actual: attached[0].contentRoot.querySelector("[data-footnote-body]"), args: [], label: undefined });
				handler.destroy();
			} finally {
				cleanup();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
		expect(results[4].actual, results[4].label).not.toBeNull(...results[4].args);
	});

	test("sizes the bodies with the space's CSS inline size rather than a resolved length", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			await import("fragmentainers");
			const { ConstraintSpace } = await import("fragmentainers/fragmentation");
			await import("/src/css-transformer/CssTransformer.js");
			const { Footnote } = await import("/src/handlers/footnote.js");
			const FOOTNOTE_CSS = ".note { --float: footnote; display: none }";
			function sheet(css) {
				const styles = new CSSStyleSheet();
				styles.replaceSync(css);
				return styles;
			}
			function prepare(css, html) {
				const styles = [sheet(css)];
				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new Footnote();
				handler.init({}, undefined);
				handler.styles = styles;
				handler.resetRules();
				for (const rule of styles[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, styles };
			}
			function mainMeasurer(styles, content) {
				const measurer = document.createElement("content-measure");
				measurer.injectFragment(content, styles);
				document.body.appendChild(measurer);
				return measurer;
			}
			function space(availableInlineSize, cssInlineSize = null) {
				return new ConstraintSpace({
					availableInlineSize,
					availableBlockSize: 800,
					fragmentainerBlockSize: 800,
					cssInlineSize,
				});
			}
			function footnoteMeasurers() {
				return document.querySelectorAll("content-measure.footnotes");
			}
			function cleanup() {
				for (const measurer of document.querySelectorAll("content-measure")) measurer.remove();
				document.body.replaceChildren();
				document.head.querySelectorAll("style").forEach((style) => style.remove());
				document.adoptedStyleSheets = [];
			}
			cleanup();
			try {
				const { handler, content, styles } = prepare(
					FOOTNOTE_CSS,
					"<p>Body <span class=\"note\">A note.</span></p>",
				);
				mainMeasurer(styles, content);
				handler.applyConstraintSpace(space(246, "65mm"));
				__results.push({ actual: footnoteMeasurers()[0].style.width, args: ["65mm"], label: undefined });
				handler.destroy();
			} finally {
				cleanup();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("follows the inline size from fragmentainer to fragmentainer", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			await import("fragmentainers");
			const { ConstraintSpace } = await import("fragmentainers/fragmentation");
			await import("/src/css-transformer/CssTransformer.js");
			const { Footnote } = await import("/src/handlers/footnote.js");
			const FOOTNOTE_CSS = ".note { --float: footnote; display: none }";
			function sheet(css) {
				const styles = new CSSStyleSheet();
				styles.replaceSync(css);
				return styles;
			}
			function prepare(css, html) {
				const styles = [sheet(css)];
				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new Footnote();
				handler.init({}, undefined);
				handler.styles = styles;
				handler.resetRules();
				for (const rule of styles[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, styles };
			}
			function mainMeasurer(styles, content) {
				const measurer = document.createElement("content-measure");
				measurer.injectFragment(content, styles);
				document.body.appendChild(measurer);
				return measurer;
			}
			function space(availableInlineSize, cssInlineSize = null) {
				return new ConstraintSpace({
					availableInlineSize,
					availableBlockSize: 800,
					fragmentainerBlockSize: 800,
					cssInlineSize,
				});
			}
			function footnoteMeasurers() {
				return document.querySelectorAll("content-measure.footnotes");
			}
			function cleanup() {
				for (const measurer of document.querySelectorAll("content-measure")) measurer.remove();
				document.body.replaceChildren();
				document.head.querySelectorAll("style").forEach((style) => style.remove());
				document.adoptedStyleSheets = [];
			}
			cleanup();
			try {
				const { handler, content, styles } = prepare(
					FOOTNOTE_CSS,
					"<p>Body <span class=\"note\">A note.</span></p>",
				);
				mainMeasurer(styles, content);
				handler.applyConstraintSpace(space(600));
				handler.applyConstraintSpace(space(600));
				handler.applyConstraintSpace(space(400));
				const attached = footnoteMeasurers();
				__results.push({ actual: (attached).length, args: [1], label: undefined });
				__results.push({ actual: attached[0].style.width, args: ["400px"], label: undefined });
				handler.destroy();
			} finally {
				cleanup();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("attaches nothing for a document without footnotes", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			await import("fragmentainers");
			const { ConstraintSpace } = await import("fragmentainers/fragmentation");
			await import("/src/css-transformer/CssTransformer.js");
			const { Footnote } = await import("/src/handlers/footnote.js");
			const FOOTNOTE_CSS = ".note { --float: footnote; display: none }";
			function sheet(css) {
				const styles = new CSSStyleSheet();
				styles.replaceSync(css);
				return styles;
			}
			function prepare(css, html) {
				const styles = [sheet(css)];
				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new Footnote();
				handler.init({}, undefined);
				handler.styles = styles;
				handler.resetRules();
				for (const rule of styles[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, styles };
			}
			function mainMeasurer(styles, content) {
				const measurer = document.createElement("content-measure");
				measurer.injectFragment(content, styles);
				document.body.appendChild(measurer);
				return measurer;
			}
			function space(availableInlineSize, cssInlineSize = null) {
				return new ConstraintSpace({
					availableInlineSize,
					availableBlockSize: 800,
					fragmentainerBlockSize: 800,
					cssInlineSize,
				});
			}
			function footnoteMeasurers() {
				return document.querySelectorAll("content-measure.footnotes");
			}
			function cleanup() {
				for (const measurer of document.querySelectorAll("content-measure")) measurer.remove();
				document.body.replaceChildren();
				document.head.querySelectorAll("style").forEach((style) => style.remove());
				document.adoptedStyleSheets = [];
			}
			cleanup();
			try {
				const { handler, content, styles } = prepare(FOOTNOTE_CSS, "<p>Body</p>");
				mainMeasurer(styles, content);
				handler.applyConstraintSpace(space(600));
				__results.push({ actual: (footnoteMeasurers()).length, args: [0], label: undefined });
				handler.destroy();
			} finally {
				cleanup();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resolves policy and layout nodes in afterMeasurementSetup", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			await import("fragmentainers");
			const { ConstraintSpace } = await import("fragmentainers/fragmentation");
			await import("/src/css-transformer/CssTransformer.js");
			const { Footnote } = await import("/src/handlers/footnote.js");
			const FOOTNOTE_CSS = ".note { --float: footnote; display: none }";
			function sheet(css) {
				const styles = new CSSStyleSheet();
				styles.replaceSync(css);
				return styles;
			}
			function prepare(css, html) {
				const styles = [sheet(css)];
				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new Footnote();
				handler.init({}, undefined);
				handler.styles = styles;
				handler.resetRules();
				for (const rule of styles[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, styles };
			}
			function mainMeasurer(styles, content) {
				const measurer = document.createElement("content-measure");
				measurer.injectFragment(content, styles);
				document.body.appendChild(measurer);
				return measurer;
			}
			function space(availableInlineSize, cssInlineSize = null) {
				return new ConstraintSpace({
					availableInlineSize,
					availableBlockSize: 800,
					fragmentainerBlockSize: 800,
					cssInlineSize,
				});
			}
			function cleanup() {
				for (const measurer of document.querySelectorAll("content-measure")) measurer.remove();
				document.body.replaceChildren();
				document.head.querySelectorAll("style").forEach((style) => style.remove());
				document.adoptedStyleSheets = [];
			}
			cleanup();
			try {
				const { handler, content, styles } = prepare(
					`${FOOTNOTE_CSS} .note { --footnote-policy: line }`,
					"<p>Body <span class=\"note\">A note.</span></p>",
				);
				const main = mainMeasurer(styles, content);
				handler.applyConstraintSpace(space(600));
				void main.offsetHeight;
				handler.afterMeasurementSetup(main.contentRoot, { pass: 0, segment: 0 });
				const { children } = handler.extractFlowChildren(
					{ inlineSize: 600, breakToken: null },
					null,
					Infinity,
				);
				__results.push({ actual: (children).length, args: [1], label: undefined });
				__results.push({ actual: children[0].breakInside, args: ["avoid"], label: undefined });
				handler.destroy();
			} finally {
				cleanup();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("preserves footnote-display and applies its used display mode", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			await import("fragmentainers");
			const { ConstraintSpace } = await import("fragmentainers/fragmentation");
			await import("/src/css-transformer/CssTransformer.js");
			const { Footnote } = await import("/src/handlers/footnote.js");
			const FOOTNOTE_CSS = ".note { --float: footnote; display: none }";
			function sheet(css) {
				const styles = new CSSStyleSheet();
				styles.replaceSync(css);
				return styles;
			}
			function prepare(css, html) {
				const styles = [sheet(css)];
				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new Footnote();
				handler.init({}, undefined);
				handler.styles = styles;
				handler.resetRules();
				for (const rule of styles[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, styles };
			}
			function mainMeasurer(styles, content) {
				const measurer = document.createElement("content-measure");
				measurer.injectFragment(content, styles);
				document.body.appendChild(measurer);
				return measurer;
			}
			function space(availableInlineSize, cssInlineSize = null) {
				return new ConstraintSpace({
					availableInlineSize,
					availableBlockSize: 800,
					fragmentainerBlockSize: 800,
					cssInlineSize,
				});
			}
			function footnoteMeasurers() {
				return document.querySelectorAll("content-measure.footnotes");
			}
			function cleanup() {
				for (const measurer of document.querySelectorAll("content-measure")) measurer.remove();
				document.body.replaceChildren();
				document.head.querySelectorAll("style").forEach((style) => style.remove());
				document.adoptedStyleSheets = [];
			}
			cleanup();
			try {
				const { handler, content, styles } = prepare(
					`${FOOTNOTE_CSS}
								.block { --footnote-display: block }
								.inline { --footnote-display: inline }
								.compact { --footnote-display: compact }`,
					`<p>Body
								<span class="note block">Block.</span>
								<span class="note inline">Inline.</span>
								<span class="note compact">Compact.</span>
							</p>`,
				);
				const main = mainMeasurer(styles, content);
				handler.applyConstraintSpace(space(600));
				void main.offsetHeight;
				handler.afterMeasurementSetup(main.contentRoot, { pass: 0, segment: 0 });
				const bodies = [...footnoteMeasurers()[0].contentRoot.children];
				__results.push({ actual: bodies.map((body) => body.getAttribute("data-footnote-display")), args: [[
					"block",
					"inline",
					"compact",
				]], label: undefined });
				__results.push({ actual: bodies.map((body) => body.style.display), args: [[
					"block",
					"inline",
					"block",
				]], label: undefined });
				handler.destroy();
			} finally {
				cleanup();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
		expect(results[1].actual, results[1].label).toEqual(...results[1].args);
	});

	test("rewrites footnote-display to a custom property", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			await import("fragmentainers");
			await import("fragmentainers/fragmentation");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			const { Footnote } = await import("/src/handlers/footnote.js");
			function cleanup() {
				for (const measurer of document.querySelectorAll("content-measure")) measurer.remove();
				document.body.replaceChildren();
				document.head.querySelectorAll("style").forEach((style) => style.remove());
				document.adoptedStyleSheets = [];
			}
			cleanup();
			try {
				const transformer = new CssTransformer({ rules: Footnote.rules });
				const ast = await transformer.prepare(
					".note { float: footnote; footnote-display: inline; }",
				);
				__results.push({ actual: csstree.generate(transformer.apply(ast)), args: [".note{--float:footnote;display:none;--footnote-display:inline}"], label: undefined });
			} finally {
				cleanup();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("inserts no measurement container while a fragmentainer is laid out", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			const { Fragmenter } = await import("fragmentainers");
			await import("fragmentainers/fragmentation");
			await import("/src/css-transformer/CssTransformer.js");
			const { Footnote } = await import("/src/handlers/footnote.js");
			const FOOTNOTE_CSS = ".note { --float: footnote; display: none }";
			function sheet(css) {
				const styles = new CSSStyleSheet();
				styles.replaceSync(css);
				return styles;
			}
			function footnoteMeasurers() {
				return document.querySelectorAll("content-measure.footnotes");
			}
			function cleanup() {
				for (const measurer of document.querySelectorAll("content-measure")) measurer.remove();
				document.body.replaceChildren();
				document.head.querySelectorAll("style").forEach((style) => style.remove());
				document.adoptedStyleSheets = [];
			}
			cleanup();
			try {
				if (!Fragmenter.handlers.includes(Footnote)) Fragmenter.handlers.push(Footnote);
				const styles = sheet(`${FOOTNOTE_CSS} p { margin: 0; font: 16px/20px serif }`);
				const content = document.createDocumentFragment();
				const first = document.createElement("p");
				first.innerHTML = "One <span class=\"note\">A note.</span>";
				first.style.breakAfter = "page";
				const second = document.createElement("p");
				second.textContent = "Two";
				content.append(first, second);
				const flow = new Fragmenter(content, { width: 400, height: 200, styles: [styles] });
				flow.layout();
				__results.push({ actual: (footnoteMeasurers()).length, args: [1], label: undefined });
				const before = document.querySelectorAll("content-measure").length;
				const fragments = [flow.next().value];
				__results.push({ actual: document.querySelectorAll("content-measure").length, args: [before], label: "during layout" });
				for (let step = flow.next(); !step.done; step = flow.next()) fragments.push(step.value);
				__results.push({ actual: (fragments).length, args: [2], label: undefined });
				__results.push({ actual: fragments[0].querySelector("[data-footnote-area]").textContent, args: ["A note."], label: undefined });
				__results.push({ actual: fragments[1].querySelector("[data-footnote-area]"), args: [null], label: undefined });
				flow.destroy();
			} finally {
				cleanup();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
		expect(results[4].actual, results[4].label).toBe(...results[4].args);
	});

	test("composes inline footnotes as inline list items", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			const { Fragmenter } = await import("fragmentainers");
			await import("fragmentainers/fragmentation");
			await import("/src/css-transformer/CssTransformer.js");
			const { Footnote } = await import("/src/handlers/footnote.js");
			const FOOTNOTE_CSS = ".note { --float: footnote; display: none }";
			function sheet(css) {
				const styles = new CSSStyleSheet();
				styles.replaceSync(css);
				return styles;
			}
			function cleanup() {
				for (const measurer of document.querySelectorAll("content-measure")) measurer.remove();
				document.body.replaceChildren();
				document.head.querySelectorAll("style").forEach((style) => style.remove());
				document.adoptedStyleSheets = [];
			}
			cleanup();
			try {
				if (!Fragmenter.handlers.includes(Footnote)) Fragmenter.handlers.push(Footnote);
				const styles = sheet(
					`${FOOTNOTE_CSS} .note { --footnote-display: inline } p { margin: 0 }`,
				);
				const content = document.createDocumentFragment();
				const paragraph = document.createElement("p");
				paragraph.innerHTML = "Text <span class=\"note\">First.</span><span class=\"note\">Second.</span>";
				content.appendChild(paragraph);
				const flow = new Fragmenter(content, { width: 400, height: 200, styles: [styles] });
				const fragment = flow.next().value;
				document.body.appendChild(fragment);
				const bodies = [...fragment.querySelectorAll("[data-footnote-marker]")];
				__results.push({ actual: (bodies).length, args: [2], label: undefined });
				__results.push({ actual: bodies.every((body) => body.style.display.includes("inline")), args: [true], label: undefined });
				__results.push({ actual: bodies.every((body) => body.getAttribute("data-footnote-display") === "inline"), args: [true], label: undefined });
				__results.push({ actual: bodies[0].getBoundingClientRect().top, args: [bodies[1].getBoundingClientRect().top], label: undefined });
				flow.destroy();
			} finally {
				cleanup();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
	});
});

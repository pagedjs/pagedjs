import { describe, it, expect, beforeEach, afterEach } from "../browser-suite.js";
import * as csstree from "css-tree";
import { Fragmenter } from "fragmentainers";
import { ConstraintSpace } from "fragmentainers/fragmentation";
import { CssTransformer } from "/src/css-transformer/CssTransformer.js";
import { Footnote } from "/src/handlers/footnote.js";

// The rewrite the CSS transformer performs, written out: the handler matches
// the custom property, not `float: footnote`.
const FOOTNOTE_CSS = ".note { --float: footnote; display: none }";

function sheet(css) {
	const styles = new CSSStyleSheet();
	styles.replaceSync(css);
	return styles;
}

/** Run the handler's rule walk and content preparation over a fragment. */
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

/** A main measurement container standing in for the engine's. */
function mainMeasurer(styles, content) {
	const measurer = document.createElement("content-measure");
	measurer.injectFragment(content, styles);
	document.body.appendChild(measurer);
	return measurer;
}

/** The constraint space the engine hands over when it sizes its container. */
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

describe("footnote measurement attachment", () => {
	beforeEach(cleanup);
	afterEach(cleanup);

	it("attaches the bodies when the engine applies a constraint space", () => {
		const { handler, content, styles } = prepare(
			FOOTNOTE_CSS,
			"<p>Body <span class=\"note\">A note.</span></p>",
		);
		mainMeasurer(styles, content);

		expect(footnoteMeasurers()).toHaveLength(0);
		handler.applyConstraintSpace(space(600));

		const attached = footnoteMeasurers();
		expect(attached).toHaveLength(1);
		expect(attached[0].isConnected).toBe(true);
		expect(attached[0].style.width).toBe("600px");
		expect(attached[0].contentRoot.querySelector("[data-footnote-body]")).not.toBeNull();

		handler.destroy();
	});

	it("sizes the bodies with the space's CSS inline size rather than a resolved length", () => {
		const { handler, content, styles } = prepare(
			FOOTNOTE_CSS,
			"<p>Body <span class=\"note\">A note.</span></p>",
		);
		mainMeasurer(styles, content);

		handler.applyConstraintSpace(space(246, "65mm"));

		expect(footnoteMeasurers()[0].style.width).toBe("65mm");
		handler.destroy();
	});

	it("follows the inline size from fragmentainer to fragmentainer", () => {
		const { handler, content, styles } = prepare(
			FOOTNOTE_CSS,
			"<p>Body <span class=\"note\">A note.</span></p>",
		);
		mainMeasurer(styles, content);

		handler.applyConstraintSpace(space(600));
		handler.applyConstraintSpace(space(600));
		handler.applyConstraintSpace(space(400));

		const attached = footnoteMeasurers();
		expect(attached).toHaveLength(1);
		expect(attached[0].style.width).toBe("400px");
		handler.destroy();
	});

	it("attaches nothing for a document without footnotes", () => {
		const { handler, content, styles } = prepare(FOOTNOTE_CSS, "<p>Body</p>");
		mainMeasurer(styles, content);

		handler.applyConstraintSpace(space(600));

		expect(footnoteMeasurers()).toHaveLength(0);
		handler.destroy();
	});

	it("resolves policy and layout nodes in afterMeasurementSetup", () => {
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
		expect(children).toHaveLength(1);
		expect(children[0].breakInside).toBe("avoid");

		handler.destroy();
	});

	it("preserves footnote-display and applies its used display mode", () => {
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
		expect(bodies.map((body) => body.getAttribute("data-footnote-display"))).toEqual([
			"block",
			"inline",
			"compact",
		]);
		expect(bodies.map((body) => body.style.display)).toEqual([
			"block",
			"inline",
			"block",
		]);

		handler.destroy();
	});
});

describe("footnote CSS extensions", () => {
	beforeEach(cleanup);
	afterEach(cleanup);

	it("rewrites footnote-display to a custom property", async () => {
		const transformer = new CssTransformer({ rules: Footnote.rules });
		const ast = await transformer.prepare(
			".note { float: footnote; footnote-display: inline; }",
		);

		expect(csstree.generate(transformer.apply(ast))).toBe(
			".note{--float:footnote;display:none;--footnote-display:inline}",
		);
	});
});

describe("footnote measurement in a flow", () => {
	beforeEach(cleanup);
	afterEach(cleanup);

	it("inserts no measurement container while a fragmentainer is laid out", () => {
		if (!Fragmenter.handlers.includes(Footnote)) Fragmenter.handlers.push(Footnote);

		// A forced break segments measurement; both setup paths apply the
		// constraint space before the reflow.
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

		// applyConstraintSpace ran during setup, so the bodies are already attached.
		expect(footnoteMeasurers()).toHaveLength(1);
		const before = document.querySelectorAll("content-measure").length;

		const fragments = [flow.next().value];
		expect(document.querySelectorAll("content-measure").length, "during layout").toBe(before);

		for (let step = flow.next(); !step.done; step = flow.next()) fragments.push(step.value);
		expect(fragments).toHaveLength(2);
		expect(fragments[0].querySelector("[data-footnote-area]").textContent).toBe("A note.");
		expect(fragments[1].querySelector("[data-footnote-area]")).toBe(null);

		flow.destroy();
	});

	it("composes inline footnotes as inline list items", () => {
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
		expect(bodies).toHaveLength(2);
		expect(bodies.every((body) => body.style.display.includes("inline"))).toBe(true);
		expect(bodies.every((body) => body.getAttribute("data-footnote-display") === "inline")).toBe(true);
		expect(bodies[0].getBoundingClientRect().top).toBe(bodies[1].getBoundingClientRect().top);

		flow.destroy();
	});
});

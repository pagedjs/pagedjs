import { describe, it, expect, beforeEach, vi } from "vitest";
import * as csstree from "css-tree";
import { CssTransformer } from "../css-transformer/CssTransformer.js";
import { NamedStrings } from "./named-strings.js";

async function rewrite(css) {
	const transformer = new CssTransformer({ rules: NamedStrings.rules });
	return csstree.generate(transformer.apply(await transformer.prepare(css)));
}

/**
 * Run the handler's hooks over a document the way a flow does: rules first,
 * then the source content, then the measured values.
 */
function setup(css, html) {
	const style = document.createElement("style");
	style.textContent = css;
	document.head.replaceChildren(style);

	const content = document.createElement("div");
	content.innerHTML = html;
	document.body.replaceChildren(content);

	const handler = new NamedStrings();
	handler.resetRules();
	for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
	handler.prepareContent(content);
	handler.afterMeasurementSetup(content);

	return { handler, content };
}

/** Compose one fragmentainer holding clones of the given source nodes. */
function compose(handler, index, ...nodes) {
	const container = document.createElement("fragment-container");
	container.fragmentIndex = index;
	for (const node of nodes) {
		container.appendChild(
			typeof node === "string" ? document.createTextNode(node) : node.cloneNode(true),
		);
	}
	handler.afterCompose(container);
	return container;
}

const read = (container, mode, name) =>
	container.style.getPropertyValue(`--paged-string-${mode}-${name}`);

describe("named strings CSS", () => {
	it("renames string-set into a custom property the runtime can read back", async () => {
		expect(await rewrite("h1 { string-set: alphabet content(text) }")).toBe(
			"h1{--string-set:alphabet content(text)}",
		);
	});

	it("rewrites string() to the custom property for its mode", async () => {
		expect(await rewrite(".a::before { content: string(alphabet, last) }")).toBe(
			".a::before{content:var(--paged-string-last-alphabet, \"\")}",
		);
	});

	it("defaults a bare string() to first", async () => {
		expect(await rewrite(".a::before { content: string(alphabet) }")).toBe(
			".a::before{content:var(--paged-string-first-alphabet, \"\")}",
		);
	});

	it("falls back to first for a mode that is not a selection mode", async () => {
		expect(await rewrite(".a::before { content: string(alphabet, sideways) }")).toBe(
			".a::before{content:var(--paged-string-first-alphabet, \"\")}",
		);
	});

	it("rewrites every reference in one declaration", async () => {
		expect(await rewrite(".a::before { content: string(a) \" - \" string(b, last) }")).toBe(
			".a::before{content:var(--paged-string-first-a, \"\")\" - \"var(--paged-string-last-b, \"\")}",
		);
	});

	it("leaves a reference that is not a valid name alone", async () => {
		expect(await rewrite(".a::before { content: string(2 words) }")).toBe(
			".a::before{content:string(2 words)}",
		);
	});
});

describe("named strings runtime", () => {
	beforeEach(() => {
		document.head.replaceChildren();
		document.body.replaceChildren();
	});

	it("resolves the four modes from one page's assignments", () => {
		const { handler, content } = setup(
			"h1 { --string-set: alphabet content(text) }",
			"<p>lead</p><h1>aaa</h1><p>body</p><h1>bbb</h1>",
		);
		const [lead, first, body, second] = content.children;

		const page = compose(handler, 0, lead, first, body, second);

		expect(read(page, "first", "alphabet")).toBe("\"aaa\"");
		expect(read(page, "last", "alphabet")).toBe("\"bbb\"");
		// Text renders ahead of the heading, so the page did not open with it.
		expect(read(page, "start", "alphabet")).toBe("\"\"");
		expect(read(page, "first-except", "alphabet")).toBe("\"\"");
	});

	it("takes start from the assignment that opens the page", () => {
		const { handler, content } = setup(
			"h1 { --string-set: alphabet content(text) }",
			"<h1>aaa</h1><p>body</p>",
		);
		const [heading, body] = content.children;

		const page = compose(handler, 0, heading, body);

		expect(read(page, "start", "alphabet")).toBe("\"aaa\"");
	});

	it("carries every mode forward across a page that assigns nothing", () => {
		const { handler, content } = setup(
			"h1 { --string-set: alphabet content(text) }",
			"<h1>aaa</h1><p>one</p><p>two</p>",
		);
		const [heading, one, two] = content.children;

		compose(handler, 0, heading, one);
		const second = compose(handler, 1, two);

		expect(read(second, "first", "alphabet")).toBe("\"aaa\"");
		expect(read(second, "last", "alphabet")).toBe("\"aaa\"");
		expect(read(second, "start", "alphabet")).toBe("\"aaa\"");
		// first-except only empties on a page that assigns.
		expect(read(second, "first-except", "alphabet")).toBe("\"aaa\"");
	});

	it("leaves a page before the first assignment empty", () => {
		const { handler, content } = setup(
			"h1 { --string-set: alphabet content(text) }",
			"<p>front matter</p><h1>aaa</h1>",
		);
		const [front, heading] = content.children;

		const first = compose(handler, 0, front);
		const second = compose(handler, 1, heading);

		expect(read(first, "first", "alphabet")).toBe("\"\"");
		expect(read(second, "first", "alphabet")).toBe("\"aaa\"");
	});

	it("concatenates literals with attr()", () => {
		const { handler, content } = setup(
			"h1 { --string-set: chapter \"Ch. \" attr(data-n) }",
			"<h1 data-n=\"4\">aaa</h1>",
		);

		const page = compose(handler, 0, content.firstElementChild);

		expect(read(page, "first", "chapter")).toBe("\"Ch. 4\"");
	});

	it("sets every name a single declaration assigns", () => {
		const { handler, content } = setup(
			"h1 { --string-set: title content(text), slug attr(data-slug) }",
			"<h1 data-slug=\"intro\">aaa</h1>",
		);

		const page = compose(handler, 0, content.firstElementChild);

		expect(read(page, "first", "title")).toBe("\"aaa\"");
		expect(read(page, "first", "slug")).toBe("\"intro\"");
	});

	it("keeps the value the source element holds when the element splits", () => {
		const { handler, content } = setup(
			"h1 { --string-set: alphabet content(text) }",
			"<h1>aaa bbb</h1>",
		);
		const heading = content.firstElementChild;

		const first = compose(handler, 0, heading);
		const continuation = heading.cloneNode(true);
		continuation.textContent = "bbb";
		continuation.setAttribute("data-split-from", "");
		const second = compose(handler, 1, continuation);

		expect(read(first, "first", "alphabet")).toBe("\"aaa bbb\"");
		// The assignment happened where the element started, so the second page
		// carries the value rather than assigning it again.
		expect(read(second, "first-except", "alphabet")).toBe("\"aaa bbb\"");
	});

	it("collapses source whitespace and escapes quotes", () => {
		const { handler, content } = setup(
			"h1 { --string-set: alphabet content(text) }",
			"<h1>\n\t\tsaid \"hello\"\n\t</h1>",
		);

		const page = compose(handler, 0, content.firstElementChild);

		expect(read(page, "first", "alphabet")).toBe("\"said \\\"hello\\\"\"");
	});

	it("reads the declaration the cascade resolved, not the first that matched", () => {
		const { handler, content } = setup(
			"h1 { --string-set: alphabet content(text) }"
				+ "h1.override { --string-set: alphabet attr(data-n) }",
			"<h1 class=\"override\" data-n=\"9\">aaa</h1>",
		);

		const page = compose(handler, 0, content.firstElementChild);

		expect(read(page, "first", "alphabet")).toBe("\"9\"");
	});

	it("warns once for a content() argument that needs generated content", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { handler, content } = setup(
			"h1 { --string-set: alphabet content(before) }",
			"<h1>aaa</h1><h1>bbb</h1>",
		);

		const page = compose(handler, 0, ...content.children);

		expect(read(page, "first", "alphabet")).toBe("\"\"");
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});
});

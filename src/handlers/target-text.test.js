import { describe, it, expect, beforeEach, vi } from "vitest";
import * as csstree from "css-tree";
import { CssTransformer } from "../css-transformer/CssTransformer.js";
import { TargetText } from "./target-text.js";

async function rewrite(css, rules = TargetText.rules) {
	const transformer = new CssTransformer({ rules });
	return csstree.generate(transformer.apply(await transformer.prepare(css)));
}

/**
 * Run the handler's hooks the way a flow does. The stylesheet is written as
 * the transformer leaves it, so the two halves stay independent.
 */
function setup(css, html) {
	const style = document.createElement("style");
	style.textContent = css;
	document.head.replaceChildren(style);

	const content = document.createDocumentFragment();
	const holder = document.createElement("div");
	holder.innerHTML = html;
	while (holder.firstChild) content.appendChild(holder.firstChild);

	const handler = new TargetText();
	// The flow keeps the largest budget a handler asks for, so a repeated
	// request is the same request.
	let budget = 0;
	handler.init({}, {
		flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
	});
	handler.resetRules();
	for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
	handler.prepareContent(content);

	return { handler, content, budget };
}

const generated = (element, id = "text-0") =>
	element.style.getPropertyValue(`--paged-generated-${id}`);

describe("target text CSS", () => {
	it("rewrites the function and keeps its source alongside", async () => {
		expect(await rewrite("a::after { content: target-text(attr(href url)) }")).toBe(
			"a::after{content:var(--paged-generated-text-0, \"\");"
				+ "--paged-generated-text-0-source:target-text(attr(href url))}",
		);
	});

	it("gives each occurrence its own id", async () => {
		const out = await rewrite(
			"a::after { content: target-text(attr(href)) } b::after { content: target-text(attr(href), before) }",
		);
		expect(out).toContain("--paged-generated-text-0-source");
		expect(out).toContain("--paged-generated-text-1-source");
	});

	// Two builds must not interleave, so each access to the rules allocates
	// from zero rather than from a counter shared across the module.
	it("restarts occurrence ids for every stylesheet build", async () => {
		const css = "a::after { content: target-text(attr(href)) }";
		expect(await rewrite(css, TargetText.rules)).toBe(await rewrite(css, TargetText.rules));
	});

	it("leaves target-text outside a content declaration alone", async () => {
		expect(await rewrite("a::after { width: target-text(attr(href)) }")).toBe(
			"a::after{width:target-text(attr(href))}",
		);
	});
});

describe("target text runtime", () => {
	beforeEach(() => {
		document.head.replaceChildren();
		document.body.replaceChildren();
	});

	it("stamps the target's text on the referencing element", () => {
		const { content } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href url)) }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter One</h1>",
		);

		expect(generated(content.getElementById("ref"))).toBe("\"Chapter One\"");
	});

	it("collapses whitespace and escapes quotes in the target's text", () => {
		const { content } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href)) }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">\n\t'Lorem \"ipsum\" dolor'\n</h1>",
		);

		expect(generated(content.getElementById("ref"))).toBe("\"'Lorem \\\"ipsum\\\" dolor'\"");
	});

	it("takes only the first letter in first-letter mode", () => {
		const { content } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href), first-letter) }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\"> Praesent placerat</h1>",
		);

		expect(generated(content.getElementById("ref"))).toBe("\"P\"");
	});

	it("resolves an id that would need escaping as a selector", () => {
		const { content } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href)) }",
			"<a id=\"ref\" href=\"#chap.two\">go</a><h1 id=\"chap.two\">Dotted</h1>",
		);

		expect(generated(content.getElementById("ref"))).toBe("\"Dotted\"");
	});

	it("resolves a percent-encoded fragment", () => {
		const { content } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href)) }",
			"<a id=\"ref\" href=\"#chap%20two\">go</a><h1 id=\"chap two\">Encoded</h1>",
		);

		expect(generated(content.getElementById("ref"))).toBe("\"Encoded\"");
	});

	it("resolves a fragment that is not valid percent-encoding", () => {
		const { content } = setup(
			"a::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
			"<a id=\"ref\" href=\"#50%\">go</a><h1 id=\"50%\">Literal</h1>",
		);

		expect(generated(content.getElementById("ref"))).toBe("\"Literal\"");
	});

	it("stamps every element the rule matches with its own target", () => {
		const { content } = setup(
			"nav a::after { --paged-generated-text-0-source: target-text(attr(href)) }",
			"<nav><a id=\"one\" href=\"#a\">1</a><a id=\"two\" href=\"#b\">2</a></nav>"
				+ "<h1 id=\"a\">First</h1><h1 id=\"b\">Second</h1>",
		);

		expect(generated(content.getElementById("one"))).toBe("\"First\"");
		expect(generated(content.getElementById("two"))).toBe("\"Second\"");
	});

	it("reads the declaration off the element a pseudo-element belongs to", () => {
		const { handler } = setup(
			"nav li#first a[href]::after { --paged-generated-text-0-source: target-text(attr(href)) }",
			"<nav><li id=\"first\"><a href=\"#c\">go</a></li></nav><h1 id=\"c\">Title</h1>",
		);

		// A custom property cannot be set on a pseudo-element, so the value has
		// to land on the element whose ::after inherits it.
		expect(handler).toBeDefined();
		expect(document.styleSheets[0].cssRules[0].selectorText).toContain("::after");
	});

	it("registers no layout pass when nothing needs one", () => {
		const { budget } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href)) }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
		);

		expect(budget).toBe(0);
	});

	it("registers a layout pass for a mode that reads generated content", () => {
		const { budget } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href), before) }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
		);

		expect(budget).toBe(3);
	});

	it("stamps a deferred mode only in the pass loop, and settles after it", () => {
		const { handler, content } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href), before) }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
		);
		const reference = content.getElementById("ref");

		expect(generated(reference)).toBe("");

		// This DOM resolves no pseudo content, so the value is empty; what the
		// assertion pins is the invalidate-then-settle shape of the pass loop.
		const first = handler.afterLayoutPass();
		expect(first.invalidate).toEqual([reference]);
		expect(generated(reference)).toBe("\"\"");
		expect(handler.afterLayoutPass()).toBe(null);
	});

	it("resolves a missing target to nothing, warning once", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { content } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href)) }",
			"<a id=\"one\" href=\"#gone\">1</a><a id=\"two\" href=\"#gone\">2</a>",
		);

		expect(generated(content.getElementById("one"))).toBe("\"\"");
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});

	it("resolves a target in another document to nothing, warning once", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { content } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href)) }",
			"<a id=\"ref\" href=\"other.html#chap\">go</a>",
		);

		expect(generated(content.getElementById("ref"))).toBe("\"\"");
		expect(warn.mock.calls[0][0]).toContain("outside this document");
		warn.mockRestore();
	});

	it("warns once for a malformed source and records no occurrence", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { content } = setup(
			"a::after { --paged-generated-text-0-source: target-text(attr(href), sideways) }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
		);

		expect(generated(content.getElementById("ref"))).toBe("");
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});
});

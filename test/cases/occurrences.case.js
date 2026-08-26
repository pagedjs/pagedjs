import { describe, it, expect, beforeEach } from "../browser-suite.js";
import { MODES, exitValue, opensFragment, selectPerMode } from "/src/handlers/occurrences.js";

describe("selectPerMode", () => {
	it("carries the entry value through a page with no occurrence", () => {
		expect(selectPerMode([], "carried", false, "")).toEqual({
			first: "carried",
			start: "carried",
			last: "carried",
			"first-except": "carried",
		});
	});

	it("takes the ends of the page's own occurrences", () => {
		const selected = selectPerMode(["a", "b", "c"], "carried", false, "");
		expect(selected.first).toBe("a");
		expect(selected.last).toBe("c");
	});

	it("keeps start on the entry value unless the page opens with the assignment", () => {
		expect(selectPerMode(["a"], "carried", false, "").start).toBe("carried");
		expect(selectPerMode(["a"], "carried", true, "").start).toBe("a");
	});

	it("empties first-except on a page that assigns", () => {
		expect(selectPerMode(["a"], "carried", false, "")["first-except"]).toBe("");
		expect(selectPerMode(["a"], "carried", false, null)["first-except"]).toBe(null);
	});

	it("resolves every documented mode", () => {
		const selected = selectPerMode(["a"], "carried", true, "");
		expect(Object.keys(selected).sort()).toEqual([...MODES].sort());
	});
});

describe("exitValue", () => {
	it("hands the last occurrence to the next page", () => {
		expect(exitValue(["a", "b"], "carried")).toBe("b");
	});

	it("hands the entry value on when the page has none", () => {
		expect(exitValue([], "carried")).toBe("carried");
	});
});

describe("opensFragment", () => {
	let root;

	beforeEach(() => {
		root = document.createElement("div");
		document.body.replaceChildren(root);
	});

	/** @param {string} html */
	const target = (html) => {
		root.innerHTML = html;
		return root.querySelector("#target");
	};

	it("is true for the first element, indentation and all", () => {
		const element = target("\n\t<h1 id=\"target\">aaa</h1>\n\t<p>body</p>");
		expect(opensFragment(root, element)).toBe(true);
	});

	it("is false when text renders ahead of it", () => {
		const element = target("<b>Title</b><h1 id=\"target\">aaa</h1>");
		expect(opensFragment(root, element)).toBe(false);
	});

	it("is false when a replaced box renders ahead of it", () => {
		const element = target("<img src=\"x.png\"><h1 id=\"target\">aaa</h1>");
		expect(opensFragment(root, element)).toBe(false);
	});

	it("looks past the ancestors that contain it", () => {
		const element = target("<section><div><h1 id=\"target\">aaa</h1></div></section>");
		expect(opensFragment(root, element)).toBe(true);
	});

	it("is false for an element the fragment does not hold", () => {
		target("<h1 id=\"target\">aaa</h1>");
		expect(opensFragment(root, document.createElement("h1"))).toBe(false);
	});
});

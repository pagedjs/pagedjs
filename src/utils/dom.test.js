import { words } from "./dom.js";

function wordTexts(element, text) {
	element.textContent = text;
	document.body.appendChild(element);
	let result = Array.from(words(element.firstChild), range => range.toString());
	element.remove();
	return result;
}

describe("words", () => {
	it.each(["pre", "pre-wrap", "break-spaces"])(
		"keeps whitespace in code with white-space: %s",
		(whiteSpace) => {
			let code = document.createElement("code");
			code.style.whiteSpace = whiteSpace;
			expect(wordTexts(code, "alpha\n    beta")).toEqual(["alpha\n    beta"]);
		}
	);

	it.each(["normal", "nowrap", "pre-line"])(
		"keeps separating words with white-space: %s",
		(whiteSpace) => {
			let pre = document.createElement("pre");
			pre.style.whiteSpace = whiteSpace;
			expect(wordTexts(pre, "alpha\n    beta")).toEqual(["alpha", "beta"]);
		}
	);

	it("keeps non-breaking spaces within a normal word", () => {
		let element = document.createElement("span");
		expect(wordTexts(element, "alpha\u00a0beta gamma")).toEqual(["alpha\u00a0beta", "gamma"]);
	});
});

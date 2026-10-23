import Polisher from "./polisher.js";
import { initializeHandlers } from "../utils/handlers.js";

// Runs a stylesheet through the default handlers, as Previewer.preview() does.
function polish(css) {
	let polisher = new Polisher(false);
	polisher.setup();
	initializeHandlers(undefined, polisher, undefined);
	return polisher.add({ "http://localhost/": css });
}

describe("Polisher", () => {
	// NthOfType and Following each move the rules they match out of the stylesheet.
	it.each([
		"h1 + p:first-of-type { color: red; }", // matches both
		"summary + ul li:last-of-type { color: red; }", // matches both
		"h1 + p { color: red; }", // matches Following only
		"li:first-of-type { color: red; }" // matches NthOfType only
	])("moves %s out of the stylesheet", async (css) => {
		await expect(polish(css)).resolves.not.toContain("color");
	});
});

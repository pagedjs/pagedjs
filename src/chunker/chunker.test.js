import Chunker from "./chunker.js";

describe("Chunker", () => {
	/**
	 * Test: should create a page area
	 *
	 * Verifies that calling `setup()` on a new Chunker instance
	 * creates a `.pagedjs_pages` container in the DOM.
	 */
	it("should create a page area", async () => {
		let chunker = new Chunker();
		chunker.setup();

		// Check if the pages area has the correct class
		expect(chunker.pagesArea.classList).toContain("pagedjs_pages");
	});
});

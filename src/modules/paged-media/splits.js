import Handler from "../handler";

class Splits extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	// layout(pageElement, page) {
	//
	// }

	afterPageLayout(pageElement, page, breakToken, chunker) {
		let splits = Array.from(pageElement.querySelectorAll("[data-split-from]"));
		let pages = pageElement.parentNode;
		let index = Array.prototype.indexOf.call(pages.children, pageElement);
		let prevPage;

		if (index === 0) {
			return;
		}

		prevPage = pages.children[index - 1];

		splits.forEach((split) => {
			let ref = split.dataset.ref;
			let from = prevPage.querySelector("[data-ref='"+ ref +"']:not([data-split-to])");

			if (from) {
				from.dataset.splitTo = ref;

				if (!from.dataset.splitFrom) {
					from.dataset.splitOriginal = true;
				}
			}
		});
	}
}

export default Splits;

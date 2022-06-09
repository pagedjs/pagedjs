import Handler from "../handler.js";

class Lists extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}
	afterParsed(content) {
		const orderedLists = content.querySelectorAll("ol");

		for (var list of orderedLists) {
			this.addDataNumbers(list);
		}
	}

	afterPageLayout(pageElement, page, breakToken, chunker) {
		var orderedLists = pageElement.getElementsByTagName("ol");
		for (var list of orderedLists) {
			if (list.firstElementChild) {
				list.start = list.firstElementChild.dataset.itemNum;
			}
		}
	}

	addDataNumbers(list) {
		let start = 1;
		if (list.hasAttribute("start")) {
			start = parseInt(list.getAttribute("start"), 10);
			if (isNaN(start)) {
				start = 1;
			}
		}
		let items = list.children;
		for (var i = 0; i < items.length; i++) {
			items[i].setAttribute("data-item-num", i + start);
		}
	}

}

export default Lists;

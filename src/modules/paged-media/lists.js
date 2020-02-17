import Handler from "../handler";

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
			if (list.hasChildNodes()) {
				list.start = list.firstElementChild.dataset.itemNum;
			}
			else {
				list.parentNode.removeChild(list);
			}
		}
	}

	addDataNumbers(list) {
		let items = list.children;
		for (var i = 0; i < items.length; i++) {
			items[i].setAttribute("data-item-num", i + 1);
		}
	}

}

export default Lists;

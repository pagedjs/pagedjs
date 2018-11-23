import Handler from "../handler";
import csstree from "css-tree";

class PrintMedia extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	onAtMedia(node, item, list) {
		let media = this.getMediaName(node);
		let rules;

		if (media === "print") {
			rules = node.block.children;

			// Remove rules from the @media block
			node.block.children = new csstree.List();

			// Append rules to the end of main rules list
			list.appendList(rules);
		}

	}

	getMediaName(node) {
		let media = "";

		if (typeof node.prelude === "undefined" ||
				node.prelude.type !== "AtrulePrelude" ) {
			return;
		}

		csstree.walk(node.prelude, {
			visit: "Identifier",
			enter: (identNode, iItem, iList) => {
				media = identNode.name;
			}
		});
		return media;
	}


}

export default PrintMedia;

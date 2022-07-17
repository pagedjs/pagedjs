import Handler from "../handler.js";
import csstree from "css-tree";

class PrintMedia extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	onAtMedia(node, item, list) {
		let media = this.getMediaName(node);
		let rules;
		if (media.includes("print")) {
			rules = node.block.children;

			// Append rules to the end of main rules list
			// TODO: this isn't working right, needs to check what is in the prelude
			/*
			rules.forEach((selectList) => {
				if (selectList.prelude) {
					selectList.prelude.children.forEach((rule) => {

						rule.children.prependData({
							type: "Combinator",
							name: " "
						});
	
						rule.children.prependData({
							type: "ClassSelector",
							name: "pagedjs_page"
						});
					});	
				}
			});

			list.insertList(rules, item);
			*/

			// Append rules to the end of main rules list
			list.appendList(rules);

			// Remove rules from the @media block
			list.remove(item);
		} else if (!media.includes("all") && !media.includes("pagedjs-ignore")) {
			list.remove(item);
		}

	}

	getMediaName(node) {
		let media = [];

		if (typeof node.prelude === "undefined" ||
				node.prelude.type !== "AtrulePrelude" ) {
			return;
		}

		csstree.walk(node.prelude, {
			visit: "Identifier",
			enter: (identNode, iItem, iList) => {
				media.push(identNode.name);
			}
		});
		return media;
	}


}

export default PrintMedia;

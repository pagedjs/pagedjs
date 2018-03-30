import StylesParser from './parser.js';
import csstree from 'css-tree';

class Sheet {
	constructor(text) {
		this.original = text;
		// Parse the text
		this.ast = this.parse(text);
		// Remove @page rules
		this.pages = this.removePages(this.ast);
		// this.add(this.text);
	}

	// parse(text) {
	//   let parser = new StylesParser(text);
	//
	//   // Add root vars
	//   let rootVars = `:root {
	//     --width: ${parser.width};
	//     --height: ${parser.height};
	//   }`;
	//   this.add(rootVars);
	//
	//   return parser.text;
	// }

	// parse
	parse(text) {
		// send to csstree
		let ast = csstree.parse(text);
		// return ast
		return ast
	}

	pageModel(name) {
		return {
			name: name,
			marginalia: {},
			width: undefined,
			height: undefined,
			margin : {
				top: {value: 0, unit: "px"},
				right: {value: 0, unit: "px"},
				left: {value: 0, unit: "px"},
				bottom: {value: 0, unit: "px"}
			},
			block: {},
			marks: undefined
		}
	}

	removePages(ast) {
		let pages = {};
		// Find and Remove @page rules
		csstree.walk(ast, {
			visit: 'Atrule',
			enter: (node, item, list) => {
				const basename = csstree.keyword(node.name).basename;

				if (basename === "page") {
					let name = "";

					if (node.prelude) {
						let named = this.getTypeSelector(node);
						if (named) {
							name += named;
						}

						let psuedo = this.getPsuedoSelector(node);
						if (psuedo) {
							name += ":" + psuedo;
						}
					} else {
						name = ":";
					}

					let page = this.pageModel(name);

					if (name in pages) {
						// TODO: already present, need to merge
						console.log("page needs merge");
					} else {
						pages[name] = page;
					}
					// Remove the rule
					list.remove(item);
				}
			}
		})

		// return collection of pages
		/*
		{
			":" : {},
			":left" : {},
			":right" : {},
			":first" : {},
			":black" : {},
			"named" : {},
		}
		*/
		console.log(pages);
		return pages;
	}

	getTypeSelector(ast) {
		// Find page name
		let name;

		csstree.walk(ast, {
			visit: "TypeSelector",
			enter: (node, item, list) => {
				console.log(node.name);
				name = node.name
			}
		});
		console.log(name);
		return name;
	}

	getPsuedoSelector(ast) {
		// Find if it has :left & :right & :black & :first
		let name;

		csstree.walk(ast, {
			visit: "PseudoClassSelector",
			enter: (node, item, list) => {
				name = node.name;
			}
		});

		return name;
	}

	addPageClasses(pages) {

	}

	addPageResets(ast) {

	}

	addRootVars(ast) {

	}

	scope(ast) {
		// Get all selector lists
		// add an id
	}

	// generate string
	toString(ast) {
		return csstree.generate(ast || this.ast);
	}

	// add(text){
	// 	let head = document.querySelector("head");
	// 	let style = document.createElement("style");
	// 	style.type = "text/css";
	//
	// 	style.appendChild(document.createTextNode(text));
	//
	// 	head.appendChild(style);
	// }

}

export default Sheet;

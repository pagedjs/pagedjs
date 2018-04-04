import csstree from 'css-tree';
import pageSizes from './sizes';
import { UUID } from "../utils/utils";

class Sheet {
	constructor(text, url) {
		this.url = new URL(url, window.location.href);
		this.original = text;
		// Parse the text
		this.ast = this.parse(text);
		// Replace urls
		this.replaceUrls(this.ast);
		// Scope
		this.id = UUID();
		// this.addScope(this.ast, this.uuid);

		// Get page selectors
		// this.namedPageSelectors = this.getNamedPageSelectors(this.ast);

		// Get page brekas
		this.pageBreaks = this.replacePageBreaks(this.ast);

		// Remove @page rules
		this.pages = this.replacePages(this.ast);

		if ("*" in this.pages) {
			this.addRootVars(this.ast, this.pages["*"].width, this.pages["*"].height);
			this.addRootPage(this.ast, this.pages["*"].width, this.pages["*"].height);
		}
	}

	// parse
	parse(text) {
		// send to csstree
		let ast = csstree.parse(text);
		// return ast
		return ast;
	}

	pageModel(selector) {
		return {
			selector: selector,
			name: undefined,
			psuedo: undefined,
			marginalia: {},
			width: undefined,
			height: undefined,
			orientation: undefined,
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

	replacePages(ast) {
		let pages = {};
		// Find and Remove @page rules
		csstree.walk(ast, {
			visit: 'Atrule',
			enter: (node, item, list) => {
				const basename = csstree.keyword(node.name).basename;

				if (basename === "page") {
					let selector = "";
					let name = "";
					let named, psuedo;

					if (node.prelude) {
						named = this.getTypeSelector(node);
						psuedo = this.getPsuedoSelector(node);
						selector = csstree.generate(node.prelude);
					} else {
						selector = "*";
					}


					let page = this.pageModel(selector);

					page.name = named;
					page.psuedo = psuedo;

					if (name in pages) {
						// TODO: already present, need to merge
						console.log("page needs merge");
					} else {
						pages[selector] = page;
					}

					page.marginalia = this.replaceMarginalia(node);

					let declarations = this.replaceDeclartations(node);

					if (declarations.size) {
						page.width = declarations.size.width;
						page.height = declarations.size.height;
						page.orientation = declarations.size.orientation;
					}

					if (declarations.margin) {
						page.margin = declarations.margin;
					}

					if (declarations.marks) {
						page.marks = declarations.marks;
					}

					page.block = node.block;


					// Remove the rule
					list.remove(item);
				}
			}
		})

		this.addPageClasses(pages, ast);
		// return collection of pages
		return pages;
	}

	getTypeSelector(ast) {
		// Find page name
		let name;

		csstree.walk(ast, {
			visit: "TypeSelector",
			enter: (node, item, list) => {
				name = node.name
			}
		});

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

	replaceMarginalia(ast) {
		let parsed = {};

		csstree.walk(ast.block, {
			visit: 'Atrule',
			enter: (node, item, list) => {
				let name = node.name;
				parsed[name] = node.block;
				list.remove(item);
			}
		});

		return parsed;
	}

	replaceDeclartations(ast) {
		let parsed = {};

		csstree.walk(ast.block, {
			visit: 'Declaration',
			enter: (declaration, dItem, dList) => {
				let prop = csstree.property(declaration.property).name;
				let value = declaration.value;

				if (prop === "marks") {
					parsed.marks = value.children.first().name;
					dList.remove(dItem);
				} else if (prop === "margin") {
					parsed.margin = this.getMargins(declaration);
					dList.remove(dItem);
				} else if (prop.indexOf("margin-") === 0) {
					let m = prop.substring("margin-".length);
					if (!parsed.margin) {
						parsed.margin = {
							top: {value: 0, unit: "px"},
							right: {value: 0, unit: "px"},
							left: {value: 0, unit: "px"},
							bottom: {value: 0, unit: "px"}
						};
					}
					parsed.margin[m] = declaration.value.children.first();
					dList.remove(dItem);
				} else if (prop === "size") {
					parsed.size = this.getSize(declaration);
					dList.remove(dItem);
				}

			}
		})

		return parsed;
	}

	replaceUrls(ast) {
		csstree.walk(ast, {
			visit: 'Url',
			enter: (node, item, list) => {
				let href = node.value.value.replace(/["|']/g, '');
				let url = new URL(href, this.url)
				node.value.value = url.toString();
			}
		});
	}

	getSize(declaration) {
		let width, height, orientation;

		// Get size: Xmm Ymm
		csstree.walk(declaration, {
			visit: 'Dimension',
			enter: (node, item, list) => {
				// console.log("Dimension", node);
				let {value, unit} = node;
				if (typeof width === "undefined") {
					width = { value, unit };
				} else if (typeof height === "undefined") {
					height = { value, unit };
				}
			}
		});

		// Get size: a4
		csstree.walk(declaration, {
			visit: 'String',
			enter: (node, item, list) => {
				let s = pageSizes[node];
				if (s) {
					width = s.width;
					height = s.height;
				}
			}
		});

		// Get Landscape or Portrait
		csstree.walk(declaration, {
			visit: "Identifier",
			enter: (node, item, list) => {
				orientation = node.name;
			}
		});

		return {
			width,
			height,
			orientation
		}
	}

	getMargins(declaration) {
		let margins = [];
		let margin = {
			top: {value: 0, unit: "px"},
			right: {value: 0, unit: "px"},
			left: {value: 0, unit: "px"},
			bottom: {value: 0, unit: "px"}
		};

		csstree.walk(declaration, {
			visit: 'Dimension',
			enter: (node, item, list) => {
				margins.push(node);
			}
		});

		if (margins.length === 1) {
			for (let m in page.margin) {
				margin[m] = margins[0];
			}
		} else if (margins.length === 2) {
			margin.top = margins[0];
			margin.right = margins[1];
			margin.bottom = margins[0];
			margin.left = margins[1];
		} else if (margins.length === 3) {
			margin.top = margins[0];
			margin.right = margins[1];
			margin.bottom = margins[2];
			margin.left = margins[1];
		} else if (margins.length === 4) {
			margin.top = margins[0];
			margin.right = margins[1];
			margin.bottom = margins[2];
			margin.left = margins[3];
		}

		return margin;
	}

	addPageClasses(pages, ast) {
		// First add * page
		if ("*" in pages) {
			let p = this.createPage(pages["*"], ast.children);
			ast.children.insert(p);
		}
		// Add :left & :right
		if (":left" in pages) {
			let left = this.createPage(pages[":left"], ast.children);
			ast.children.insert(left);
		}
		if (":right" in pages) {
			let right = this.createPage(pages[":right"], ast.children);
			ast.children.insert(right);
		}
		// Add :first & :empty
		if (":first" in pages) {
			let first = this.createPage(pages[":first"], ast.children);
			ast.children.insert(first);
		}
		if (":empty" in pages) {
			let empty = this.createPage(pages[":empty"], ast.children);
			ast.children.insert(empty);
		}
		// Add named pages
		for (let pg in pages) {
			if (pages[pg].name) {
				let named = this.createPage(pages[pg], ast.children);
				ast.children.insert(named);
			}
		}

	}

	createPage(page, ruleList) {
		let selectorList = new csstree.List();
		let selectors = new csstree.List();
		let name;

		selectors.insert(selectors.createItem({
			type: 'ClassSelector',
			name: 'page'
		}));

		// Named page
		if (page.name) {
			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: page.name + "_page"
			}));
		}

		// if (page.name && page.psuedo) {
		// 	selectors.insert(selectors.createItem({
		// 		type: 'Combinator',
		// 		name: " "
		// 	}));
		// }

		// PsuedoSelector
		if (page.psuedo) {
			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: page.psuedo + "_page"
			}));
		}


		let rule = ruleList.createItem({
			type: 'Rule',
			prelude: {
				type: 'Selector',
				loc: 0,
				children: selectors
			},
			block: {
					type: 'Block',
					loc: 0,
					children: page.block.children.copy()
			}
		});

		let children = rule.data.block.children;
		this.addMarginVars(page.margin, children, children.first());

		if (page.width) {
			this.addDimensions(page.width, page.height, children, children.first());
		}

		if (page.marginalia) {
			this.addMarginalia(page, ruleList, rule);
		}

		return rule;
	}

	addMarginVars(margin, list, item) {
		// variables for margins
		for (let m in margin) {
			let value = margin[m].value + (margin[m].unit || '');
			let mVar = list.createItem({
				type: 'Declaration',
				property: "--margin-" + m,
				value: {
					type: "Raw",
					value: value
				}
			});
			list.append(mVar, item);
		}
	}

	addDimensions(width, height, list, item) {
		// width dimension
		let widthList = new csstree.List();
		widthList.insert(widthList.createItem({
			type: "Dimension",
			value: width.value,
			unit: width.unit
		}));
		let w = list.createItem({
			type: 'Declaration',
			property: "width",
			value: {
				type: 'Value',
				children: widthList
			}
		});
		list.append(w);
		// width variable
		let wVar = list.createItem({
			type: 'Declaration',
			property: "--width",
			value: {
				type: "Raw",
				value: width.value + (width.unit || '')
			}
		});
		list.append(wVar);

		// height dimension
		let heightList = new csstree.List();
		heightList.insert(heightList.createItem({
			type: "Dimension",
			value: height.value,
			unit: height.unit
		}));
		let h = list.createItem({
			type: 'Declaration',
			property: "height",
			value: {
				type: 'Value',
				children: heightList
			}
		});
		list.append(h);
		// height variable
		let hVar = list.createItem({
			type: 'Declaration',
			property: "--height",
			value: {
				type: "Raw",
				value: height.value + (height.unit || '')
			}
		});
		list.append(hVar);
	}

	addMarginalia(page, list, item) {
		for (let loc in page.marginalia) {
			let item = page.marginalia[loc];
			let selectorList = new csstree.List();
			let selectors = new csstree.List();

			let selector = selectorList.createItem({
				type: 'Selector',
				children: selectors
			});

			selectorList.insert(selector);

			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: 'page'
			}));

			// Named page
			if (page.name) {
				name = page.name + "_page";
				selectors.insert(selectors.createItem({
					type: 'ClassSelector',
					name: page.name + "_page"
				}));
			}

			// PsuedoSelector
			if (page.psuedo) {
				selectors.insert(selectors.createItem({
					type: 'ClassSelector',
					name: page.psuedo + "_page"
				}));
			}

			selectors.insert(selectors.createItem({
				type: 'Combinator',
				name: " "
			}));

			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: loc
			}));

			selectors.insert(selectors.createItem({
				type: 'Combinator',
				name: ">"
			}));

			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: "content"
			}));

			selectors.insert(selectors.createItem({
				type: 'PseudoElementSelector',
				name: "after",
				children: null
			}));

			let rule = list.createItem({
				type: 'Rule',
				prelude: {
					type: 'SelectorList',
					children: selectorList
				},
				block: item
			});

			list.append(rule);

		}
	}

	addPageResets(ast, width, height) {

	}

	addRootVars(ast, width, height) {
		let selectorList = new csstree.List();
		let selectors = new csstree.List();
		let children = new csstree.List();

		let wVar = children.createItem({
			type: 'Declaration',
			property: "--width",
			value: {
				type: "Raw",
				value: width.value + (width.unit || '')
			},
			children: null
		});
		children.append(wVar);

		let hVar = children.createItem({
			type: 'Declaration',
			property: "--height",
			value: {
				type: "Raw",
				value: height.value + (height.unit || '')
			},
			children: null
		});
		children.append(hVar);

		selectors.insert(selectors.createItem({
			type: "PseudoClassSelector",
			name: "root",
			children: null
		}));

		let selector = selectorList.createItem({
			type: 'Selector',
			children: selectors
		});

		selectorList.append(selector);

		let rule = ast.children.createItem({
			type: 'Rule',
			prelude: {
				type: 'SelectorList',
				loc: null,
				children: selectorList
			},
			block: {
					type: 'Block',
					loc: null,
					children: children
			}
		});

		ast.children.append(rule);
	}

	addRootPage(ast, width, height) {
		/*
		@page {
		  size: var(--width) var(--height);
		  margin: 0;
		  padding: 0;
		}
		*/
		let children = new csstree.List();
		let dimensions = new csstree.List();

		dimensions.append(dimensions.createItem({
			type: 'Dimension',
			unit: width.unit,
			value: width.value
		}));

		dimensions.append(dimensions.createItem({
			type: 'WhiteSpace',
			value: " "
		}));

		dimensions.append(dimensions.createItem({
			type: 'Dimension',
			unit: height.unit,
			value: height.value
		}));

		children.append(children.createItem({
			type: 'Declaration',
			property: "size",
			loc: null,
			value: {
				type: "Value",
				children: dimensions
			}
		}));

		children.append(children.createItem({
			type: 'Declaration',
			property: "margin",
			loc: null,
			value: {
				type: "Value",
				children: [{
					type: 'Dimension',
					unit: 'px',
					value: 0
				}]
			}
		}));

		children.append(children.createItem({
			type: 'Declaration',
			property: "padding",
			loc: null,
			value: {
				type: "Value",
				children: [{
					type: 'Dimension',
					unit: 'px',
					value: 0
				}]
			}
		}));


		let rule = ast.children.createItem({
			type: 'Atrule',
			prelude: null,
			name: "page",
			block: {
					type: 'Block',
					loc: null,
					children: children
			}
		});

		ast.children.append(rule);
	}

	addScope(ast, id) {
		// Get all selector lists
		// add an id
		csstree.walk(ast, {
			visit: 'Selector',
			enter: (node, item, list) => {
				let children = node.children;
				children.prepend(children.createItem({
					type: 'WhiteSpace',
					value: " "
				}));
				children.prepend(children.createItem({
					type: 'IdSelector',
					name: id,
					loc: null,
					children: null
				}));
			}
		});
	}

	/*
	getNamedPageSelectors(ast) {
		let record = false;
		let namedPageSelectors = {};
		csstree.walk(ast, {
			// visit: 'Declaration',
			leave: (node, item, list) => {
				if(record && node.type === "Rule"){
					record.selector = csstree.generate(node.prelude);
				}

				if (node.type === "Declaration" && node.property === "page") {
					let name = node.value.children.first().name;
					namedPageSelectors[name] = {
						name: name,
						selector: ''
					}
					record = namedPageSelectors[name];
				}
			},
			enter: (node, item, list) => {
				if (record) {
					record = false;
				}
			}
		});
	}
	*/

	getNamedPageSelectors(ast) {
		let namedPageSelectors = {};
		csstree.walk(ast, {
			visit: 'Rule',
			enter: (node, item, list) => {
				csstree.walk(node, {
					visit: 'Declaration',
					enter: (declaration, dItem, dList) => {
						if (declaration.property === "page") {
							let value = declaration.value.children.first();
							let name = value.name;
							let selector = csstree.generate(node.prelude);
							namedPageSelectors[name] = {
								name: name,
								selector: selector
							}

							// dList.remove(dItem);

							// Add in page break
							declaration.property = "break-before";
							value.type = "Identifier";
							value.name = "always";

						}
					}
				});
			}
		});
		return namedPageSelectors;
	}

	replacePageBreaks(ast) {
		let breaks = {};

		csstree.walk(ast, {
			visit: 'Rule',
			enter: (node, item, list) => {
				csstree.walk(node, {
					visit: 'Declaration',
					enter: (declaration, dItem, dList) => {
						let property = declaration.property;

						if (property === "break-before" ||
								property === "break-after" ||
								property === "page-break-before" ||
								property === "page-break-after" ||
								property === "page"
						) {

							let children = declaration.value.children.first();
							let value = children.name;
							let selector = csstree.generate(node.prelude);
							let name;

							if (property === "page-break-before") {
								property = "break-before";
							} else if (property === "page-break-after") {
								property = "break-after";
							}

							if (property === "page") {
								name = value;
								// value = "always";
							}

							let breaker = {
								property: property,
								value: value,
								selector: selector,
								name: name
							};

							selector.split(",").forEach((s) => {
								if (!breaks[s]) {
									breaks[s] = [breaker];
								} else {
									breaks[s].push(breaker);
								}
							})

							dList.remove(dItem);
						}
					}
				});
			}
		});

		return breaks;
	}

	// generate string
	toString(ast) {
		return csstree.generate(ast || this.ast);
	}
}

export default Sheet;

import Handler from "../handler";
import csstree from 'css-tree';
import pageSizes from '../../polisher/sizes';
import { rebuildAncestors, elementAfter } from "../../utils/dom";

class AtPage extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.pages = {};

		this.width = undefined;
		this.height = undefined;
		this.orientation = undefined;
	}

	pageModel(selector) {
		return {
			selector: selector,
			name: undefined,
			psuedo: undefined,
			nth: undefined,
			marginalia: {},
			width: undefined,
			height: undefined,
			orientation: undefined,
			margin : {
				top: {},
				right: {},
				left: {},
				bottom: {}
			},
			block: {},
			marks: undefined
		}
	}

	// Find and Remove @page rules
	onAtPage(node, item, list) {
		let selector = "";
		let name = "";
		let named, psuedo, nth;

		if (node.prelude) {
			named = this.getTypeSelector(node);
			psuedo = this.getPsuedoSelector(node);
			nth = this.getNthSelector(node);
			selector = csstree.generate(node.prelude);
		} else {
			selector = "*";
		}


		let page = this.pageModel(selector);

		page.name = named;
		page.psuedo = psuedo;
		page.nth = nth;

		if (name in this.pages) {
			this.pages[selector] = Object.assign(this.pages[selector], page);
			this.pages[selector].added = false;
		} else {
			this.pages[selector] = page;
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

	/* Handled in breaks */
	/*
	afterParsed(parsed) {
		for (let b in this.named) {
			// Find elements
			let elements = parsed.querySelectorAll(b);
			// Add break data
			for (var i = 0; i < elements.length; i++) {
				elements[i].setAttribute("data-page", this.named[b]);
			}
		}
	}
	*/

	afterTreeWalk(ast, sheet) {
		this.addPageClasses(this.pages, ast, sheet);

		if ("*" in this.pages) {
			let width = this.pages["*"].width;
			let height = this.pages["*"].height;
			let orientation = this.pages["*"].orientation;

			if ((width && height) &&
			    (this.width !== width || this.height !== height)) {
				this.width = width;
				this.height = height;
				this.orientation = orientation;

				this.addRootVars(ast, width, height);
				this.addRootPage(ast, width, height);

				this.emit("size", { width, height, orientation });
			}

		}
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
				if (node.name !== "nth") {
					name = node.name;
				}
			}
		});

		return name;
	}

	getNthSelector(ast) {
		// Find if it has :nth
		let nth;
		csstree.walk(ast, {
			visit: "PseudoClassSelector",
			enter: (node, item, list) => {
				if (node.name === "nth" && node.children) {
					let raw = node.children.first();
					nth = raw.value;
				}
			}
		});

		return nth;
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
							top: {},
							right: {},
							left: {},
							bottom: {}
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

	getSize(declaration) {
		let width, height, orientation;

		// Get size: Xmm Ymm
		csstree.walk(declaration, {
			visit: 'Dimension',
			enter: (node, item, list) => {
				let {value, unit} = node;
				if (typeof width === "undefined") {
					width = { value, unit };
				} else if (typeof height === "undefined") {
					height = { value, unit };
				}
			}
		});

		// Get size: 'A4'
		csstree.walk(declaration, {
			visit: 'String',
			enter: (node, item, list) => {
				let name = node.value.replace(/["|']/g, '');
				let s = pageSizes[name];
				if (s) {
					width = s.width;
					height = s.height;
				}
			}
		});

		// Get Format or Landscape or Portrait
		csstree.walk(declaration, {
			visit: "Identifier",
			enter: (node, item, list) => {
				let name = node.name;
				if (name === "landscape" || name === "portrait") {
					orientation = node.name;
				} else if (name !== "auto") {
					let s = pageSizes[name];
					if (s) {
						width = s.width;
						height = s.height;
					}
				}
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
			top: {},
			right: {},
			left: {},
			bottom: {}
		};

		csstree.walk(declaration, {
			visit: 'Dimension',
			enter: (node, item, list) => {
				margins.push(node);
			}
		});

		if (margins.length === 1) {
			for (let m in margin) {
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

	addPageClasses(pages, ast, sheet) {
		// First add * page
		if ("*" in pages && !pages["*"].added) {
			let p = this.createPage(pages["*"], ast.children, sheet);
			sheet.insertRule(p);
			pages["*"].added = true;
		}
		// Add :left & :right
		if (":left" in pages && !pages[":left"].added) {
			let left = this.createPage(pages[":left"], ast.children, sheet);
			sheet.insertRule(left);
			pages[":left"].added = true;
		}
		if (":right" in pages && !pages[":right"].added) {
			let right = this.createPage(pages[":right"], ast.children, sheet);
			sheet.insertRule(right);
			pages[":right"].added = true;
		}
		// Add :first & :blank
		if (":first" in pages && !pages[":first"].first) {
			let first = this.createPage(pages[":first"], ast.children, sheet);
			sheet.insertRule(first);
			pages[":first"].added = true;
		}
		if (":blank" in pages && !pages[":blank"].added) {
			let blank = this.createPage(pages[":blank"], ast.children, sheet);
			sheet.insertRule(blank);
			pages[":blank"].added = true;
		}
		// Add nth pages
		for (let pg in pages) {
			if (pages[pg].nth && !pages[pg].added) {
				let nth = this.createPage(pages[pg], ast.children, sheet);
				sheet.insertRule(nth);
				pages[pg].added = true;
			}
		}

		// Add named pages
		for (let pg in pages) {
			if (pages[pg].name && !pages[pg].added) {
				let named = this.createPage(pages[pg], ast.children, sheet);
				sheet.insertRule(named);
				pages[pg].added = true;
			}
		}

	}

	createPage(page, ruleList, sheet) {
		let selectorList = new csstree.List();
		let selectors = new csstree.List();
		let name;

		selectors.insert(selectors.createItem({
			type: 'ClassSelector',
			name: 'pagedjs_page'
		}));

		// Named page
		if (page.name) {
			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: "pagedjs_" + page.name + "_page"
			}));
		}

		// if (page.name && page.psuedo) {
		// 	selectors.insert(selectors.createItem({
		// 		type: 'Combinator',
		// 		name: " "
		// 	}));
		// }

		// PsuedoSelector
		if (page.psuedo && !(page.name && page.psuedo === "first")) {
			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: "pagedjs_" + page.psuedo + "_page"
			}));
		}

		if (page.name && page.psuedo === "first") {
			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: "pagedjs_" + page.name + "_" + page.psuedo + "_page"
			}));
		}

		// Nth
		if (page.nth) {
			let nthlist = new csstree.List();
			let nth = this.getNth(page.nth);

			nthlist.insert(nthlist.createItem(nth));

			selectors.insert(selectors.createItem({
				type: 'PseudoClassSelector',
				name: 'nth-of-type',
				children: nthlist
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
			this.addMarginalia(page, ruleList, rule, sheet);
		}

		return rule;
	}

	addMarginVars(margin, list, item) {
		// variables for margins
		for (let m in margin) {
			if (typeof margin[m].value !== "undefined") {
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
	}

	addDimensions(width, height, list, item) {
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

		// Disabled due to causing issues with Chrome on print
		/*
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
		*/
	}

	addMarginalia(page, list, item, sheet) {
		for (let loc in page.marginalia) {
			let item = csstree.clone(page.marginalia[loc]);
			csstree.walk(item, {
				visit: "Declaration",
				enter: (node, item, list) => {
					if (node.property === "content") {
						list.remove(item);
					}
				}
			});

			let selectorList = new csstree.List();
			let selectors = new csstree.List();

			let selector = selectorList.createItem({
				type: 'Selector',
				children: selectors
			});

			selectorList.insert(selector);

			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: 'pagedjs_page'
			}));

			// Named page
			if (page.name) {
				name = page.name + "_page";
				selectors.insert(selectors.createItem({
					type: 'ClassSelector',
					name: "pagedjs_" + page.name + "_page"
				}));
			}

			// PsuedoSelector
			if (page.psuedo) {
				selectors.insert(selectors.createItem({
					type: 'ClassSelector',
					name: "pagedjs_" + page.psuedo + "_page"
				}));
			}

			// Nth
			if (page.nth) {
				let nthlist = new csstree.List();
				let nth = this.getNth(page.nth);

				nthlist.insert(nthlist.createItem(nth));

				selectors.insert(selectors.createItem({
					type: 'PseudoClassSelector',
					name: 'nth-of-type',
					children: nthlist
				}));
			}

			selectors.insert(selectors.createItem({
				type: 'Combinator',
				name: " "
			}));

			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: "pagedjs_margin-" + loc
			}));

			selectors.insert(selectors.createItem({
				type: 'Combinator',
				name: ">"
			}));

			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: "pagedjs_margin-content"
			}));

			// selectors.insert(selectors.createItem({
			// 	type: 'PseudoElementSelector',
			// 	name: "after",
			// 	children: null
			// }));

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

		// Just content
		for (let loc in page.marginalia) {
			let content = csstree.clone(page.marginalia[loc]);
			csstree.walk(content, {
				visit: "Declaration",
				enter: (node, item, list) => {
					if (node.property !== "content") {
						list.remove(item);
					}
				}
			});

			let selectorList = new csstree.List();
			let selectors = new csstree.List();

			let selector = selectorList.createItem({
				type: 'Selector',
				children: selectors
			});

			selectorList.insert(selector);

			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: 'pagedjs_page'
			}));

			// Named page
			if (page.name) {
				name = page.name + "_page";
				selectors.insert(selectors.createItem({
					type: 'ClassSelector',
					name: "pagedjs_" + page.name + "_page"
				}));
			}

			// PsuedoSelector
			if (page.psuedo) {
				selectors.insert(selectors.createItem({
					type: 'ClassSelector',
					name: "pagedjs_" + page.psuedo + "_page"
				}));
			}

			// Nth
			if (page.nth) {
				let nthlist = new csstree.List();
				let nth = this.getNth(page.nth);

				nthlist.insert(nthlist.createItem(nth));

				selectors.insert(selectors.createItem({
					type: 'PseudoClassSelector',
					name: 'nth-of-type',
					children: nthlist
				}));
			}

			selectors.insert(selectors.createItem({
				type: 'Combinator',
				name: " "
			}));

			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: "pagedjs_margin-" + loc
			}));

			selectors.insert(selectors.createItem({
				type: 'Combinator',
				name: ">"
			}));

			selectors.insert(selectors.createItem({
				type: 'ClassSelector',
				name: "pagedjs_margin-content"
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
				block: content
			});

			// list.append(rule);
			sheet.insertRule(rule);
		}
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

	getNth(nth) {
		let n = nth.indexOf("n");
		let plus = nth.indexOf("+");
		let splitN = nth.split("n");
		let splitP = nth.split("+");
		let a = null;
		let b = null;
		if (n > -1) {
			a = splitN[0];
			if (plus > -1) {
				b = splitP[1];
			}
		} else {
			b = nth;
		}

		return {
			type: 'Nth',
			loc: null,
			selector: null,
			nth: {
				type: "AnPlusB",
				loc: null,
				a: a,
				b: b
			}
		}
	}

	addPageAttributes(page, start, pages) {
		let named = start.dataset.page;

		if (named) {
			page.name = named;
			page.element.classList.add("pagedjs_" + named + "_page");

			let prev = pages.length > 1 && pages[page.position-1];
			if (prev && prev.name !== named) {
				page.element.classList.add("pagedjs_" + named + "_first_page");
			}
		}
	}

	getStartElement(content, breakToken) {
		let start = content;
		let node = breakToken.node;
		let index, ref, parent;

		// No break
		if (!node) {
			return content.children[0];
		}

		// Top level element
		if (node.nodeType === 1 && node.parentNode.nodeType === 11) {
			return node;
		}

		// Named page
		if (node.nodeType === 1 && node.dataset.page) {
			return node;
		}

		// Get top level Named parent
		let fragment = rebuildAncestors(node);
		let pages = fragment.querySelectorAll("[data-page]");

		if (pages.length) {
			return pages[pages.length - 1];
		} else {
			return fragment.children[0];
		}
	}

	beforePageLayout(page, contents, breakToken, chunker) {
		let start = this.getStartElement(contents, breakToken);
		if (start) {
			this.addPageAttributes(page, start, chunker.pages);
		}
	}

}

export default AtPage;

import Handler from "../handler.js";
import csstree from "css-tree";
import pageSizes from "../../polisher/sizes.js";
import { rebuildAncestors } from "../../utils/dom.js";
import { CSSValueToString } from "../../utils/utils.js";

class AtPage extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.pages = {};

		this.width = undefined;
		this.height = undefined;
		this.orientation = undefined;
		this.marginalia = {};
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
			margin: {
				top: {},
				right: {},
				left: {},
				bottom: {}
			},
			padding: {
				top: {},
				right: {},
				left: {},
				bottom: {}
			},
			border: {
				top: {},
				right: {},
				left: {},
				bottom: {}
			},
			backgroundOrigin: undefined,
			block: {},
			marks: undefined,
			notes: undefined,
			added: false
		};
	}

	// Find and Remove @page rules
	onAtPage(node, item, list) {
		let page, marginalia;
		let selector = "";
		let named, psuedo, nth;
		let needsMerge = false;

		if (node.prelude) {
			named = this.getTypeSelector(node);
			psuedo = this.getPsuedoSelector(node);
			nth = this.getNthSelector(node);
			selector = csstree.generate(node.prelude);
		} else {
			selector = "*";
		}

		if (selector in this.pages) {
			// this.pages[selector] = Object.assign(this.pages[selector], page);
			// console.log("after", selector, this.pages[selector]);

			// this.pages[selector].added = false;
			page = this.pages[selector];
			marginalia = this.replaceMarginalia(node);
			needsMerge = true;
			// Mark page for getting classes added again
			page.added = false;
		} else {
			page = this.pageModel(selector);
			marginalia = this.replaceMarginalia(node);
			this.pages[selector] = page;
		}

		page.name = named;
		page.psuedo = psuedo;
		page.nth = nth;

		if (needsMerge) {
			page.marginalia = Object.assign(page.marginalia, marginalia);
		} else {
			page.marginalia = marginalia;
		}

		let notes = this.replaceNotes(node);
		page.notes = notes;

		let declarations = this.replaceDeclarations(node);

		if (declarations.size) {
			page.size = declarations.size;
			page.width = declarations.size.width;
			page.height = declarations.size.height;
			page.orientation = declarations.size.orientation;
			page.format = declarations.size.format;
		}

		if (declarations.bleed && declarations.bleed[0] != "auto") {
			switch (declarations.bleed.length) {
				case 4: // top right bottom left
					page.bleed = {
						top: declarations.bleed[0],
						right: declarations.bleed[1],
						bottom: declarations.bleed[2],
						left: declarations.bleed[3]
					};
					break;
				case 3: // top right bottom right
					page.bleed = {
						top: declarations.bleed[0],
						right: declarations.bleed[1],
						bottom: declarations.bleed[2],
						left: declarations.bleed[1]
					};
					break;
				case 2: // top right top right
					page.bleed = {
						top: declarations.bleed[0],
						right: declarations.bleed[1],
						bottom: declarations.bleed[0],
						left: declarations.bleed[1]
					};
					break;
				default:
					page.bleed = {
						top: declarations.bleed[0],
						right: declarations.bleed[0],
						bottom: declarations.bleed[0],
						left: declarations.bleed[0]
					};
			}
		}

		if (declarations.marks) {
			if (!declarations.bleed || declarations.bleed && declarations.bleed[0] === "auto") {
				// Spec say 6pt, but needs more space for marks
				page.bleed = {
					top: { value: 6, unit: "mm" },
					right: { value: 6, unit: "mm" },
					bottom: { value: 6, unit: "mm" },
					left: { value: 6, unit: "mm" }
				};
			}

			page.marks = declarations.marks;
		}

		if (declarations.margin) {
			page.margin = declarations.margin;
		}
		if (declarations.padding) {
			page.padding = declarations.padding;
		}

		if (declarations.border) {
			page.border = declarations.border;
		}

		if (declarations.marks) {
			page.marks = declarations.marks;
		}

		if (needsMerge) {
			page.block.children.appendList(node.block.children);
		} else {
			page.block = node.block;
		}

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
		let dirtyPage = "*" in this.pages && this.pages["*"].added === false;

		this.addPageClasses(this.pages, ast, sheet);

		if (dirtyPage) {
			let width = this.pages["*"].width;
			let height = this.pages["*"].height;
			let format = this.pages["*"].format;
			let orientation = this.pages["*"].orientation;
			let bleed = this.pages["*"].bleed;
			let marks = this.pages["*"].marks;
			let bleedverso = undefined;
			let bleedrecto = undefined;

			if (":left" in this.pages) {
				bleedverso = this.pages[":left"].bleed;
			}

			if (":right" in this.pages) {
				bleedrecto = this.pages[":right"].bleed;
			}

			if ((width && height) &&
				(this.width !== width || this.height !== height)) {
				this.width = width;
				this.height = height;
				this.format = format;
				this.orientation = orientation;

				this.addRootVars(ast, width, height, orientation, bleed, bleedrecto, bleedverso, marks);
				this.addRootPage(ast, this.pages["*"].size, bleed, bleedrecto, bleedverso);

				this.emit("size", { width, height, orientation, format, bleed });
				this.emit("atpages", this.pages);
			}

		}
	}

	getTypeSelector(ast) {
		// Find page name
		let name;

		csstree.walk(ast, {
			visit: "TypeSelector",
			enter: (node, item, list) => {
				name = node.name;
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
		const MARGINS = [
			"top-left-corner", "top-left", "top", "top-center", "top-right", "top-right-corner",
			"bottom-left-corner", "bottom-left", "bottom", "bottom-center", "bottom-right", "bottom-right-corner",
			"left-top", "left-middle", "left", "left-bottom", "top-right-corner",
			"right-top", "right-middle", "right", "right-bottom", "right-right-corner"
		];
		csstree.walk(ast.block, {
			visit: "Atrule",
			enter: (node, item, list) => {
				let name = node.name;
				if (MARGINS.includes(name)) {
					if (name === "top") {
						name = "top-center";
					}
					if (name === "right") {
						name = "right-middle";
					}
					if (name === "left") {
						name = "left-middle";
					}
					if (name === "bottom") {
						name = "bottom-center";
					}
					parsed[name] = node.block;
					list.remove(item);
				}
			}
		});

		return parsed;
	}

	replaceNotes(ast) {
		let parsed = {};

		csstree.walk(ast.block, {
			visit: "Atrule",
			enter: (node, item, list) => {
				let name = node.name;
				if (name === "footnote") {
					parsed[name] = node.block;
					list.remove(item);
				}
			}
		});

		return parsed;
	}

	replaceDeclarations(ast) {
		let parsed = {};

		csstree.walk(ast.block, {
			visit: "Declaration",
			enter: (declaration, dItem, dList) => {
				let prop = csstree.property(declaration.property).name;
				// let value = declaration.value;

				if (prop === "marks") {
					parsed.marks = [];
					csstree.walk(declaration, {
						visit: "Identifier",
						enter: (ident) => {
							parsed.marks.push(ident.name);
						}
					});
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

				} else if (prop === "padding") {
					parsed.padding = this.getPaddings(declaration.value);
					dList.remove(dItem);

				} else if (prop.indexOf("padding-") === 0) {
					let p = prop.substring("padding-".length);
					if (!parsed.padding) {
						parsed.padding = {
							top: {},
							right: {},
							left: {},
							bottom: {}
						};
					}
					parsed.padding[p] = declaration.value.children.first();
					dList.remove(dItem);
				}

				else if (prop === "border") {
					if (!parsed.border) {
						parsed.border = {
							top: {},
							right: {},
							left: {},
							bottom: {}
						};
					}
					parsed.border.top = csstree.generate(declaration.value);
					parsed.border.right = csstree.generate(declaration.value);
					parsed.border.left = csstree.generate(declaration.value);
					parsed.border.bottom = csstree.generate(declaration.value);

					dList.remove(dItem);

				}

				else if (prop.indexOf("border-") === 0) {
					if (!parsed.border) {
						parsed.border = {
							top: {},
							right: {},
							left: {},
							bottom: {}
						};
					}
					let p = prop.substring("border-".length);

					parsed.border[p] = csstree.generate(declaration.value);
					dList.remove(dItem);

				}

				else if (prop === "size") {
					parsed.size = this.getSize(declaration);
					dList.remove(dItem);
				} else if (prop === "bleed") {
					parsed.bleed = [];

					csstree.walk(declaration, {
						enter: (subNode) => {
							switch (subNode.type) {
								case "String": // bleed: "auto"
									if (subNode.value.indexOf("auto") > -1) {
										parsed.bleed.push("auto");
									}
									break;
								case "Dimension": // bleed: 1in 2in, bleed: 20px ect.
									parsed.bleed.push({
										value: subNode.value,
										unit: subNode.unit
									});
									break;
								case "Number":
									parsed.bleed.push({
										value: subNode.value,
										unit: "px"
									});
									break;
								default:
								// ignore
							}

						}
					});

					dList.remove(dItem);
				}

			}
		});

		return parsed;

	}
	getSize(declaration) {
		let width, height, orientation, format;

		// Get size: Xmm Ymm
		csstree.walk(declaration, {
			visit: "Dimension",
			enter: (node, item, list) => {
				let { value, unit } = node;
				if (typeof width === "undefined") {
					width = { value, unit };
				} else if (typeof height === "undefined") {
					height = { value, unit };
				}
			}
		});

		// Get size: "A4"
		csstree.walk(declaration, {
			visit: "String",
			enter: (node, item, list) => {
				let name = node.value.replace(/["|']/g, "");
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
					format = name;
				}
			}
		});

		return {
			width,
			height,
			orientation,
			format
		};
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
			enter: (node) => {
				switch (node.type) {
					case "Dimension": // margin: 1in 2in, margin: 20px, etc...
						margins.push(node);
						break;
					case "Number": // margin: 0
						margins.push({value: node.value, unit: "px"});
						break;
					default:
					// ignore
				}
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

	getPaddings(declaration) {
		let paddings = [];
		let padding = {
			top: {},
			right: {},
			left: {},
			bottom: {}
		};

		csstree.walk(declaration, {
			enter: (node) => {
				switch (node.type) {
					case "Dimension": // padding: 1in 2in, padding: 20px, etc...
						paddings.push(node);
						break;
					case "Number": // padding: 0
						paddings.push({value: node.value, unit: "px"});
						break;
					default:
					// ignore
				}
			}
		});
		if (paddings.length === 1) {
			for (let p in padding) {
				padding[p] = paddings[0];
			}
		} else if (paddings.length === 2) {

			padding.top = paddings[0];
			padding.right = paddings[1];
			padding.bottom = paddings[0];
			padding.left = paddings[1];
		} else if (paddings.length === 3) {

			padding.top = paddings[0];
			padding.right = paddings[1];
			padding.bottom = paddings[2];
			padding.left = paddings[1];
		} else if (paddings.length === 4) {

			padding.top = paddings[0];
			padding.right = paddings[1];
			padding.bottom = paddings[2];
			padding.left = paddings[3];
		}
		return padding;
	}

	// get values for the border on the @page to pass them to the element with the .pagedjs_area class
	getBorders(declaration) {
		let border = {
			top: {},
			right: {},
			left: {},
			bottom: {}
		};

		if (declaration.prop == "border") {
			border.top = csstree.generate(declaration.value);
			border.right = csstree.generate(declaration.value);
			border.bottom = csstree.generate(declaration.value);
			border.left = csstree.generate(declaration.value);

		}
		else if (declaration.prop == "border-top") {
			border.top = csstree.generate(declaration.value);
		}
		else if (declaration.prop == "border-right") {
			border.right = csstree.generate(declaration.value);

		}
		else if (declaration.prop == "border-bottom") {
			border.bottom = csstree.generate(declaration.value);

		}
		else if (declaration.prop == "border-left") {
			border.left = csstree.generate(declaration.value);
		}

		return border;
	}


	addPageClasses(pages, ast, sheet) {
		// First add * page
		if ("*" in pages && pages["*"].added === false) {
			let p = this.createPage(pages["*"], ast.children, sheet);
			sheet.insertRule(p);
			pages["*"].added = true;
		}
		// Add :left & :right
		if (":left" in pages && pages[":left"].added === false) {
			let left = this.createPage(pages[":left"], ast.children, sheet);
			sheet.insertRule(left);
			pages[":left"].added = true;
		}
		if (":right" in pages && pages[":right"].added === false) {
			let right = this.createPage(pages[":right"], ast.children, sheet);
			sheet.insertRule(right);
			pages[":right"].added = true;
		}
		// Add :first & :blank
		if (":first" in pages && pages[":first"].added === false) {
			let first = this.createPage(pages[":first"], ast.children, sheet);
			sheet.insertRule(first);
			pages[":first"].added = true;
		}
		if (":blank" in pages && pages[":blank"].added === false) {
			let blank = this.createPage(pages[":blank"], ast.children, sheet);
			sheet.insertRule(blank);
			pages[":blank"].added = true;
		}
		// Add nth pages
		for (let pg in pages) {
			if (pages[pg].nth && pages[pg].added === false) {
				let nth = this.createPage(pages[pg], ast.children, sheet);
				sheet.insertRule(nth);
				pages[pg].added = true;
			}
		}

		// Add named pages
		for (let pg in pages) {
			if (pages[pg].name && pages[pg].added === false) {
				let named = this.createPage(pages[pg], ast.children, sheet);
				sheet.insertRule(named);
				pages[pg].added = true;
			}
		}

	}

	createPage(page, ruleList, sheet) {

		let selectors = this.selectorsForPage(page);
		let children = page.block.children.copy();
		let block = {
			type: "Block",
			loc: 0,
			children: children
		};


		let rule = this.createRule(selectors, block);

		this.addMarginVars(page.margin, children, children.first());
		this.addPaddingVars(page.padding, children, children.first());
		this.addBorderVars(page.border, children, children.first());


		if (page.width) {
			this.addDimensions(page.width, page.height, page.orientation, children, children.first());
		}

		if (page.marginalia) {
			this.addMarginaliaStyles(page, ruleList, rule, sheet);
			this.addMarginaliaContent(page, ruleList, rule, sheet);
		}

		if(page.notes) {
			this.addNotesStyles(page.notes, page, ruleList, rule, sheet);
		}

		return rule;
	}

	addMarginVars(margin, list, item) {
		// variables for margins
		for (let m in margin) {
			if (typeof margin[m].value !== "undefined") {
				let value = margin[m].value + (margin[m].unit || "");
				let mVar = list.createItem({
					type: "Declaration",
					property: "--pagedjs-margin-" + m,
					value: {
						type: "Raw",
						value: value
					}
				});
				list.append(mVar, item);

			}
		}
	}

	addPaddingVars(padding, list, item) {
		// variables for padding
		for (let p in padding) {

			if (typeof padding[p].value !== "undefined") {
				let value = padding[p].value + (padding[p].unit || "");
				let pVar = list.createItem({
					type: "Declaration",
					property: "--pagedjs-padding-" + p,
					value: {
						type: "Raw",
						value: value
					}
				});

				list.append(pVar, item);
			}

		}
	}

	addBorderVars(border, list, item) {
		// variables for borders
		for (const name of Object.keys(border)) {
			const value = border[name];
			// value is an empty object when undefined
			if (typeof value === "string") {
				const borderItem = list.createItem({
					type: "Declaration",
					property: "--pagedjs-border-" + name,
					value: {
						type: "Raw",
						value: value
					}
				});
				list.append(borderItem, item);
			}
		}
	}

	addDimensions(width, height, orientation, list, item) {
		let widthString, heightString;

		widthString = CSSValueToString(width);
		heightString = CSSValueToString(height);

		if (orientation && orientation !== "portrait") {
			// reverse for orientation
			[widthString, heightString] = [heightString, widthString];
		}

		// width variable
		let wVar = this.createVariable("--pagedjs-pagebox-width", widthString);
		list.appendData(wVar);

		// height variable
		let hVar = this.createVariable("--pagedjs-pagebox-height", heightString);
		list.appendData(hVar);

		// let w = this.createDimension("width", width);
		// let h = this.createDimension("height", height);
		// list.appendData(w);
		// list.appendData(h);
	}

	addMarginaliaStyles(page, list, item, sheet) {
		for (let loc in page.marginalia) {
			let block = csstree.clone(page.marginalia[loc]);
			let hasContent = false;

			if (block.children.isEmpty()) {
				continue;
			}

			csstree.walk(block, {
				visit: "Declaration",
				enter: (node, item, list) => {
					if (node.property === "content") {
						if (node.value.children && node.value.children.first().name === "none") {
							hasContent = false;
						} else {
							hasContent = true;
						}
						list.remove(item);
					}
					if (node.property === "vertical-align") {
						csstree.walk(node, {
							visit: "Identifier",
							enter: (identNode, identItem, identlist) => {
								let name = identNode.name;
								if (name === "top") {
									identNode.name = "flex-start";
								} else if (name === "middle") {
									identNode.name = "center";
								} else if (name === "bottom") {
									identNode.name = "flex-end";
								}
							}
						});
						node.property = "align-items";
					}

					if (node.property === "width" &&
						(loc === "top-left" ||
							loc === "top-center" ||
							loc === "top-right" ||
							loc === "bottom-left" ||
							loc === "bottom-center" ||
							loc === "bottom-right")) {
						let c = csstree.clone(node);
						c.property = "max-width";
						list.appendData(c);
					}

					if (node.property === "height" &&
						(loc === "left-top" ||
							loc === "left-middle" ||
							loc === "left-bottom" ||
							loc === "right-top" ||
							loc === "right-middle" ||
							loc === "right-bottom")) {
						let c = csstree.clone(node);
						c.property = "max-height";
						list.appendData(c);
					}
				}
			});

			let marginSelectors = this.selectorsForPageMargin(page, loc);
			let marginRule = this.createRule(marginSelectors, block);

			list.appendData(marginRule);

			let sel = csstree.generate({
				type: "Selector",
				children: marginSelectors
			});

			this.marginalia[sel] = {
				page: page,
				selector: sel,
				block: page.marginalia[loc],
				hasContent: hasContent
			};

		}
	}

	addMarginaliaContent(page, list, item, sheet) {
		let displayNone;
		// Just content
		for (let loc in page.marginalia) {
			let content = csstree.clone(page.marginalia[loc]);
			csstree.walk(content, {
				visit: "Declaration",
				enter: (node, item, list) => {
					if (node.property !== "content") {
						list.remove(item);
					}

					if (node.value.children && node.value.children.first().name === "none") {
						displayNone = true;
					}
				}
			});

			if (content.children.isEmpty()) {
				continue;
			}

			let displaySelectors = this.selectorsForPageMargin(page, loc);
			let displayDeclaration;

			displaySelectors.insertData({
				type: "Combinator",
				name: ">"
			});

			displaySelectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_margin-content"
			});

			displaySelectors.insertData({
				type: "Combinator",
				name: ">"
			});

			displaySelectors.insertData({
				type: "TypeSelector",
				name: "*"
			});

			if (displayNone) {
				displayDeclaration = this.createDeclaration("display", "none");
			} else {
				displayDeclaration = this.createDeclaration("display", "block");
			}

			let displayRule = this.createRule(displaySelectors, [displayDeclaration]);
			sheet.insertRule(displayRule);

			// insert content rule
			let contentSelectors = this.selectorsForPageMargin(page, loc);

			contentSelectors.insertData({
				type: "Combinator",
				name: ">"
			});

			contentSelectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_margin-content"
			});

			contentSelectors.insertData({
				type: "PseudoElementSelector",
				name: "after",
				children: null
			});

			let contentRule = this.createRule(contentSelectors, content);
			sheet.insertRule(contentRule);
		}
	}

	addRootVars(ast, width, height, orientation, bleed, bleedrecto, bleedverso, marks) {
		let rules = [];
		let selectors = new csstree.List();
		selectors.insertData({
			type: "PseudoClassSelector",
			name: "root",
			children: null
		});

		let widthString, heightString;
		let widthStringRight, heightStringRight;
		let widthStringLeft, heightStringLeft;

		if (!bleed) {
			widthString = CSSValueToString(width);
			heightString = CSSValueToString(height);
			widthStringRight = CSSValueToString(width);
			heightStringRight = CSSValueToString(height);
			widthStringLeft = CSSValueToString(width);
			heightStringLeft = CSSValueToString(height);
		} else {
			widthString = `calc( ${CSSValueToString(width)} + ${CSSValueToString(bleed.left)} + ${CSSValueToString(bleed.right)} )`;
			heightString = `calc( ${CSSValueToString(height)} + ${CSSValueToString(bleed.top)} + ${CSSValueToString(bleed.bottom)} )`;

			widthStringRight = `calc( ${CSSValueToString(width)} + ${CSSValueToString(bleed.left)} + ${CSSValueToString(bleed.right)} )`;
			heightStringRight = `calc( ${CSSValueToString(height)} + ${CSSValueToString(bleed.top)} + ${CSSValueToString(bleed.bottom)} )`;

			widthStringLeft = `calc( ${CSSValueToString(width)} + ${CSSValueToString(bleed.left)} + ${CSSValueToString(bleed.right)} )`;
			heightStringLeft = `calc( ${CSSValueToString(height)} + ${CSSValueToString(bleed.top)} + ${CSSValueToString(bleed.bottom)} )`;

			let bleedTop = this.createVariable("--pagedjs-bleed-top", CSSValueToString(bleed.top));
			let bleedRight = this.createVariable("--pagedjs-bleed-right", CSSValueToString(bleed.right));
			let bleedBottom = this.createVariable("--pagedjs-bleed-bottom", CSSValueToString(bleed.bottom));
			let bleedLeft = this.createVariable("--pagedjs-bleed-left", CSSValueToString(bleed.left));

			let bleedTopRecto = this.createVariable("--pagedjs-bleed-right-top", CSSValueToString(bleed.top));
			let bleedRightRecto = this.createVariable("--pagedjs-bleed-right-right", CSSValueToString(bleed.right));
			let bleedBottomRecto = this.createVariable("--pagedjs-bleed-right-bottom", CSSValueToString(bleed.bottom));
			let bleedLeftRecto = this.createVariable("--pagedjs-bleed-right-left", CSSValueToString(bleed.left));

			let bleedTopVerso = this.createVariable("--pagedjs-bleed-left-top", CSSValueToString(bleed.top));
			let bleedRightVerso = this.createVariable("--pagedjs-bleed-left-right", CSSValueToString(bleed.right));
			let bleedBottomVerso = this.createVariable("--pagedjs-bleed-left-bottom", CSSValueToString(bleed.bottom));
			let bleedLeftVerso = this.createVariable("--pagedjs-bleed-left-left", CSSValueToString(bleed.left));

			if (bleedrecto) {
				bleedTopRecto = this.createVariable("--pagedjs-bleed-right-top", CSSValueToString(bleedrecto.top));
				bleedRightRecto = this.createVariable("--pagedjs-bleed-right-right", CSSValueToString(bleedrecto.right));
				bleedBottomRecto = this.createVariable("--pagedjs-bleed-right-bottom", CSSValueToString(bleedrecto.bottom));
				bleedLeftRecto = this.createVariable("--pagedjs-bleed-right-left", CSSValueToString(bleedrecto.left));

				widthStringRight = `calc( ${CSSValueToString(width)} + ${CSSValueToString(bleedrecto.left)} + ${CSSValueToString(bleedrecto.right)} )`;
				heightStringRight = `calc( ${CSSValueToString(height)} + ${CSSValueToString(bleedrecto.top)} + ${CSSValueToString(bleedrecto.bottom)} )`;
			}
			if (bleedverso) {
				bleedTopVerso = this.createVariable("--pagedjs-bleed-left-top", CSSValueToString(bleedverso.top));
				bleedRightVerso = this.createVariable("--pagedjs-bleed-left-right", CSSValueToString(bleedverso.right));
				bleedBottomVerso = this.createVariable("--pagedjs-bleed-left-bottom", CSSValueToString(bleedverso.bottom));
				bleedLeftVerso = this.createVariable("--pagedjs-bleed-left-left", CSSValueToString(bleedverso.left));

				widthStringLeft = `calc( ${CSSValueToString(width)} + ${CSSValueToString(bleedverso.left)} + ${CSSValueToString(bleedverso.right)} )`;
				heightStringLeft = `calc( ${CSSValueToString(height)} + ${CSSValueToString(bleedverso.top)} + ${CSSValueToString(bleedverso.bottom)} )`;
			}

			let pageWidthVar = this.createVariable("--pagedjs-width", CSSValueToString(width));
			let pageHeightVar = this.createVariable("--pagedjs-height", CSSValueToString(height));

			rules.push(
				bleedTop,
				bleedRight,
				bleedBottom,
				bleedLeft,
				bleedTopRecto,
				bleedRightRecto,
				bleedBottomRecto,
				bleedLeftRecto,
				bleedTopVerso,
				bleedRightVerso,
				bleedBottomVerso,
				bleedLeftVerso,
				pageWidthVar,
				pageHeightVar
			);
		}

		if (marks) {
			marks.forEach((mark) => {
				let markDisplay = this.createVariable("--pagedjs-mark-" + mark + "-display", "block");
				rules.push(markDisplay);
			});
		}

		// orientation variable
		if (orientation) {
			let oVar = this.createVariable("--pagedjs-orientation", orientation);
			rules.push(oVar);

			if (orientation !== "portrait") {
				// reverse for orientation
				[widthString, heightString] = [heightString, widthString];
				[widthStringRight, heightStringRight] = [heightStringRight, widthStringRight];
				[widthStringLeft, heightStringLeft] = [heightStringLeft, widthStringLeft];
			}
		}

		let wVar = this.createVariable("--pagedjs-width", widthString);
		let hVar = this.createVariable("--pagedjs-height", heightString);

		let wVarR = this.createVariable("--pagedjs-width-right", widthStringRight);
		let hVarR = this.createVariable("--pagedjs-height-right", heightStringRight);

		let wVarL = this.createVariable("--pagedjs-width-left", widthStringLeft);
		let hVarL = this.createVariable("--pagedjs-height-left", heightStringLeft);

		rules.push(wVar, hVar, wVarR, hVarR, wVarL, hVarL);

		let rule = this.createRule(selectors, rules);

		ast.children.appendData(rule);
	}


	addNotesStyles(notes, page, list, item, sheet) {

		for (const note in notes) {
			let selectors = this.selectorsForPage(page);

			selectors.insertData({
				type: "Combinator",
				name: " "
			});

			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_" + note + "_content"
			});

			let notesRule = this.createRule(selectors, notes[note]);

			list.appendData(notesRule);
		}

	}

	/*
	@page {
		size: var(--pagedjs-width) var(--pagedjs-height);
		margin: 0;
		padding: 0;
	}
	*/
	addRootPage(ast, size, bleed, bleedrecto, bleedverso) {
		let { width, height, orientation, format } = size;
		let children = new csstree.List();
		let childrenLeft = new csstree.List();
		let childrenRight = new csstree.List();
		let dimensions = new csstree.List();
		let dimensionsLeft = new csstree.List();
		let dimensionsRight = new csstree.List();

		if (bleed) {
			let widthCalculations = new csstree.List();
			let heightCalculations = new csstree.List();

			// width
			widthCalculations.appendData({
				type: "Dimension",
				unit: width.unit,
				value: width.value
			});

			widthCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculations.appendData({
				type: "Operator",
				value: "+"
			});

			widthCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculations.appendData({
				type: "Dimension",
				unit: bleed.left.unit,
				value: bleed.left.value
			});

			widthCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculations.appendData({
				type: "Operator",
				value: "+"
			});

			widthCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculations.appendData({
				type: "Dimension",
				unit: bleed.right.unit,
				value: bleed.right.value
			});

			// height
			heightCalculations.appendData({
				type: "Dimension",
				unit: height.unit,
				value: height.value
			});

			heightCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculations.appendData({
				type: "Operator",
				value: "+"
			});

			heightCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculations.appendData({
				type: "Dimension",
				unit: bleed.top.unit,
				value: bleed.top.value
			});

			heightCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculations.appendData({
				type: "Operator",
				value: "+"
			});

			heightCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculations.appendData({
				type: "Dimension",
				unit: bleed.bottom.unit,
				value: bleed.bottom.value
			});

			dimensions.appendData({
				type: "Function",
				name: "calc",
				children: widthCalculations
			});

			dimensions.appendData({
				type: "WhiteSpace",
				value: " "
			});

			dimensions.appendData({
				type: "Function",
				name: "calc",
				children: heightCalculations
			});

		} else if (format) {
			dimensions.appendData({
				type: "Identifier",
				name: format
			});

			if (orientation) {
				dimensions.appendData({
					type: "WhiteSpace",
					value: " "
				});

				dimensions.appendData({
					type: "Identifier",
					name: orientation
				});
			}
		} else {
			dimensions.appendData({
				type: "Dimension",
				unit: width.unit,
				value: width.value
			});

			dimensions.appendData({
				type: "WhiteSpace",
				value: " "
			});

			dimensions.appendData({
				type: "Dimension",
				unit: height.unit,
				value: height.value
			});
		}

		children.appendData({
			type: "Declaration",
			property: "size",
			loc: null,
			value: {
				type: "Value",
				children: dimensions
			}
		});

		children.appendData({
			type: "Declaration",
			property: "margin",
			loc: null,
			value: {
				type: "Value",
				children: [{
					type: "Dimension",
					unit: "px",
					value: 0
				}]
			}
		});

		children.appendData({
			type: "Declaration",
			property: "padding",
			loc: null,
			value: {
				type: "Value",
				children: [{
					type: "Dimension",
					unit: "px",
					value: 0
				}]
			}
		});

		children.appendData({
			type: "Declaration",
			property: "padding",
			loc: null,
			value: {
				type: "Value",
				children: [{
					type: "Dimension",
					unit: "px",
					value: 0
				}]
			}
		});

		let rule = ast.children.createItem({
			type: "Atrule",
			prelude: null,
			name: "page",
			block: {
				type: "Block",
				loc: null,
				children: children
			}
		});

		ast.children.append(rule);

		if (bleedverso) {
			let widthCalculationsLeft = new csstree.List();
			let heightCalculationsLeft = new csstree.List();

			// width
			widthCalculationsLeft.appendData({
				type: "Dimension",
				unit: width.unit,
				value: width.value
			});

			widthCalculationsLeft.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculationsLeft.appendData({
				type: "Operator",
				value: "+"
			});

			widthCalculationsLeft.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculationsLeft.appendData({
				type: "Dimension",
				unit: bleedverso.left.unit,
				value: bleedverso.left.value
			});

			widthCalculationsLeft.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculationsLeft.appendData({
				type: "Operator",
				value: "+"
			});

			widthCalculationsLeft.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculationsLeft.appendData({
				type: "Dimension",
				unit: bleedverso.right.unit,
				value: bleedverso.right.value
			});

			// height
			heightCalculationsLeft.appendData({
				type: "Dimension",
				unit: height.unit,
				value: height.value
			});

			heightCalculationsLeft.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculationsLeft.appendData({
				type: "Operator",
				value: "+"
			});

			heightCalculationsLeft.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculationsLeft.appendData({
				type: "Dimension",
				unit: bleedverso.top.unit,
				value: bleedverso.top.value
			});

			heightCalculationsLeft.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculationsLeft.appendData({
				type: "Operator",
				value: "+"
			});

			heightCalculationsLeft.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculationsLeft.appendData({
				type: "Dimension",
				unit: bleedverso.bottom.unit,
				value: bleedverso.bottom.value
			});

			dimensionsLeft.appendData({
				type: "Function",
				name: "calc",
				children: widthCalculationsLeft
			});

			dimensionsLeft.appendData({
				type: "WhiteSpace",
				value: " "
			});

			dimensionsLeft.appendData({
				type: "Function",
				name: "calc",
				children: heightCalculationsLeft
			});

			childrenLeft.appendData({
				type: "Declaration",
				property: "size",
				loc: null,
				value: {
					type: "Value",
					children: dimensionsLeft
				}
			});

			let ruleLeft = ast.children.createItem({
				type: "Atrule",
				prelude: null,
				name: "page :left",
				block: {
					type: "Block",
					loc: null,
					children: childrenLeft
				}
			});

			ast.children.append(ruleLeft);

		}

		if (bleedrecto) {
			let widthCalculationsRight = new csstree.List();
			let heightCalculationsRight = new csstree.List();

			// width
			widthCalculationsRight.appendData({
				type: "Dimension",
				unit: width.unit,
				value: width.value
			});

			widthCalculationsRight.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculationsRight.appendData({
				type: "Operator",
				value: "+"
			});

			widthCalculationsRight.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculationsRight.appendData({
				type: "Dimension",
				unit: bleedrecto.left.unit,
				value: bleedrecto.left.value
			});

			widthCalculationsRight.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculationsRight.appendData({
				type: "Operator",
				value: "+"
			});

			widthCalculationsRight.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculationsRight.appendData({
				type: "Dimension",
				unit: bleedrecto.right.unit,
				value: bleedrecto.right.value
			});

			// height
			heightCalculationsRight.appendData({
				type: "Dimension",
				unit: height.unit,
				value: height.value
			});

			heightCalculationsRight.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculationsRight.appendData({
				type: "Operator",
				value: "+"
			});

			heightCalculationsRight.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculationsRight.appendData({
				type: "Dimension",
				unit: bleedrecto.top.unit,
				value: bleedrecto.top.value
			});

			heightCalculationsRight.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculationsRight.appendData({
				type: "Operator",
				value: "+"
			});

			heightCalculationsRight.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculationsRight.appendData({
				type: "Dimension",
				unit: bleedrecto.bottom.unit,
				value: bleedrecto.bottom.value
			});

			dimensionsRight.appendData({
				type: "Function",
				name: "calc",
				children: widthCalculationsRight
			});

			dimensionsRight.appendData({
				type: "WhiteSpace",
				value: " "
			});

			dimensionsRight.appendData({
				type: "Function",
				name: "calc",
				children: heightCalculationsRight
			});

			childrenRight.appendData({
				type: "Declaration",
				property: "size",
				loc: null,
				value: {
					type: "Value",
					children: dimensionsRight
				}
			});

			let ruleRight = ast.children.createItem({
				type: "Atrule",
				prelude: null,
				name: "page :right",
				block: {
					type: "Block",
					loc: null,
					children: childrenRight
				}
			});

			ast.children.append(ruleRight);

		}
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
			type: "Nth",
			loc: null,
			selector: null,
			nth: {
				type: "AnPlusB",
				loc: null,
				a: a,
				b: b
			}
		};
	}

	addPageAttributes(page, start, pages) {
		let namedPages = [start.dataset.page];

		if (namedPages && namedPages.length) {
			for (const named of namedPages) {
				if (!named) {
					continue;
				}
				page.name = named;
				page.element.classList.add("pagedjs_named_page");
				page.element.classList.add("pagedjs_" + named + "_page");

				if (!start.dataset.splitFrom) {
					page.element.classList.add("pagedjs_" + named + "_first_page");
				}
			}
		}
	}

	getStartElement(content, breakToken) {
		let node = breakToken && breakToken.node;

		if (!content && !breakToken) {
			return;
		}

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
		// page.element.querySelector('.paged_area').style.color = red;
	}

	finalizePage(fragment, page, breakToken, chunker) {
		for (let m in this.marginalia) {
			let margin = this.marginalia[m];
			let sels = m.split(" ");

			let content;
			if (page.element.matches(sels[0]) && margin.hasContent) {
				content = page.element.querySelector(sels[1]);
				content.classList.add("hasContent");
			}
		}

		// check center
		["top", "bottom"].forEach((loc) => {
			let marginGroup = page.element.querySelector(".pagedjs_margin-" + loc);
			let center = page.element.querySelector(".pagedjs_margin-" + loc + "-center");
			let left = page.element.querySelector(".pagedjs_margin-" + loc + "-left");
			let right = page.element.querySelector(".pagedjs_margin-" + loc + "-right");

			let centerContent = center.classList.contains("hasContent");
			let leftContent = left.classList.contains("hasContent");
			let rightContent = right.classList.contains("hasContent");
			let centerWidth, leftWidth, rightWidth;

			if (leftContent) {
				leftWidth = window.getComputedStyle(left)["max-width"];
			}

			if (rightContent) {
				rightWidth = window.getComputedStyle(right)["max-width"];
			}


			if (centerContent) {
				centerWidth = window.getComputedStyle(center)["max-width"];

				if (centerWidth === "none" || centerWidth === "auto") {
					if (!leftContent && !rightContent) {
						marginGroup.style["grid-template-columns"] = "0 1fr 0";
					} else if (leftContent) {
						if (!rightContent) {
							if (leftWidth !== "none" && leftWidth !== "auto") {
								marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + leftWidth;
							} else {
								marginGroup.style["grid-template-columns"] = "auto auto 1fr";
								left.style["white-space"] = "nowrap";
								center.style["white-space"] = "nowrap";
								let leftOuterWidth = left.offsetWidth;
								let centerOuterWidth = center.offsetWidth;
								let outerwidths = leftOuterWidth + centerOuterWidth;
								let newcenterWidth = centerOuterWidth * 100 / outerwidths;
								marginGroup.style["grid-template-columns"] = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
								left.style["white-space"] = "normal";
								center.style["white-space"] = "normal";
							}
						} else {
							if (leftWidth !== "none" && leftWidth !== "auto") {
								if (rightWidth !== "none" && rightWidth !== "auto") {
									marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + rightWidth;
								} else {
									marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + leftWidth;
								}
							} else {
								if (rightWidth !== "none" && rightWidth !== "auto") {
									marginGroup.style["grid-template-columns"] = rightWidth + " 1fr " + rightWidth;
								} else {
									marginGroup.style["grid-template-columns"] = "auto auto 1fr";
									left.style["white-space"] = "nowrap";
									center.style["white-space"] = "nowrap";
									right.style["white-space"] = "nowrap";
									let leftOuterWidth = left.offsetWidth;
									let centerOuterWidth = center.offsetWidth;
									let rightOuterWidth = right.offsetWidth;
									let outerwidths = leftOuterWidth + centerOuterWidth + rightOuterWidth;
									let newcenterWidth = centerOuterWidth * 100 / outerwidths;
									if (newcenterWidth > 40) {
										marginGroup.style["grid-template-columns"] = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
									} else {
										marginGroup.style["grid-template-columns"] = "repeat(3, 1fr)";
									}
									left.style["white-space"] = "normal";
									center.style["white-space"] = "normal";
									right.style["white-space"] = "normal";
								}
							}
						}
					} else {
						if (rightWidth !== "none" && rightWidth !== "auto") {
							marginGroup.style["grid-template-columns"] = rightWidth + " 1fr " + rightWidth;
						} else {
							marginGroup.style["grid-template-columns"] = "auto auto 1fr";
							right.style["white-space"] = "nowrap";
							center.style["white-space"] = "nowrap";
							let rightOuterWidth = right.offsetWidth;
							let centerOuterWidth = center.offsetWidth;
							let outerwidths = rightOuterWidth + centerOuterWidth;
							let newcenterWidth = centerOuterWidth * 100 / outerwidths;
							marginGroup.style["grid-template-columns"] = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
							right.style["white-space"] = "normal";
							center.style["white-space"] = "normal";
						}
					}
				} else if (centerWidth !== "none" && centerWidth !== "auto") {
					if (leftContent && leftWidth !== "none" && leftWidth !== "auto") {
						marginGroup.style["grid-template-columns"] = leftWidth + " " + centerWidth + " 1fr";
					} else if (rightContent && rightWidth !== "none" && rightWidth !== "auto") {
						marginGroup.style["grid-template-columns"] = "1fr " + centerWidth + " " + rightWidth;
					} else {
						marginGroup.style["grid-template-columns"] = "1fr " + centerWidth + " 1fr";
					}

				}

			} else {
				if (leftContent) {
					if (!rightContent) {
						marginGroup.style["grid-template-columns"] = "1fr 0 0";
					} else {
						if (leftWidth !== "none" && leftWidth !== "auto") {
							if (rightWidth !== "none" && rightWidth !== "auto") {
								marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + rightWidth;
							} else {
								marginGroup.style["grid-template-columns"] = leftWidth + " 0 1fr";
							}
						} else {
							if (rightWidth !== "none" && rightWidth !== "auto") {
								marginGroup.style["grid-template-columns"] = "1fr 0 " + rightWidth;
							} else {
								marginGroup.style["grid-template-columns"] = "auto 1fr auto";
								left.style["white-space"] = "nowrap";
								right.style["white-space"] = "nowrap";
								let leftOuterWidth = left.offsetWidth;
								let rightOuterWidth = right.offsetWidth;
								let outerwidths = leftOuterWidth + rightOuterWidth;
								let newLeftWidth = leftOuterWidth * 100 / outerwidths;
								marginGroup.style["grid-template-columns"] = "minmax(16.66%, " + newLeftWidth + "%) 0 1fr";
								left.style["white-space"] = "normal";
								right.style["white-space"] = "normal";
							}
						}
					}
				} else {
					if (rightWidth !== "none" && rightWidth !== "auto") {
						marginGroup.style["grid-template-columns"] = "1fr 0 " + rightWidth;
					} else {
						marginGroup.style["grid-template-columns"] = "0 0 1fr";
					}
				}
			}
		});

		// check middle
		["left", "right"].forEach((loc) => {
			let middle = page.element.querySelector(".pagedjs_margin-" + loc + "-middle.hasContent");
			let marginGroup = page.element.querySelector(".pagedjs_margin-" + loc);
			let top = page.element.querySelector(".pagedjs_margin-" + loc + "-top");
			let bottom = page.element.querySelector(".pagedjs_margin-" + loc + "-bottom");
			let topContent = top.classList.contains("hasContent");
			let bottomContent = bottom.classList.contains("hasContent");
			let middleHeight, topHeight, bottomHeight;

			if (topContent) {
				topHeight = window.getComputedStyle(top)["max-height"];
			}

			if (bottomContent) {
				bottomHeight = window.getComputedStyle(bottom)["max-height"];
			}

			if (middle) {
				middleHeight = window.getComputedStyle(middle)["max-height"];

				if (middleHeight === "none" || middleHeight === "auto") {
					if (!topContent && !bottomContent) {
						marginGroup.style["grid-template-rows"] = "0 1fr 0";
					} else if (topContent) {
						if (!bottomContent) {
							if (topHeight !== "none" && topHeight !== "auto") {
								marginGroup.style["grid-template-rows"] = topHeight + " calc(100% - " + topHeight + "*2) " + topHeight;
							}
						} else {
							if (topHeight !== "none" && topHeight !== "auto") {
								if (bottomHeight !== "none" && bottomHeight !== "auto") {
									marginGroup.style["grid-template-rows"] = topHeight + " calc(100% - " + topHeight + " - " + bottomHeight + ") " + bottomHeight;
								} else {
									marginGroup.style["grid-template-rows"] = topHeight + " calc(100% - " + topHeight + "*2) " + topHeight;
								}
							} else {
								if (bottomHeight !== "none" && bottomHeight !== "auto") {
									marginGroup.style["grid-template-rows"] = bottomHeight + " calc(100% - " + bottomHeight + "*2) " + bottomHeight;
								}
							}
						}
					} else {
						if (bottomHeight !== "none" && bottomHeight !== "auto") {
							marginGroup.style["grid-template-rows"] = bottomHeight + " calc(100% - " + bottomHeight + "*2) " + bottomHeight;
						}
					}
				} else {
					if (topContent && topHeight !== "none" && topHeight !== "auto") {
						marginGroup.style["grid-template-rows"] = topHeight + " " + middleHeight + " calc(100% - (" + topHeight + " + " + middleHeight + "))";
					} else if (bottomContent && bottomHeight !== "none" && bottomHeight !== "auto") {
						marginGroup.style["grid-template-rows"] = "1fr " + middleHeight + " " + bottomHeight;
					} else {
						marginGroup.style["grid-template-rows"] = "calc((100% - " + middleHeight + ")/2) " + middleHeight + " calc((100% - " + middleHeight + ")/2)";
					}

				}

			} else {
				if (topContent) {
					if (!bottomContent) {
						marginGroup.style["grid-template-rows"] = "1fr 0 0";
					} else {
						if (topHeight !== "none" && topHeight !== "auto") {
							if (bottomHeight !== "none" && bottomHeight !== "auto") {
								marginGroup.style["grid-template-rows"] = topHeight + " 1fr " + bottomHeight;
							} else {
								marginGroup.style["grid-template-rows"] = topHeight + " 0 1fr";
							}
						} else {
							if (bottomHeight !== "none" && bottomHeight !== "auto") {
								marginGroup.style["grid-template-rows"] = "1fr 0 " + bottomHeight;
							} else {
								marginGroup.style["grid-template-rows"] = "1fr 0 1fr";
							}
						}
					}
				} else {
					if (bottomHeight !== "none" && bottomHeight !== "auto") {
						marginGroup.style["grid-template-rows"] = "1fr 0 " + bottomHeight;
					} else {
						marginGroup.style["grid-template-rows"] = "0 0 1fr";
					}
				}
			}



		});

	}

	// CSS Tree Helpers

	selectorsForPage(page) {
		let nthlist;
		let nth;

		let selectors = new csstree.List();

		selectors.insertData({
			type: "ClassSelector",
			name: "pagedjs_page"
		});

		// Named page
		if (page.name) {
			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_named_page"
			});

			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_" + page.name + "_page"
			});
		}

		// PsuedoSelector
		if (page.psuedo && !(page.name && page.psuedo === "first")) {
			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_" + page.psuedo + "_page"
			});
		}

		if (page.name && page.psuedo === "first") {
			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_" + page.name + "_" + page.psuedo + "_page"
			});
		}

		// Nth
		if (page.nth) {
			nthlist = new csstree.List();
			nth = this.getNth(page.nth);

			nthlist.insertData(nth);

			selectors.insertData({
				type: "PseudoClassSelector",
				name: "nth-of-type",
				children: nthlist
			});
		}

		return selectors;
	}

	selectorsForPageMargin(page, margin) {
		let selectors = this.selectorsForPage(page);

		selectors.insertData({
			type: "Combinator",
			name: " "
		});

		selectors.insertData({
			type: "ClassSelector",
			name: "pagedjs_margin-" + margin
		});

		return selectors;
	}

	createDeclaration(property, value, important) {
		let children = new csstree.List();

		children.insertData({
			type: "Identifier",
			loc: null,
			name: value
		});

		return {
			type: "Declaration",
			loc: null,
			important: important,
			property: property,
			value: {
				type: "Value",
				loc: null,
				children: children
			}
		};
	}

	createVariable(property, value) {
		return {
			type: "Declaration",
			loc: null,
			property: property,
			value: {
				type: "Raw",
				value: value
			}
		};
	}

	createCalculatedDimension(property, items, important, operator = "+") {
		let children = new csstree.List();
		let calculations = new csstree.List();

		items.forEach((item, index) => {
			calculations.appendData({
				type: "Dimension",
				unit: item.unit,
				value: item.value
			});

			calculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			if (index + 1 < items.length) {
				calculations.appendData({
					type: "Operator",
					value: operator
				});

				calculations.appendData({
					type: "WhiteSpace",
					value: " "
				});
			}
		});

		children.insertData({
			type: "Function",
			loc: null,
			name: "calc",
			children: calculations
		});

		return {
			type: "Declaration",
			loc: null,
			important: important,
			property: property,
			value: {
				type: "Value",
				loc: null,
				children: children
			}
		};
	}

	createDimension(property, cssValue, important) {
		let children = new csstree.List();

		children.insertData({
			type: "Dimension",
			loc: null,
			value: cssValue.value,
			unit: cssValue.unit
		});

		return {
			type: "Declaration",
			loc: null,
			important: important,
			property: property,
			value: {
				type: "Value",
				loc: null,
				children: children
			}
		};
	}

	createBlock(declarations) {
		let block = new csstree.List();

		declarations.forEach((declaration) => {
			block.insertData(declaration);
		});

		return {
			type: "Block",
			loc: null,
			children: block
		};
	}

	createRule(selectors, block) {
		let selectorList = new csstree.List();
		selectorList.insertData({
			type: "Selector",
			children: selectors
		});

		if (Array.isArray(block)) {
			block = this.createBlock(block);
		}

		return {
			type: "Rule",
			prelude: {
				type: "SelectorList",
				children: selectorList
			},
			block: block
		};
	}

}

export default AtPage;

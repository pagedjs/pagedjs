import csstree from 'css-tree';

class StylesParser {
	constructor(text) {
		this.pages = {};
		this.width = undefined;
		this.height = undefined;
		this.text = this.parse(text);
	}

	parse(text) {
		let ast = csstree.parse(text);

		let width, height;
		// csstree.walk(ast, function(node) {
		// 	console.log(node);
		// });
		let pages = [];

		let rulesList = ast.children;

		csstree.walk(ast, {
			visit: 'Atrule',
			enter: (atNode, atItem, atList) => {
				const basename = csstree.keyword(atNode.name).basename;
				// console.log("atItem", atItem);
				// csstree.walk(node, function(node) {
					// console.log(atNode);
				// });
				if (basename === "page") {
					// console.log("page", atNode);
					let page = {
						name: undefined,
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
					};

					// Get Declarations
					csstree.walk(atNode.block, {
						visit: 'Declaration',
						enter: (declaration, dItem, dList) => {
							let prop = csstree.property(declaration.property).name;
							let value = declaration.value;
							// console.log("prop", prop);
							// console.log("val", value);

							if (prop === "marks") {
								page.marks = value.children.first().name;
								dList.remove(dItem);
							}

							if (prop === "margin") {
								let margins = [];
								csstree.walk(declaration, {
									visit: 'Dimension',
									enter: (node, item, list) => {
										margins.push(node);
									}
								});

								if (margins.length === 1) {
									for (let m in page.margin) {
										page.margin[m] = margins[0];
									}
								} else if (margins.length === 2) {
									page.margin.top = margins[0];
									page.margin.right = margins[1];
									page.margin.bottom = margins[0];
									page.margin.left = margins[1];
								} else if (margins.length === 3) {
									page.margin.top = margins[0];
									page.margin.right = margins[1];
									page.margin.bottom = margins[2];
									page.margin.left = margins[1];
								} else if (margins.length === 4) {
									page.margin.top = margins[0];
									page.margin.right = margins[1];
									page.margin.bottom = margins[2];
									page.margin.left = margins[3];
								}

								// variables for margins
								for (let m in page.margin) {
									let mVar = dList.createItem({
										type: 'Declaration',
										property: "--margin-" + m,
										value: {
											type: "Raw",
											value: page.margin[m].value + (page.margin[m].unit || '')
										}
									});
									dList.insert(mVar, dItem);
								}


								// console.log(dList);
								dList.remove(dItem);
							}

							if (prop.indexOf("margin-") === 0) {
								let m = prop.substring("margin-".length);
								page.margin[m] = declaration.value.children.first();
								let mVar = dList.createItem({
									type: 'Declaration',
									property: "--margin-" + m,
									value: {
										type: "Raw",
										value: page.margin[m].value + (page.margin[m].unit || '')
									}
								});
								dList.replace(dItem, mVar);
							}

							if (prop === "size") {
								// console.log("size", value);

								// Get the Dimensions
								csstree.walk(declaration, {
									visit: 'Dimension',
									enter: (node, item, list) => {
										// console.log("Dimension", node);
										let {value, unit} = node;
										if (typeof width === "undefined") {
											width = value + unit;

											let widthList = new csstree.List();
											widthList.insert(widthList.createItem({
												type: "Dimension",
												value: value,
												unit: unit
											}));

											let w = dList.createItem({
												type: 'Declaration',
												property: "width",
												value: {
													type: 'Value',
													children: widthList
												}
											});
											dList.insert(w, dItem);

											// variable
											let wVar = dList.createItem({
												type: 'Declaration',
												property: "--width",
												value: {
													type: "Raw",
													value: width
												}
											});
											dList.insert(wVar, dItem);

											this.width = width;

											page.width = {
												value,
												unit
											};

										} else if (typeof height === "undefined") {
											height = value + unit;

											let heightList = new csstree.List();
											heightList.insert(heightList.createItem({
												type: "Dimension",
												value: value,
												unit: unit
											}));

											let h = dList.createItem({
												type: 'Declaration',
												property: "height",
												value: {
													type: 'Value',
													children: heightList
												}
											});

											dList.insert(h, dItem);

											// variable
											let hVar = dList.createItem({
												type: 'Declaration',
												property: "--height",
												value: {
													type: "Raw",
													value: height
												}
											});
											dList.insert(hVar, dItem);

											page.height = {
												value,
												unit
											};

											this.height = height;

											dList.remove(dItem);

										}

									}
								});
								// console.log("w", width, "h", height);
								// Get strings
								csstree.walk(declaration, {
									visit: 'String',
									enter: (node, item, list) => {
										// console.log("String", node);
										let s = this.size(node);
										width = s.width;
										height = s.height;

										let widthList = new csstree.List();
										widthList.insert(widthList.createItem({
											type: "Dimension",
											value: width.value,
											unit: width.unit
										}));

										let w = dList.createItem({
											type: 'Declaration',
											property: "width",
											value: {
												type: 'Value',
												children: widthList
											}
										});
										dList.insert(w, dItem);


										let heightList = new csstree.List();
										heightList.insert(heightList.createItem({
											type: "Dimension",
											value: height.value,
											unit: height.unit
										}));

										let h = dList.createItem({
											type: 'Declaration',
											property: "height",
											value: {
												type: 'Value',
												children: heightList
											}
										});
										// dList.insert(h);
										dList.insert(h, dItem);

										// variables
										let wVar = dList.createItem({
											type: 'Declaration',
											property: "--width",
											value: {
												type: "Raw",
												value: s.width.value + s.width.unit
											}
										});
										dList.insert(wVar, dItem);

										let hVar = dList.createItem({
											type: 'Declaration',
											property: "--height",
											value: {
												type: "Raw",
												value: s.height.value + s.height.unit
											}
										});
										dList.insert(hVar, dItem);


										dList.remove(dItem);

										page.width = width;
										page.height = height;

										// TODO: Find largest page and set
										this.width = s.width.value + s.width.unit;
										this.height = s.height.value + s.height.unit;

									}
								});

							}



						}
					});

					let name = "page";
					// Switch to class
					let newSelectors = new csstree.List();
					let pos = 0;

					let sel = new csstree.List();
					let s = newSelectors.createItem({
						type: 'Selector',
						children: sel
					});

					newSelectors.insert(s);

					sel.insert(sel.createItem({
						type: 'ClassSelector',
						name: 'page'
					}));

					// Convert named pages to class names
					csstree.walk(atNode, {
						visit: "TypeSelector",
						enter: (node, item, list) => {

							name = node.name + "_page";

							sel.insert(sel.createItem({
								type: 'ClassSelector',
								name: name
							}));

						}
					});

					// Convert :left & :right class names
					csstree.walk(atNode, {
						visit: "PseudoClassSelector",
						enter: (node, item, list) => {
							// console.log("PseudoClassSelector", node);
							node.type = "ClassSelector";
							name = node.name + "_page";


							sel.insert(sel.createItem({
								type: 'ClassSelector',
								name: name
							}));
						}
					});

					page.name = name;

					// Move At-rules, like @top-left to their own classes
					csstree.walk(atNode.block, {
						visit: 'Atrule',
						enter: (node, item, list) => {
							console.log("Atrule", node.name);
							let name = node.name;

							let newSelectors = new csstree.List();
							// let sel = new csstree.List();


							let prelude = sel.copy();

							let s = newSelectors.createItem({
								type: 'Selector',
								children: prelude
							});

							newSelectors.insert(s);

							prelude.insert(prelude.createItem({
								type: 'Combinator',
								name: " "
							}));

							prelude.insert(prelude.createItem({
								type: 'ClassSelector',
								name: name
							}));

							prelude.insert(prelude.createItem({
								type: 'Combinator',
								name: ">"
							}));

							prelude.insert(prelude.createItem({
								type: 'ClassSelector',
								name: "content"
							}));

							prelude.insert(prelude.createItem({
								type: 'PseudoElementSelector',
								name: "after",
								children: null
							}));

							let sub = rulesList.createItem({
								type: 'Rule',
								prelude: {
									type: 'SelectorList',
									loc: 0,
									children: newSelectors
								},
								block: {
										type: 'Block',
										loc: node.block.loc,
										children: node.block.children.copy()
								}
							});

							rulesList.insert(sub, ast.loc);
							console.log("sub", sub);

							list.remove(item);
							// console.log("val", declaration.value);
							if (node.block) {
								page.marginalia[node.name] = node.block;
							}
						}
					});



					if (atNode.block) {
						page.block = atNode.block;
					}

					this.pages[name] = page


					atNode.type = 'Rule';

					atNode.prelude = {
						type: 'SelectorList',
						loc: 0,
						children: newSelectors
					};



				}
			}
		});

		return csstree.generate(ast);
	}

	size(str) {
		console.log("got size:", str);
		return {
			width: {
				value: '8.5',
				unit: 'in'
			},
			height: {
				value: '11',
				unit: 'in'
			}
		}
	}

}

export default StylesParser;

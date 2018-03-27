import csstree from 'css-tree';

class StylesParser {
	constructor(text) {
		this.text = this.parse(text);
	}

	parse(text) {
		let ast = csstree.parse(text);

		let width, height;
		// csstree.walk(ast, function(node) {
		// 		console.log(node);
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

					console.log(atNode);

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

							// sel.insert(sel.createItem({
							// 	type: 'Combinator',
							// 	name: ">"
							// }));

							sel.insert(sel.createItem({
								type: 'ClassSelector',
								name: node.name + "_page"
							}));

						}
					});

					// Convert :left & :right class names
					csstree.walk(atNode, {
						visit: "PseudoClassSelector",
						enter: (node, item, list) => {
							console.log("PseudoClassSelector", node);
							node.type = "ClassSelector";

							// sel.insert(sel.createItem({
							// 	type: 'Combinator',
							// 	name: ">"
							// }));

							sel.insert(sel.createItem({
								type: 'ClassSelector',
								name: node.name + "_page"
							}));
						}
					});

					// Move At-rules, like @top-left to their own classes
					csstree.walk(atNode.block, {
						visit: 'Atrule',
						enter: (node, item, list) => {
							console.log("Atrule", node.name, item, list);
							list.remove(item);
							// console.log("val", declaration.value);
						}
					});

					// Get Declarations
					csstree.walk(atNode.block, {
						visit: 'Declaration',
						enter: (declaration, dItem, dList) => {
							let prop = csstree.property(declaration.property).name;
							let value = declaration.value;
							// console.log("prop", prop);
							// console.log("val", value);

							if (prop === "size") {
								console.log("size", value);

								// Get the Dimensions
								csstree.walk(declaration, {
									visit: 'Dimension',
									enter: (node, item, list) => {
										console.log("Dimension", node);
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

											dList.remove(dItem);

										}

									}
								});
								console.log("w", width, "h", height);
								// Get strings
								csstree.walk(declaration, {
									visit: 'String',
									enter: (node, item, list) => {
										console.log("String", node);
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

										dList.remove(dItem);

									}
								});

							}

						}
					});

					atNode.type = 'Rule';

					atNode.prelude = {
						type: 'SelectorList',
						loc: 0,
						children: newSelectors
					};

					// rulesList.insert(rulesList.createItem({
					// 	type: 'Rule',
					// 	loc: atNode.loc,
					// 	prelude: {
					// 			type: 'SelectorList',
					// 			loc: 0,
					// 			children: newSelectors
					// 	},
					// 	block: {
					// 			type: 'Block',
					// 			loc: atNode.block.loc,
					// 			children: atNode.block.children.copy()
					// 	},
					// 	pseudoSignature: atNode.pseudoSignature
					// }), ast.loc);

				}
			}
		});

		return csstree.generate(ast);
	}

	size(str) {
		console.log("got size:", str);
		return {
			width: {
				value: '8',
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

import csstree from "css-tree";
import { UUID } from "../utils/utils.js";
import Hook from "../utils/hook.js";

class Sheet {
	constructor(url, hooks) {

		if (hooks) {
			this.hooks = hooks;
		} else {
			this.hooks = {};
			this.hooks.onUrl = new Hook(this);
			this.hooks.onAtPage = new Hook(this);
			this.hooks.onAtMedia = new Hook(this);
			this.hooks.onRule = new Hook(this);
			this.hooks.onDeclaration = new Hook(this);
			this.hooks.onSelector = new Hook(this);
			this.hooks.onPseudoSelector = new Hook(this);

			this.hooks.onContent = new Hook(this);
			this.hooks.onImport = new Hook(this);

			this.hooks.beforeTreeParse = new Hook(this);
			this.hooks.beforeTreeWalk = new Hook(this);
			this.hooks.afterTreeWalk = new Hook(this);
		}

		try {
			this.url = new URL(url, window.location.href);
		} catch (e) {
			this.url = new URL(window.location.href);
		}
	}



	// parse
	async parse(text) {
		this.text = text;

		await this.hooks.beforeTreeParse.trigger(this.text, this);

		// send to csstree
		this.ast = csstree.parse(this._text);

		await this.hooks.beforeTreeWalk.trigger(this.ast);

		// Replace urls
		this.replaceUrls(this.ast);

		// Scope
		this.id = UUID();
		// this.addScope(this.ast, this.uuid);

		// Replace IDs with data-id
		this.replaceIds(this.ast);

		this.imported = [];

		// Trigger Hooks
		this.urls(this.ast);
		this.rules(this.ast);
		this.atrules(this.ast);

		await this.hooks.afterTreeWalk.trigger(this.ast, this);

		// return ast
		return this.ast;
	}



	insertRule(rule) {
		let inserted = this.ast.children.appendData(rule);

		this.declarations(rule);

		return inserted;
	}

	urls(ast) {
		csstree.walk(ast, {
			visit: "Url",
			enter: (node, item, list) => {
				this.hooks.onUrl.trigger(node, item, list);
			}
		});
	}

	atrules(ast) {
		csstree.walk(ast, {
			visit: "Atrule",
			enter: (node, item, list) => {
				const basename = csstree.keyword(node.name).basename;

				if (basename === "page") {
					this.hooks.onAtPage.trigger(node, item, list);
					this.declarations(node, item, list);
				}

				if (basename === "media") {
					this.hooks.onAtMedia.trigger(node, item, list);
					this.declarations(node, item, list);
				}

				if (basename === "import") {
					this.hooks.onImport.trigger(node, item, list);
					this.imports(node, item, list);
				}
			}
		});
	}


	rules(ast) {
		csstree.walk(ast, {
			visit: "Rule",
			enter: (ruleNode, ruleItem, rulelist) => {

				this.hooks.onRule.trigger(ruleNode, ruleItem, rulelist);
				this.declarations(ruleNode, ruleItem, rulelist);
				this.onSelector(ruleNode, ruleItem, rulelist);

			}
		});
	}

	declarations(ruleNode, ruleItem, rulelist) {
		csstree.walk(ruleNode, {
			visit: "Declaration",
			enter: (declarationNode, dItem, dList) => {

				this.hooks.onDeclaration.trigger(declarationNode, dItem, dList, {ruleNode, ruleItem, rulelist});

				if (declarationNode.property === "content") {
					csstree.walk(declarationNode, {
						visit: "Function",
						enter: (funcNode, fItem, fList) => {
							this.hooks.onContent.trigger(funcNode, fItem, fList, {declarationNode, dItem, dList}, {ruleNode, ruleItem, rulelist});
						}
					});
				}

			}
		});
	}

	// add pseudo elements to parser
	onSelector(ruleNode, ruleItem, rulelist) {
		csstree.walk(ruleNode, {
			visit: "Selector",
			enter: (selectNode, selectItem, selectList) => {
				this.hooks.onSelector.trigger(selectNode, selectItem, selectList, {ruleNode, ruleItem, rulelist});

				if (selectNode.children.forEach(node => {if (node.type === "PseudoElementSelector") {
					csstree.walk(node, {
						visit: "PseudoElementSelector",
						enter: (pseudoNode, pItem, pList) => {
							this.hooks.onPseudoSelector.trigger(pseudoNode, pItem, pList, {selectNode, selectItem, selectList}, {ruleNode, ruleItem, rulelist});
						}
					});
				}}));
			}
		});
	}

	replaceUrls(ast) {
		csstree.walk(ast, {
			visit: "Url",
			enter: (node, item, list) => {
				let content = node.value.value;
				if ((node.value.type === "Raw" && content.startsWith("data:")) || (node.value.type === "String" && (content.startsWith("\"data:") || content.startsWith("'data:")))) {
					// data-uri should not be parsed using the URL interface.
				} else {
					let href = content.replace(/["']/g, "");
					let url = new URL(href, this.url);
					node.value.value = url.toString();
				}
			}
		});
	}

	addScope(ast, id) {
		// Get all selector lists
		// add an id
		csstree.walk(ast, {
			visit: "Selector",
			enter: (node, item, list) => {
				let children = node.children;
				children.prepend(children.createItem({
					type: "WhiteSpace",
					value: " "
				}));
				children.prepend(children.createItem({
					type: "IdSelector",
					name: id,
					loc: null,
					children: null
				}));
			}
		});
	}

	getNamedPageSelectors(ast) {
		let namedPageSelectors = {};
		csstree.walk(ast, {
			visit: "Rule",
			enter: (node, item, list) => {
				csstree.walk(node, {
					visit: "Declaration",
					enter: (declaration, dItem, dList) => {
						if (declaration.property === "page") {
							let value = declaration.value.children.first();
							let name = value.name;
							let selector = csstree.generate(node.prelude);
							namedPageSelectors[name] = {
								name: name,
								selector: selector
							};

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

	replaceIds(ast) {
		csstree.walk(ast, {
			visit: "Rule",
			enter: (node, item, list) => {

				csstree.walk(node, {
					visit: "IdSelector",
					enter: (idNode, idItem, idList) => {
						let name = idNode.name;
						idNode.flags = null;
						idNode.matcher = "=";
						idNode.name = {type: "Identifier", loc: null, name: "data-id"};
						idNode.type = "AttributeSelector";
						idNode.value = {type: "String", loc: null, value: `"${name}"`};
					}
				});
			}
		});
	}

	imports(node, item, list) {
		// console.log("import", node, item, list);
		let queries = [];
		csstree.walk(node, {
			visit: "MediaQuery",
			enter: (mqNode, mqItem, mqList) => {
				csstree.walk(mqNode, {
					visit: "Identifier",
					enter: (identNode, identItem, identList) => {
						queries.push(identNode.name);
					}
				});
			}
		});

		// Just basic media query support for now
		let shouldNotApply = queries.some((query, index) => {
			let q = query;
			if (q === "not") {
				q = queries[index + 1];
				return !(q === "screen" || q === "speech");
			} else {
				return (q === "screen" || q === "speech");
			}
		});

		if (shouldNotApply) {
			return;
		}

		csstree.walk(node, {
			visit: "String",
			enter: (urlNode, urlItem, urlList) => {
				let href = urlNode.value.replace(/["']/g, "");
				let url = new URL(href, this.url);
				let value = url.toString();

				this.imported.push(value);

				// Remove the original
				list.remove(item);
			}
		});
	}

	set text(t) {
		this._text = t;
	}

	get text() {
		return this._text;
	}

	// generate string
	toString(ast) {
		return csstree.generate(ast || this.ast);
	}
}

export default Sheet;

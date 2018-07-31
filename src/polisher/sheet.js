import csstree from 'css-tree';
import { UUID } from "../utils/utils";
import Hook from "../utils/hook";

class Sheet {
	constructor(text, url, hooks) {

		if (hooks) {
			this.hooks = hooks;
		} else {
			this.hooks = {};
			this.hooks.onUrl = new Hook(this);
			this.hooks.onAtPage = new Hook(this);
			this.hooks.onAtMedia = new Hook(this);
			this.hooks.onRule = new Hook(this);
			this.hooks.onDeclaration = new Hook(this);
			this.hooks.onContent = new Hook(this);

			this.hooks.beforeTreeWalk = new Hook(this);
			this.hooks.afterTreeWalk = new Hook(this);
		}

		try {
			this.url = new URL(url, window.location.href);
		} catch (e) {
			this.url = new URL(window.location.href);
		}

		// this.original = text;

		// Parse the text
		this.ast = this.parse(text);

		this.hooks.beforeTreeWalk.trigger(this.ast);

		// Replace urls
		this.replaceUrls(this.ast);

		// Scope
		this.id = UUID();
		// this.addScope(this.ast, this.uuid);

		// Replace IDs with data-id
		this.replaceIds(this.ast);

		// Trigger Hooks
		this.urls(this.ast);
		this.rules(this.ast);
		this.atrules(this.ast);

		this.hooks.afterTreeWalk.trigger(this.ast, this);
	}

	// parse
	parse(text) {
		// send to csstree
		let ast = csstree.parse(text);
		// return ast
		return ast;
	}

	insertRule(rule) {
		let inserted = this.ast.children.appendData(rule);
		inserted.forEach((item) => {
			this.declarations(item);
		})
	}

	urls(ast) {
		csstree.walk(ast, {
			visit: 'Url',
			enter: (node, item, list) => {
				this.hooks.onUrl.trigger(node, item, list);
			}
		});
	}

	atrules(ast) {
		csstree.walk(ast, {
			visit: 'Atrule',
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
			}
		});
	}


	rules(ast) {
		let parsed = {};
		csstree.walk(ast, {
			visit: 'Rule',
			enter: (ruleNode, ruleItem, rulelist) => {
				// console.log("rule", ruleNode);

				this.hooks.onRule.trigger(ruleNode, ruleItem, rulelist);
				this.declarations(ruleNode, ruleItem, rulelist);
			}
		});
	}

	declarations(ruleNode, ruleItem, rulelist) {
		csstree.walk(ruleNode, {
			visit: 'Declaration',
			enter: (declarationNode, dItem, dList) => {
				// console.log(declarationNode);

				this.hooks.onDeclaration.trigger(declarationNode, dItem, dList, {ruleNode, ruleItem, rulelist});

				if (declarationNode.property === "content") {
					csstree.walk(declarationNode, {
						visit: 'Function',
						enter: (funcNode, fItem, fList) => {
							this.hooks.onContent.trigger(funcNode, fItem, fList, {declarationNode, dItem, dList}, {ruleNode, ruleItem, rulelist});
						}
					});
				}

			}
		});
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

	replaceIds(ast) {
		csstree.walk(ast, {
			visit: 'Rule',
			enter: (node, item, list) => {

				csstree.walk(node, {
					visit: 'IdSelector',
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

	// generate string
	toString(ast) {
		return csstree.generate(ast || this.ast);
	}
}

export default Sheet;

import csstree from "css-tree";
import { UUID } from "../utils/utils.js";
import Hook from "../utils/hook.js";

/**
 * Class representing a CSS stylesheet parser and processor.
 * Provides a hook-based system for analyzing and transforming CSS using csstree.
 */
class Sheet {
	/**
	 * Create a Sheet instance.
	 * @param {string} url - The base URL for resolving relative paths.
	 * @param {Object} [hooks] - Optional custom hook object.
	 */
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

	/**
	 * Parses a CSS string and returns the AST.
	 * @param {string} text - Raw CSS text to parse.
	 * @returns {Promise<Object>} Parsed CSS AST.
	 */
	async parse(text) {
		this.text = text;

		await this.hooks.beforeTreeParse.trigger(this.text, this);
		this.ast = csstree.parse(this._text);

		await this.hooks.beforeTreeWalk.trigger(this.ast);

		this.replaceUrls(this.ast);
		this.id = UUID();
		this.replaceIds(this.ast);

		this.imported = [];

		this.urls(this.ast);
		this.rules(this.ast);
		this.atrules(this.ast);

		await this.hooks.afterTreeWalk.trigger(this.ast, this);

		return this.ast;
	}

	/**
	 * Inserts a new CSS rule into the AST.
	 * @param {Object} rule - A csstree rule node.
	 * @returns {Object} The inserted rule node.
	 */
	insertRule(rule) {
		let inserted = this.ast.children.appendData(rule);
		this.declarations(rule);
		return inserted;
	}

	/**
	 * Triggers onUrl hook for each URL node.
	 * @param {Object} ast - CSS AST.
	 */
	urls(ast) {
		csstree.walk(ast, {
			visit: "Url",
			enter: (node, item, list) => {
				this.hooks.onUrl.trigger(node, item, list);
			},
		});
	}

	/**
	 * Processes all at-rules and triggers relevant hooks.
	 * @param {Object} ast - CSS AST.
	 */
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
			},
		});
	}

	/**
	 * Processes rule nodes and triggers related hooks.
	 * @param {Object} ast - CSS AST.
	 */
	rules(ast) {
		csstree.walk(ast, {
			visit: "Rule",
			enter: (ruleNode, ruleItem, rulelist) => {
				this.hooks.onRule.trigger(ruleNode, ruleItem, rulelist);
				this.declarations(ruleNode, ruleItem, rulelist);
				this.onSelector(ruleNode, ruleItem, rulelist);
			},
		});
	}

	/**
	 * Triggers onDeclaration and onContent hooks for declarations.
	 * @param {Object} ruleNode
	 * @param {*} ruleItem
	 * @param {*} rulelist
	 */
	declarations(ruleNode, ruleItem, rulelist) {
		csstree.walk(ruleNode, {
			visit: "Declaration",
			enter: (declarationNode, dItem, dList) => {
				this.hooks.onDeclaration.trigger(declarationNode, dItem, dList, {
					ruleNode,
					ruleItem,
					rulelist,
				});

				if (declarationNode.property === "content") {
					csstree.walk(declarationNode, {
						visit: "Function",
						enter: (funcNode, fItem, fList) => {
							this.hooks.onContent.trigger(
								funcNode,
								fItem,
								fList,
								{ declarationNode, dItem, dList },
								{ ruleNode, ruleItem, rulelist },
							);
						},
					});
				}
			},
		});
	}

	/**
	 * Handles selector and pseudo-selector hooks.
	 * @param {Object} ruleNode
	 * @param {*} ruleItem
	 * @param {*} rulelist
	 */
	onSelector(ruleNode, ruleItem, rulelist) {
		csstree.walk(ruleNode, {
			visit: "Selector",
			enter: (selectNode, selectItem, selectList) => {
				this.hooks.onSelector.trigger(selectNode, selectItem, selectList, {
					ruleNode,
					ruleItem,
					rulelist,
				});

				selectNode.children.forEach((node) => {
					if (node.type === "PseudoElementSelector") {
						csstree.walk(node, {
							visit: "PseudoElementSelector",
							enter: (pseudoNode, pItem, pList) => {
								this.hooks.onPseudoSelector.trigger(
									pseudoNode,
									pItem,
									pList,
									{ selectNode, selectItem, selectList },
									{ ruleNode, ruleItem, rulelist },
								);
							},
						});
					}
				});
			},
		});
	}

	/**
	 * Resolves relative URLs in `url()` functions.
	 * @param {Object} ast - CSS AST.
	 */
	replaceUrls(ast) {
		csstree.walk(ast, {
			visit: "Url",
			enter: (node) => {
				let content = node.value.value;
				if (
					(node.value.type === "Raw" && content.startsWith("data:")) ||
					(node.value.type === "String" &&
						(content.startsWith('"data:') || content.startsWith("'data:")))
				) {
					// Skip data URIs
				} else {
					let href = content.replace(/["']/g, "");
					let url = new URL(href, this.url);
					node.value.value = url.toString();
				}
			},
		});
	}

	/**
	 * Scopes all selectors by prepending an ID selector.
	 * @param {Object} ast - CSS AST.
	 * @param {string} id - Scope ID.
	 */
	addScope(ast, id) {
		csstree.walk(ast, {
			visit: "Selector",
			enter: (node) => {
				let children = node.children;
				children.prepend(
					children.createItem({
						type: "WhiteSpace",
						value: " ",
					}),
				);
				children.prepend(
					children.createItem({
						type: "IdSelector",
						name: id,
						loc: null,
						children: null,
					}),
				);
			},
		});
	}

	/**
	 * Extracts named @page selectors and modifies them.
	 * @param {Object} ast - CSS AST.
	 * @returns {Object} Named page selectors with their CSS selectors.
	 */
	getNamedPageSelectors(ast) {
		let namedPageSelectors = {};
		csstree.walk(ast, {
			visit: "Rule",
			enter: (node) => {
				csstree.walk(node, {
					visit: "Declaration",
					enter: (declaration) => {
						if (declaration.property === "page") {
							let value = declaration.value.children.first();
							let name = value.name;
							let selector = csstree.generate(node.prelude);
							namedPageSelectors[name] = { name, selector };

							declaration.property = "break-before";
							value.type = "Identifier";
							value.name = "always";
						}
					},
				});
			},
		});
		return namedPageSelectors;
	}

	/**
	 * Converts ID selectors to [data-id="..."] format.
	 * @param {Object} ast - CSS AST.
	 */
	replaceIds(ast) {
		csstree.walk(ast, {
			visit: "Rule",
			enter: (node) => {
				csstree.walk(node, {
					visit: "IdSelector",
					enter: (idNode) => {
						let name = idNode.name;
						idNode.flags = null;
						idNode.matcher = "=";
						idNode.name = { type: "Identifier", loc: null, name: "data-id" };
						idNode.type = "AttributeSelector";
						idNode.value = { type: "String", loc: null, value: `"${name}"` };
					},
				});
			},
		});
	}

	/**
	 * Processes @import rules, adds valid URLs to `this.imported`, and removes them from AST.
	 * @param {Object} node
	 * @param {*} item
	 * @param {*} list
	 */
	imports(node, item, list) {
		let queries = [];
		csstree.walk(node, {
			visit: "MediaQuery",
			enter: (mqNode) => {
				csstree.walk(mqNode, {
					visit: "Identifier",
					enter: (identNode) => {
						queries.push(identNode.name);
					},
				});
			},
		});

		let shouldNotApply = queries.some((query, index) => {
			if (query === "not") {
				let next = queries[index + 1];
				return !(next === "screen" || next === "speech");
			}
			return query !== "screen" && query !== "speech";
		});

		if (shouldNotApply) return;

		csstree.walk(node, {
			visit: "String",
			enter: (urlNode) => {
				let href = urlNode.value.replace(/["']/g, "");
				let url = new URL(href, this.url);
				this.imported.push(url.toString());
				list.remove(item);
			},
		});
	}

	/** @param {string} t */
	set text(t) {
		this._text = t;
	}

	/** @returns {string} */
	get text() {
		return this._text;
	}

	/**
	 * Generates a CSS string from AST.
	 * @param {Object} [ast] - AST to stringify. Defaults to internal AST.
	 * @returns {string} CSS code as string.
	 */
	toString(ast) {
		return csstree.generate(ast || this.ast);
	}
}

export default Sheet;

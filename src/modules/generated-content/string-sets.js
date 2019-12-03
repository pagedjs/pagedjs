import Handler from "../handler";
import csstree from "css-tree";

class StringSets extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.stringSetSelectors = {};
		this.type;
		this.lastString;

	}
	
	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "string-set") {
			let selector = csstree.generate(rule.ruleNode.prelude);

			let identifier = declaration.value.children.first().name;

			let value;
			csstree.walk(declaration, {
				visit: "Function",
				enter: (node, item, list) => {
					value = csstree.generate(node);
				}
			});

			this.stringSetSelectors[identifier] = {
				identifier: identifier,
				value: value,
				selector: selector
			};
		}
	}

	onContent(funcNode, fItem, fList, declaration, rule) {

		if (funcNode.name === "string") {
			let identifier = funcNode.children && funcNode.children.first().name;
			this.type = funcNode.children.last().name;
			funcNode.name = "var";
			funcNode.children = new csstree.List();

			funcNode.children.append(
				funcNode.children.createItem({
					type: "Identifier",
					loc: null,
					name: "--pagedjs-string-" + identifier
				})
			);
		}
	}

	afterPageLayout(fragment) {
		// get the value of the previous last string
		let previousLastString = this.lastString;
		for (let name of Object.keys(this.stringSetSelectors)) {
			let set = this.stringSetSelectors[name];
			let selected = fragment.querySelectorAll(set.selector);
			let selArray = [];

			let cssVar  = previousLastString;

			selected.forEach((sel) => {
				if (sel) {
					// push each content into the array to define in the variable the first and the last element of the page.
					selArray.push(sel.textContent);
				
					this.lastString = selArray[selArray.length - 1];
				}

				
				if (this.type === "first" ||
					!this.type) {
					cssVar = selArray[0];
				} 
				
				else if (this.type === "last") {
					cssVar = selArray[selArray.length - 1];
				} 
				
				else if (this.type === "start") {
				
					if (sel.parentElement.firstChild === sel) {
						cssVar = sel.textContent;
					}
					
				}

				else if (this.type === "first-except") {
					cssVar = selArray[0];
					if (cssVar === selArray[0]) {
						cssVar = "";
					}
				}	
			});	

			fragment.setAttribute("data-string", `string-type-${this.type}-${name}`);


			fragment.style.setProperty(`--pagedjs-string-${name}`, `"${cssVar.replace(/\\([\s\S])|(["|'])/g, "\\$1$2")}"`);
				
			//if there is an element with the string-set property on the page
			if (selArray.length != 0) {
				this.lastString = selArray[selArray.length - 1];
			}
		
				
			
		
			// if there is no new string on the page
			if (!fragment.hasAttribute("data-string")) {
				fragment.style.setProperty(`--pagedjs-string-${name}`, `"${this.lastString}"`);
			}	

		}
	}


}



export default StringSets;

import Handler from "../handler";
import csstree from "css-tree";
import { cleanPseudoContent } from "../../utils/css";

class StringSets extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.stringSetSelectors = {};
		this.type;
		// pageLastString = last string variable defined on the page 
		this.pageLastString;

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
				identifier,
				value,
				selector
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

	
		if ( this.pageLastString === undefined )
		{
			this.pageLastString = {};
		}
	
		// get the value of the previous last string
		for (let name of Object.keys(this.stringSetSelectors)) {
	
			let set = this.stringSetSelectors[name];
			let selected = fragment.querySelectorAll(set.selector);
	
			// let cssVar = previousPageLastString;
			// Get the last found string for the current identifier
			let cssVar = ( name in this.pageLastString ) ? this.pageLastString[name] : '';
	
				selected.forEach((sel) => {
				// push each content into the array to define in the variable the first and the last element of the page.
	
	
				//this.pageLastString = selected[selected.length - 1].textContent;
				// Index by identifier
				this.pageLastString[name] = selected[selected.length - 1].textContent;
	
				
				if (this.type === "first") {
					cssVar = selected[0].textContent;
				} 
				
				else if (this.type === "last") {
					cssVar = selected[selected.length - 1].textContent;
				} 
				
				else if (this.type === "start") {
				
					if (sel.parentElement.firstChild === sel) {
						cssVar = sel.textContent;
					}
				}
	
				else if (this.type === "first-except") {
					cssVar = "";
				}
	
				else {
					cssVar = selected[0].textContent;
				} 
			});	
	
			fragment.setAttribute("data-string", `string-type-${this.type}-${name}`);
	
	
			// fragment.style.setProperty(`--pagedjs-string-${name}`, `"${cssVar.replace(/\\([\s\S])|(["|'])/g, "\\$1$2")}"`);
			fragment.style.setProperty(`--pagedjs-string-${name}`, `"${cleanPseudoContent(cssVar)}`);
		
			// if there is no new string on the page
			if (!fragment.hasAttribute("data-string")) {
				fragment.style.setProperty(`--pagedjs-string-${name}`, `"${this.pageLastString}"`);
			}	
	
		}
	}
	

}



export default StringSets;

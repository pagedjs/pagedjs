import Handler from "../handler.js";
import csstree from "css-tree";
import { cleanPseudoContent } from "../../utils/css.js";

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

			let identifiers = [];
			let functions = [];
			let values = [];

			declaration.value.children.forEach((child) => {
				if (child.type === "Identifier") {
					identifiers.push(child.name);
				}
				if (child.type === "Function") {
					functions.push(child.name);
					child.children.forEach((subchild) => {
						if (subchild.type === "Identifier") {
							values.push(subchild.name);
						}
					});
				}
			});

			identifiers.forEach((identifier, index) => {
				let func = functions[index];
				let value = values[index];
				this.stringSetSelectors[identifier] = {
					identifier,
					func,
					value,
					selector
				};
			});

		}
	}

	onContent(funcNode, fItem, fList, declaration, rule) {

		if (funcNode.name === "string") {
			let identifier = funcNode.children && funcNode.children.first().name;
			this.type = funcNode.children.last().name;
			funcNode.name = "var";
			funcNode.children = new csstree.List();

 
			if(this.type === "first" || this.type === "last" || this.type === "start" || this.type === "first-except"){
				funcNode.children.append(
					funcNode.children.createItem({
						type: "Identifier",
						loc: null,
						name: "--pagedjs-string-" + this.type + "-" + identifier
					})
				);
			}else{
				funcNode.children.append(
					funcNode.children.createItem({
						type: "Identifier",
						loc: null,
						name: "--pagedjs-string-first-" + identifier
					})
				);
			}
		}
	}

	afterPageLayout(fragment) {

	
		if ( this.pageLastString === undefined )
		{
			this.pageLastString = {};
		}

		
		for (let name of Object.keys(this.stringSetSelectors)) {
	
			let set = this.stringSetSelectors[name];
			let value = set.value;
			let func = set.func;
			let selected = fragment.querySelectorAll(set.selector);

			// Get the last found string for the current identifier
			let stringPrevPage = ( name in this.pageLastString ) ? this.pageLastString[name] : "";

			let varFirst, varLast, varStart, varFirstExcept;

			if(selected.length == 0){
				// if there is no sel. on the page
				varFirst = stringPrevPage;
				varLast = stringPrevPage;
				varStart = stringPrevPage;
				varFirstExcept = stringPrevPage;
			}else{

				selected.forEach((sel) => {
					// push each content into the array to define in the variable the first and the last element of the page.
					if (func === "content") {
						this.pageLastString[name] = selected[selected.length - 1].textContent;
					}

					if (func === "attr") {
						this.pageLastString[name] = selected[selected.length - 1].getAttribute(value) || "";
					}

				});	

				/* FIRST */
	
				if (func === "content") {
					varFirst = selected[0].textContent;
				}

				if (func === "attr") {
					varFirst = selected[0].getAttribute(value) || "";
				}


				/* LAST */

				if (func === "content") {
					varLast = selected[selected.length - 1].textContent;
				}

				if (func === "attr") {
					varLast = selected[selected.length - 1].getAttribute(value) || "";
				}


				/* START */

				// Hack to find if the sel. is the first elem of the page / find a better way 
				let selTop = selected[0].getBoundingClientRect().top;
				let pageContent = selected[0].closest(".pagedjs_page_content");
				let pageContentTop = pageContent.getBoundingClientRect().top;

				if(selTop == pageContentTop){
					varStart = varFirst;
				}else{
					varStart = stringPrevPage;
				}

				/* FIRST EXCEPT */

				varFirstExcept = "";
				
			}

			fragment.style.setProperty(`--pagedjs-string-first-${name}`, `"${cleanPseudoContent(varFirst)}`);
			fragment.style.setProperty(`--pagedjs-string-last-${name}`, `"${cleanPseudoContent(varLast)}`);
			fragment.style.setProperty(`--pagedjs-string-start-${name}`, `"${cleanPseudoContent(varStart)}`);
			fragment.style.setProperty(`--pagedjs-string-first-except-${name}`, `"${cleanPseudoContent(varFirstExcept)}`);
			
	
		}
	}
	

}



export default StringSets;

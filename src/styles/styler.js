import Sheet from './sheet';
import baseStyles from './base';
import { UUID } from '../utils/utils';

class Styler {
	constructor() {
		this.sheets = [];
		this.inserted = [];
		this.base = this.addBase();
		this.inserted.push(this.base);
		this.styleEl = document.createElement("style");
		document.head.appendChild(this.styleEl);
		this.styleSheet = this.styleEl.sheet;
	}

	async add() {
		let fetched = [];
		let urls = [];
		for (var i = 0; i < arguments.length; i++) {
			let f;

			if (typeof arguments[i] === "object") {
				for (let url in arguments[i]) {
					let obj = arguments[i];
					f = new Promise(function(resolve, reject) {
						urls.push(url);
						resolve(obj[url]);
					});
				}
			} else {
				urls.push(arguments[i]);
				f = fetch(arguments[i]).then((response) => {
					return response.text();
				})
			}


			fetched.push(f);
		}

		return await Promise.all(fetched)
			.then((originals) => {
				let text = "";
				let pageBreaks = {};
				let stringSets = {};
				let textTargets = {};
				let counterTargets = {};

				originals.forEach((original, index) => {
					let href = urls[index];
					let sheet = new Sheet(original, href);

					this.sheets.push(sheet);

					if (typeof sheet.width !== "undefined") {
						this.width = sheet.width;
					}

					if (typeof sheet.height !== "undefined") {
						this.height = sheet.height;
					}

					if (typeof sheet.orientation !== "undefined") {
						this.orientation = sheet.orientation;
					}

					this.mergeBreaks(pageBreaks, sheet.pageBreaks);
					stringSets = Object.assign(stringSets, sheet.stringSets);
					textTargets = Object.assign(textTargets, sheet.textTargets);
					counterTargets = Object.assign(counterTargets, sheet.counterTargets);

 					text += sheet.toString();
				})

				let s = this.insert(text);
				this.inserted.push(s);

				this.breaks = pageBreaks;

				this.stringSets = stringSets;

				this.textTargets = textTargets;
				this.counterTargets = counterTargets;

				return text;
			});
	}

	addBase() {
		return this.insert(baseStyles);
	}

	mergeBreaks(pageBreaks, newBreaks) {
		for (let b in newBreaks) {
			if (b in pageBreaks) {
				pageBreaks[b] = pageBreaks[b].concat(newBreaks[b]);
			} else {
				pageBreaks[b] = newBreaks[b];
			}
		}
		return pageBreaks;
	}

	insert(text){
		let head = document.querySelector("head");
		let style = document.createElement("style");
		style.type = "text/css";

		style.appendChild(document.createTextNode(text));

		head.appendChild(style);

		return style;
	}

	contents(fragment) {
		for (let name of Object.keys(this.stringSets)) {
			let set = this.stringSets[name];
			let selected = fragment.querySelector(set.selector);

			if (selected) {
				let cssVar;
				if (set.value === "content" || set.value === "content(text)") {
					cssVar = selected.textContent.replace(/\\([\s\S])|(["|'])/g,"\\$1$2");
					this.styleSheet.insertRule(`:root { --string-${name}: "${cssVar}"; }`, this.styleSheet.cssRules.length);
				} else {
					console.log(set.value + "needs css replacement");
				}
			}
		}

		Object.keys(this.textTargets).forEach((name) => {
			let target = this.textTargets[name];
			let split = target.selector.split("::");
			let query = split[0];
			let queried = fragment.querySelectorAll(query);
			queried.forEach((selected, index) => {
				let val = this.attr(selected, target.args);
				let element = fragment.querySelector(val);

				if (element) {
					if (target.style === "content") {
						let text = element.textContent;
						let selector = UUID();

						selected.setAttribute("data-target-text", selector);

						let psuedo = "";
						if (split.length > 1) {
							psuedo += "::" + split[1];
						}

						this.styleSheet.insertRule(`[data-target-text="${selector}"]${psuedo} { content: "${element.textContent}"; }`, this.styleSheet.cssRules.length);
					}
				}
			});

		});
	}

	counters(root) {
		Object.keys(this.counterTargets).forEach((name) => {
			let target = this.counterTargets[name];
			let split = target.selector.split("::");
			let query = split[0];
			let queried = root.querySelectorAll(query + ":not([data-target-counter])");

			queried.forEach((selected, index) => {
				// TODO: handle func other than attr
				if (target.func !== "attr") {
					return;
				}
				let val = this.attr(selected, target.args);
				let element = root.querySelector(val);

				if (element) {
					let selector = UUID();
					selected.setAttribute("data-target-counter", selector);
					// TODO: handle other counter types (by query)
					if (target.counter === "page") {
						let pages = root.querySelectorAll(".page");
						let pg = 0;
						for (var i = 0; i < pages.length; i++) {
							pg += 1;
							if (pages[i].contains( element )){
								break;
							}
						}

						let psuedo = "";
						if (split.length > 1) {
							psuedo += "::" + split[1];
						}

						this.styleSheet.insertRule(`[data-target-counter="${selector}"]${psuedo} { content: "${pg}"; }`, this.styleSheet.cssRules.length);

					}
				}
			});
		});
	}

	targetText(element) {

	}

	attr(element, attributes) {
		for (var i = 0; i < attributes.length; i++) {
			if(element.hasAttribute(attributes[i])) {
				return element.getAttribute(attributes[i]);
			}
		}
	}

	destroy() {
		this.styleEl.remove();
		this.inserted.forEach((s) => {
			s.remove();
		});
		this.sheets = [];
	}
}

export default Styler;

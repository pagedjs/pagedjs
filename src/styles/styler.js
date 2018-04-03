import Sheet from './sheet.js';

class Styler {
	constructor() {
		this.sheets = [];
	}

	async add() {
		let fetched = [];
		for (var i = 0; i < arguments.length; i++) {
			let f = fetch(arguments[i]).then((response) => {
				return response.text();
			})
			fetched.push(f);
		}

		return await Promise.all(fetched)
			.then((originals) => {
				let text;
				let pageBreaks = {};

				originals.forEach((original, index) => {
					let href = arguments[index];
					let sheet = new Sheet(original, href);

					this.sheets.push(sheet);

					this.mergeBreaks(pageBreaks, sheet.pageBreaks);

 					text += sheet.toString();
				})

				this.insert(text);

				this.breaks = pageBreaks;

				return text;
			});
	}

	root() {

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
	}

}

export default Styler;

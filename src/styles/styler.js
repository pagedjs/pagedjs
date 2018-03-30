import Sheet from './sheet.js';

class Styler {
  constructor() {
		this.sheets = [];
  }

	async add(href) {
		let sheet;
	 	return await fetch(href)
			.then((response) => {
				return response.text();
			}).then((original) => {
				sheet = new Sheet(original);

				let text = sheet.toString();
				console.log(text);
				this.insert(text);
			});
	}

	root() {

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

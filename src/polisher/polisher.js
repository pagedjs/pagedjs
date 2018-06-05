import Sheet from './sheet';
import baseStyles from './base';
import { UUID } from '../utils/utils';
import Hook from "../utils/hook";

class Polisher {
	constructor(setup) {
		this.sheets = [];
		this.inserted = [];

		this.hooks = {};
		this.hooks.onUrl = new Hook(this);
		this.hooks.onAtPage = new Hook(this);
		this.hooks.onAtMedia = new Hook(this);
		this.hooks.onRule = new Hook(this);
		this.hooks.onDeclaration = new Hook(this);
		this.hooks.onContent = new Hook(this);

		this.hooks.beforeTreeWalk = new Hook(this);
		this.hooks.afterTreeWalk = new Hook(this);

		if (setup !== false) {
			this.setup();
		}
	}

	setup() {
		this.base = this.addBase();
		this.inserted.push(this.base);
		this.styleEl = document.createElement("style");
		document.head.appendChild(this.styleEl);
		this.styleSheet = this.styleEl.sheet;
		return this.styleSheet;
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

				originals.forEach((original, index) => {
					let href = urls[index];
					let sheet = new Sheet(original, href, this.hooks);

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

 					text += sheet.toString();
				})

				let s = this.insert(text);
				this.inserted.push(s);

				return text;
			});
	}

	addBase() {
		return this.insert(baseStyles);
	}


	insert(text){
		let head = document.querySelector("head");
		let style = document.createElement("style");
		style.type = "text/css";
		style.setAttribute("data-pagedjs-inserted-styles", "true");

		style.appendChild(document.createTextNode(text));

		head.appendChild(style);

		return style;
	}

	destroy() {
		this.styleEl.remove();
		this.inserted.forEach((s) => {
			s.remove();
		});
		this.sheets = [];
	}
}

export default Polisher;

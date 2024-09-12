import Sheet from "./sheet.js";
import baseStyles from "./base.js";
import Hook from "../utils/hook.js";
import request from "../utils/request.js";

class Polisher {
	constructor(setup, doc = document) {
		this.sheets = [];
		this.inserted = [];

		this.hooks = {};
		this.hooks.onUrl = new Hook(this);
		this.hooks.onAtPage = new Hook(this);
		this.hooks.onAtMedia = new Hook(this);
		this.hooks.onRule = new Hook(this);
		this.hooks.onDeclaration = new Hook(this);
		this.hooks.onContent = new Hook(this);
		this.hooks.onSelector = new Hook(this);
		this.hooks.onPseudoSelector = new Hook(this);

		this.hooks.onImport = new Hook(this);

		this.hooks.beforeTreeParse = new Hook(this);
		this.hooks.beforeTreeWalk = new Hook(this);
		this.hooks.afterTreeWalk = new Hook(this);

		if (setup !== false) {
			this.setup(doc);
		}
	}

	setup(doc = document) {
		this.base = this.insert(baseStyles, doc);
		this.styleEl = doc.createElement("style");
		doc.head.appendChild(this.styleEl);
		this.styleSheet = this.styleEl.sheet;
		return this.styleSheet;
	}

	async add() {
		return await this.addInto(document, ...arguments)
	}

	async addInto(doc, ...args) {
		let fetched = [];
		let urls = [];

		for (var i = 0; i < args.length; i++) {
			let f;

			if (typeof args[i] === "object") {
				for (let url in args[i]) {
					let obj = args[i];
					f = new Promise(function(resolve, reject) {
						urls.push(url);
						resolve(obj[url]);
					});
				}
			} else {
				urls.push(args[i]);
				f = request(args[i]).then((response) => {
					return response.text();
				});
			}


			fetched.push(f);
		}

		return await Promise.all(fetched)
			.then(async (originals) => {
				let text = "";
				for (let index = 0; index < originals.length; index++) {
					text = await this.convertViaSheet(originals[index], urls[index], doc);
					this.insert(text, doc);
				}
				return text;
			});
	}

	async convertViaSheet(cssStr, href, doc = document) {
		let sheet = new Sheet(href, this.hooks);
		await sheet.parse(cssStr);

		// Insert the imported sheets first
		for (let url of sheet.imported) {
			let str = await request(url).then((response) => {
				return response.text();
			});
			let text = await this.convertViaSheet(str, url, doc);
			this.insert(text, doc);
		}

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
		return sheet.toString();
	}

	insert(text, doc = document){
		let head = doc.querySelector("head");
		let style = doc.createElement("style");
		style.setAttribute("data-pagedjs-inserted-styles", "true");

		style.appendChild(doc.createTextNode(text));

		head.appendChild(style);

		this.inserted.push(style);
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

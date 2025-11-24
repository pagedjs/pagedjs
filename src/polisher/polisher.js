import Sheet from "./sheet.js";
import baseStyles from "./base.js";
import Hook from "../utils/hook.js";
import request from "../utils/request.js";

/**
 * The Polisher class handles the parsing and insertion of CSS stylesheets,
 * including remote resources and special hooks for processing CSS content.
 */
class Polisher {
	/**
	 * Creates a new Polisher instance.
	 * @param {boolean} [setup=true] - Whether to immediately run setup.
	 */
	constructor(setup) {
		/** @type {Sheet[]} */
		this.sheets = [];

		/** @type {HTMLStyleElement[]} */
		this.inserted = [];

		/** @type {Object<string, Hook>} */
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
			this.setup();
		}
	}

	/**
	 * Sets up the base stylesheet and injects a <style> element into the document head.
	 * @returns {CSSStyleSheet} - The created stylesheet object.
	 */
	setup() {
		this.base = this.insert(baseStyles);
		this.styleEl = document.createElement("style");
		document.head.appendChild(this.styleEl);
		this.styleSheet = this.styleEl.sheet;
		return this.styleSheet;
	}

	/**
	 * Adds and processes one or more CSS sources (URLs or inline CSS).
	 * @param {...(string|Object<string, string>)} sources - URLs or object maps of URLs to CSS strings.
	 * @returns {Promise<string>} - The final processed CSS text.
	 */
	async add(...sources) {
		let fetched = [];
		let urls = [];

		for (let source of sources) {
			let f;

			if (typeof source === "object") {
				for (let url in source) {
					let css = source[url];
					urls.push(url);
					f = Promise.resolve(css);
				}
			} else {
				urls.push(source);
				f = request(source).then((response) => response.text());
			}

			fetched.push(f);
		}

		return await Promise.all(fetched).then(async (originals) => {
			let text = "";
			for (let index = 0; index < originals.length; index++) {
				text = await this.convertViaSheet(originals[index], urls[index]);
				this.insert(text);
			}
			return text;
		});
	}

	/**
	 * Converts raw CSS into a Sheet object, parses it, handles imports,
	 * and returns the processed CSS string.
	 * @param {string} cssStr - The raw CSS string.
	 * @param {string} href - The source URL for the CSS.
	 * @returns {Promise<string>} - The processed CSS text.
	 */
	async convertViaSheet(cssStr, href) {
		let sheet = new Sheet(href, this.hooks);
		await sheet.parse(cssStr);

		// Handle @imported styles recursively
		for (let url of sheet.imported) {
			let str = await request(url).then((response) => response.text());
			let text = await this.convertViaSheet(str, url);
			this.insert(text);
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

	/**
	 * Inserts a CSS string into the document inside a <style> tag.
	 * @param {string} text - The CSS to insert.
	 * @returns {HTMLStyleElement} - The created style element.
	 */
	insert(text) {
		let head = document.querySelector("head");
		let style = document.createElement("style");
		style.setAttribute("data-pagedjs-inserted-styles", "true");
		style.appendChild(document.createTextNode(text));
		head.appendChild(style);
		this.inserted.push(style);
		return style;
	}

	/**
	 * Cleans up all inserted styles and resets the polisher.
	 */
	destroy() {
		this.styleEl.remove();
		this.inserted.forEach((s) => {
			s.remove();
		});
		this.sheets = [];
	}
}

export default Polisher;

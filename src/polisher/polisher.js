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
	 * @param {Array<string | { url: string } | { css: string }>} styles
	 *   List of styles to apply. Each item can be:
	 *   - A string (CSS file path or raw CSS)
	 *   - An object with a `url` property (external stylesheet)
	 *   - An object with a `css` property (inline CSS)
	 * those are possible styles setup:
	 *   let style = "./css/default.css";
	 *   let style = `{css: "@page{size: a3}"`
	 *   let style = `{url: "./modules/chow.css"}`
	 *   let style = "body { color: red; } @page {size: 200mm 200mm}";
	 *   let style = [ "h1{text-decoration: underline;}", "./css/default.css", { nothing: "body { color: red; } @page {size: 200mm 200mm}" }, { z: "h1{color:green}" } ];
	 *
	 */

	async add(sources) {
		const inputs = this.normalizeCssSources(sources);
		console.log(inputs);

		const originals = await Promise.all(inputs.map((input) => input.content));

		const results = await Promise.all(
			originals.map((content, i) =>
				this.convertViaSheet(content, inputs[i].url),
			),
		);

		results.forEach((text) => this.insert(text));
		return results;
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
			let str = await request(url, {
				headers: { Accept: "text/css" },
			}).then((response) => response.text());
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

	/**
	 * check if the string is a url for a css file
	 */
	isCssUrl(string) {
		// test if the string  ends with css
		if (/\.css(\?|#|$)/i.test(string)) return true;

		// test if the string looks like a url
		if (this.isURL(string)) return true;

		// test if the string looks like a filepath
		if (this.isFilePath(string)) return true;
		return false;
	}

	isURL(str) {
		try {
			new URL(str);
			return true;
		} catch {
			return false;
		}
	}

	isFilePath(str) {
		return /^(\/|\.\/|\.\.\/|[a-zA-Z]:\\)/.test(str);
	}

	normalizeCssSources(sources) {
		const list = [];

		const add = (url, content) => {
			list.push({ url, content: Promise.resolve(content) });
		};

		const addUrl = (url) => {
			list.push({
				url: url,
				content: request(url, { headers: { Accept: "text/css" } }).then((r) =>
					r.text(),
				),
			});
		};
		const process = (source) => {
			if (typeof source == "string") {
				if (this.isCssUrl(source)) {
					addUrl(source);
				} else {
					add(undefined, source);
				}
			} else if (source && typeof source == "object") {
				if (source.url) {
					addUrl(source.url);
				} else if (source.css) {
					add(source.url, source.css);
				} else {
					for (const key in source) {
						const value = source[key];
						if (this.isCssUrl(key)) {
							add(key, value);
						} else {
							add(undefined, value);
						}
					}
				}
			}
		};

		if (typeof sources === "string") {
			process(sources);
		} else if (sources && typeof sources[Symbol.iterator] === "function") {
			for (const s of sources) {
				process(s);
			}
		} else if (sources && typeof sources === "object") {
			process(sources);
		}

		return list;
	}
}

export default Polisher;

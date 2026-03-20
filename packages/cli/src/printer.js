import EventEmitter from "events";
import puppeteer from "puppeteer";

import path from "path";
import fs from "fs";
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "node:path";
import { fileURLToPath } from "url";

import { PDFDocument } from "pdf-lib";
import { setTrimBoxes, setMetadata } from "./postprocesser.js";
import { parseOutline, setOutline } from "./outline.js";

const currentPath = fileURLToPath(import.meta.url);
const dir = process.cwd();

const scriptPath = path.resolve(path.dirname(currentPath), "../dist/paged.polyfill.js");

class Printer extends EventEmitter {
	constructor(options = {}) {
		super();

		this.debug = typeof options.debug !== "undefined" ? options.debug : false;
		this.headless = options.headless !== false ? "new" : false;
		this.allowLocal = options.allowLocal || false;
		this.allowRemote = typeof options.allowRemote !== "undefined" ? options.allowRemote : true;
		this.additionalScripts = options.additionalScripts || [];
		this.allowedPaths = options.allowedPaths || [];
		this.allowedDomains = options.allowedDomains || [];
		this.ignoreHTTPSErrors = options.ignoreHTTPSErrors || false;
		this.browserWSEndpoint = options.browserEndpoint;
		this.browserArgs = options.browserArgs;
		this.overrideDefaultBackgroundColor = options.overrideDefaultBackgroundColor || false;
		this.timeout = options.timeout || 0;
		this.closeAfter = typeof options.closeAfter !== "undefined" ? options.closeAfter : true;
		this.emulateMedia = options.emulateMedia || "print";
		this.styles = options.styles || [];
		this.enableWarnings = options.enableWarnings || false;
		this.disableScriptInjection = options.disableScriptInjection || false;
		this.extraHTTPHeaders = options.extraHTTPHeaders || {};

		this.pages = [];

		if (this.debug) {
			this.headless = false;
			this.closeAfter = false;
		}
	}

	async setup() {
		let tmpDir = await mkdtemp(join(tmpdir(), "pagedjs-"));

		let puppeteerOptions = {
			headless: this.headless,
			args: [],
			ignoreHTTPSErrors: this.ignoreHTTPSErrors,
			userDataDir: tmpDir
		};

		if (this.allowLocal) {
			puppeteerOptions.args.push("--allow-file-access-from-files");
		}

		if (this.browserArgs) {
			puppeteerOptions.args.push(...this.browserArgs);
		}

		if (this.browserWSEndpoint) {
			puppeteerOptions.browserWSEndpoint = this.browserWSEndpoint;
			this.browser = await puppeteer.connect(puppeteerOptions);
		} else {
			this.browser = await puppeteer.launch(puppeteerOptions);
		}

		return this.browser;
	}

	async render(input) {
		let resolver;
		let rendered = new Promise(function(resolve, reject) {
			resolver = resolve;
		});

		if (!this.browser) {
			await this.setup();
		}

		try {
			const page = await this.browser.newPage();
			page.setDefaultTimeout(this.timeout);

			page.setExtraHTTPHeaders(this.extraHTTPHeaders);

			await page.emulateMediaType(this.emulateMedia);

			if (this.overrideDefaultBackgroundColor) {
				page._client.send("Emulation.setDefaultBackgroundColorOverride", { color: this.overrideDefaultBackgroundColor });
			}

			let url, relativePath, html;
			if (typeof input === "string") {
				try {
					new URL(input);
					url = input;
				} catch (error) {
					relativePath = path.resolve(dir, input);

					if (this.browserWSEndpoint) {
						html = fs.readFileSync(relativePath, "utf-8");
					} else {
						url = "file://" + relativePath;
					}
				}
			} else {
				url = input.url;
				html = input.html;
			}

			if (this.needsAllowedRules()) {
				await page.setRequestInterception(true);

				page.on("request", (request) => {
					let uri = new URL(request.url());
					let { host, protocol, pathname } = uri;
					let local = protocol === "file:";

					if (local && this.withinAllowedPath(pathname) === false) {
						request.abort();
						return;
					}

					if (local && !this.allowLocal) {
						request.abort();
						return;
					}

					if (host && this.isAllowedDomain(host) === false) {
						request.abort();
						return;
					}

					if (host && !this.allowRemote) {
						request.abort();
						return;
					}

					request.continue();
				});	
			}

			if (this.disableScriptInjection) {
				await page.evaluateOnNewDocument(() => {
					window.PagedConfig = { auto: false };
				});
			}

			if (html) {
				await page.setContent(html);

				if (url) {
					await page.evaluate((url) => {
						let base = document.querySelector("base");
						if (!base) {
							base = document.createElement("base");
							document.querySelector("head").appendChild(base);
						}
						base.setAttribute("href", url);
					}, url);
				}

			} else {
				await page.goto(url);
			}

			this.content = await page.content();

			if (!this.disableScriptInjection) {
				await page.evaluate(() => {
					window.PagedConfig = window.PagedConfig || {};
					window.PagedConfig.auto = false;
				});

				await page.addScriptTag({
					path: scriptPath
				});
			}

			for (const style of this.styles) {
				await page.addStyleTag({
					[this.isUrl(style) ? "url" : "path"]: style
				});
			}

			for (const script of this.additionalScripts) {
				await page.addScriptTag({
					[this.isUrl(script) ? "url" : "path"]: script
				});
			}

			await page.exposeFunction("onSize", (size) => {
				this.emit("size", size);
			});

			await page.exposeFunction("onPage", (page) => {

				this.pages.push(page);

				this.emit("page", page);
			});

			await page.exposeFunction("onRendered", (msg, width, height, orientation) => {
				this.emit("rendered", msg, width, height, orientation);
				resolver({msg, width, height, orientation});
			});

			await page.evaluate(async () => {
				let done;
				window.PagedPolyfill.on("page", (page) => {
					const { id, width, height, startToken, endToken, breakAfter, breakBefore, position } = page;

					const mediabox = page.element.getBoundingClientRect();
					const cropbox = page.pagebox.getBoundingClientRect();

					function getPointsValue(value) {
						return (Math.round(CSS.px(value).to("pt").value * 100) / 100);
					}

					let boxes = {
						media: {
							width: getPointsValue(mediabox.width),
							height: getPointsValue(mediabox.height),
							x: 0,
							y: 0
						},
						crop: {
							width: getPointsValue(cropbox.width),
							height: getPointsValue(cropbox.height),
							x: getPointsValue(cropbox.x) - getPointsValue(mediabox.x),
							y: getPointsValue(cropbox.y) - getPointsValue(mediabox.y)
						}
					};

					window.onPage({ id, width, height, startToken, endToken, breakAfter, breakBefore, position, boxes });
				});

				window.PagedPolyfill.on("size", (size) => {
					window.onSize(size);
				});

				window.PagedPolyfill.on("rendered", (flow) => {
					let msg = "Rendering " + flow.total + " pages took " + flow.performance + " milliseconds.";
					window.onRendered(msg, flow.width, flow.height, flow.orientation);
				});

				if (window.PagedConfig.before) {
					await window.PagedConfig.before();
				}

				done = await window.PagedPolyfill.preview();

				if (window.PagedConfig.after) {
					await window.PagedConfig.after(done);
				}
			}).catch((error) => {
				throw error;
			});

			await page.waitForNetworkIdle({
				timeout: this.timeout
			});

			await rendered;

			await page.waitForSelector(".pagedjs_pages");

			return page;
		} catch (error) {
			this.closeAfter && this.close();
			throw error;
		}
	}

	async pdf(input, options={}) {
		let page = await this.render(input)
			.catch((e) => {
				throw e;
			});

		try {
			// Get metatags
			const meta = await page.evaluate(() => {
				let meta = {};
				let title = document.querySelector("title");
				if (title) {
					meta.title = title.textContent.trim();
				}
				let lang = document.querySelector("html").getAttribute("lang");
				if (lang) {
					meta.lang = lang;
				}
				let metaTags = document.querySelectorAll("meta");
				[...metaTags].forEach((tag) => {
					if (tag.name) {
						meta[tag.name] = tag.content;
					}
				});
				return meta;
			});

			const outlineTags = options.outlineTags || ["h1", "h2", "h3"];
			const outline = await parseOutline(page, outlineTags);

			let settings = {
				timeout: this.timeout,
				printBackground: true,
				displayHeaderFooter: false,
				preferCSSPageSize: options.width ? false : true,
				width: options.width,
				height: options.height,
				orientation: options.orientation,
				margin: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
				}
			};

			let pdf = await page.pdf(settings)
				.catch((e) => {
					throw e;
				});

			this.closeAfter && page.close();

			this.emit("postprocessing");

			let pdfDoc = await PDFDocument.load(pdf);

			setMetadata(pdfDoc, meta);
			setTrimBoxes(pdfDoc, this.pages);
			setOutline(pdfDoc, outline, this.enableWarnings);

			pdf = await pdfDoc.save();

			return pdf;
		} catch (error) {
			this.closeAfter && this.close();
			throw error;
		}
	}

	async html(input, stayopen) {
		let page = await this.render(input);

		let content = await page.content();

		if (this.closeAfter) {
			page.close();
			this.close();
		}

		return content;
	}

	async preview(input) {
		let page = await this.render(input);
		this.closeAfter && this.close();
		return page;
	}

	async close() {
		return this.browser && this.browser.close();
	}

	needsAllowedRules() {
		if (this.allowedPaths && this.allowedPaths.length !== 0) {
			return true;
		}
		if (this.allowedDomains && this.allowedDomains.length !== 0) {
			return true;
		}
	}

	withinAllowedPath(pathname) {
		if (!this.allowedPaths || this.allowedPaths.length === 0) {
			return true;
		}

		for (let parent of this.allowedPaths) {
			const relative = path.relative(parent, pathname);
			if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
				return true;
			}
		}

		return false;
	}

	isAllowedDomain(domain) {
		if (!this.allowedDomains || this.allowedDomains.length === 0) {
			return true;
		}
		return this.allowedDomains.includes(domain);
	}

	isUrl(resource) {
		try {
			new URL(resource);
			return true;
		} catch {
			return false;
		}
	}

}

export default Printer;

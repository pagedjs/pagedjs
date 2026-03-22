import { chromium } from "playwright-core";
import fs from "fs";
import { WS_ENDPOINT_PATH, DEBUG, ORIGIN, PDF_SETTINGS } from "./constants.js";

let browser;

async function getBrowser() {
	if (!browser) {
		const wsEndpoint = fs.readFileSync(WS_ENDPOINT_PATH, "utf8");
		if (!wsEndpoint) {
			throw new Error("wsEndpoint not found");
		}
		browser = await chromium.connect(wsEndpoint);
	}
	return browser;
}

export async function loadPage(path) {
	const b = await getBrowser();
	let page = await b.newPage();
	let renderedResolve, renderedReject;
	page.rendered = new Promise(function(resolve, reject) {
		renderedResolve = resolve;
		renderedReject = reject;
	});

	page.on("pageerror", (error) => {
		console.error(error);
		renderedReject(error);
	});

	page.on("error", (error) => {
		console.error(error);
		renderedReject(error);
	});

	page.on("requestfailed", (error) => {
		console.error(error);
		renderedReject(error);
	});

	page.on("console", async (msg) => {
		const args = [];
		for (let i = 0; i < msg.args().length; ++i) {
			args.push(await msg.args()[i].jsonValue());
		}
		if (args.length > 0) {
			args[0] = `${path}: ${args[0]}`;
		}
		const type = msg.type();
		let log;
		if (type === "warning") {
			log = console.warn;
		} else {
			// eslint-disable-next-line no-console
			log = console[msg.type()];
		}
		if (log) {
			log.apply(null, args);
		}
	});

	await page.exposeFunction("onRendered", (msg, width, height, orientation) => {
		renderedResolve(msg, width, height, orientation);
	});

	await page.addInitScript(() => {
		document.addEventListener("DOMContentLoaded", () => {
			window.PagedPolyfill.on("rendered", (flow) => {
				let msg = "Rendering " + flow.total + " pages took " + flow.performance + " milliseconds.";
				window.onRendered(msg, flow.width, flow.height, flow.orientation);
			});
		});
	});

	await page.goto(ORIGIN + "/specs/" + path, { waitUntil: "networkidle" });

	return page;
}

export { DEBUG, PDF_SETTINGS };

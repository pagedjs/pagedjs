import { test as base, expect } from "@playwright/test";
import "to-match-pdf-snapshot/playwright";
import { ORIGIN } from "./constants.js";

export { expect };

export const test = base.extend({
	loadPage: [async ({ browser }, use) => {
		const pages = [];

		const loadPage = async (path) => {
			const page = await browser.newPage();
			pages.push(page);

			let renderedResolve, renderedReject;
			const rendered = new Promise((resolve, reject) => {
				renderedResolve = resolve;
				renderedReject = reject;
			});

			page.on("pageerror", (error) => {
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
					log = console[msg.type()];
				}
				if (log) {
					log.apply(null, args);
				}
			});

			await page.exposeFunction("onRendered", (msg) => {
				renderedResolve(msg);
			});

			await page.addInitScript(() => {
				document.addEventListener("DOMContentLoaded", () => {
					window.PagedPolyfill.on("rendered", (flow) => {
						let msg = "Rendering " + flow.total + " pages took " + flow.performance + " milliseconds.";
						window.onRendered(msg);
					});
				});
			});

			await page.goto(ORIGIN + "/specs/" + path, { waitUntil: "networkidle" });
			await rendered;

			return page;
		};

		await use(loadPage);

		for (const page of pages) {
			await page.close();
		}
	}, { scope: "worker" }],
});

import { test as base, expect } from "@playwright/test";
import "to-match-pdf-snapshot/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { ORIGIN, PDF_REVIEW } from "./constants.js";
import { expectedFailureFor } from "./expected-failures.js";

export { expect };

/**
 * Read one computed property from a page-margin box across both shadow roots.
 *
 * @param {import("@playwright/test").Page} page - Browser page under test.
 * @param {number} pageNumber - One-based printed page number.
 * @param {string} boxName - CSS Paged Media margin-box name.
 * @param {string} property - Computed CSS property to return.
 * @param {string|null} [pseudo=null] - Optional pseudo-element selector.
 * @returns {Promise<string>} Computed property value.
 */
export function marginBoxStyle(
	page,
	pageNumber,
	boxName,
	property,
	pseudo = null,
) {
	return page.$eval(
		`paged-page[index='${pageNumber - 1}']`,
		(pagedPage, options) => {
			const box = pagedPage.marginBox(options.boxName);
			return getComputedStyle(box, options.pseudo)[options.property];
		},
		{ boxName, property, pseudo },
	);
}

/**
 * Read the assigned content of a page-margin box across both shadow roots.
 *
 * @param {import("@playwright/test").Page} page - Browser page under test.
 * @param {number} pageNumber - One-based printed page number.
 * @param {string} boxName - CSS Paged Media margin-box name.
 * @returns {Promise<string>} Concatenated assigned text.
 */
export function marginBoxText(page, pageNumber, boxName) {
	return page.$eval(
		`paged-page[index='${pageNumber - 1}']`,
		(pagedPage, name) =>
			pagedPage
				.marginBox(name)
				.slottedNodes.map((node) => node.textContent)
				.join(""),
		boxName,
	);
}

export const test = base.extend({
	// Playwright fixture callbacks require an object pattern even without dependencies.
	// eslint-disable-next-line no-empty-pattern
	preparePdfSnapshot: [async ({}, use, testInfo) => {
		const expectedFailure = expectedFailureFor(testInfo.file, testInfo.title);
		if (expectedFailure) {
			testInfo.fail(true, `${expectedFailure}: known pagedNG issue`);
		}
		if (PDF_REVIEW) {
			await mkdir(path.dirname(testInfo.snapshotPath("placeholder.png")), {
				recursive: true,
			});
		}
		await use();
	}, { auto: true }],
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
				if (type === "warning") console.warn(...args);
				if (type === "error") console.error(...args);
			});

			await page.exposeFunction("onRendered", (flow) => {
				renderedResolve(flow);
			});

			await page.addInitScript(() => {
				const configuredAfter = window.PagedConfig?.after;
				window.PagedConfig = {
					...window.PagedConfig,
					async after(flow) {
						await configuredAfter?.(flow);
						await window.onRendered({
							total: flow.total,
							performance: flow.performance,
						});
					},
				};
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

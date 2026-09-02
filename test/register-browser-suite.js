import { readFileSync } from "node:fs";
import { test, runBrowserCase } from "./browser-fixture.js";

/**
 * The `it()` names a case module registers, read out of its source.
 *
 * Playwright needs its tests declared synchronously at collection time, before
 * a browser exists, so the names cannot be collected by importing the module —
 * it only runs in the page. Scanning the source is what lets one browser case
 * appear as one Playwright test, with its own page and its own failure.
 *
 * The names must therefore be literal and unique, which is what this checks.
 */
function testNames(modulePath, testFileURL) {
	const source = readFileSync(new URL(modulePath, testFileURL), "utf8");
	const names = [...source.matchAll(/^\s*it\(\s*("(?:\\.|[^"\\])*")/gm)].map(
		(match) => JSON.parse(match[1]),
	);
	if (names.length === 0 || new Set(names).size !== names.length) {
		throw new Error(`${modulePath} must contain unique, literal browser-test names.`);
	}
	return names;
}

/**
 * Declare one Playwright test per `it()` in a browser case module.
 *
 * @param {string} title - The describe block the tests are grouped under.
 * @param {string} modulePath - The case module, relative to the test file.
 * @param {string} testFileURL - The calling test file's `import.meta.url`.
 */
export function registerBrowserSuite(title, modulePath, testFileURL) {
	test.describe(title, () => {
		for (const name of testNames(modulePath, testFileURL)) {
			test(name, async ({ page }) => {
				await runBrowserCase(
					page,
					modulePath.replace("./", "/test/"),
					name,
				);
			});
		}
	});
}

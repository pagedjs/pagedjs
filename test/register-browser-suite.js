import { readFileSync } from "node:fs";
import { test, runBrowserCase } from "./browser-fixture.js";

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

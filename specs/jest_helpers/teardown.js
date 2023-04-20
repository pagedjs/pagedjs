// const chalk = require("chalk");
// const rimraf = require("rimraf");

// const { DIR, DEBUG } = require("./constants");
import chalk from "chalk";
import { rimrafSync } from "rimraf";
import { DIR, DEBUG } from "./constants.js";

export default async function() {
	// eslint-disable-next-line no-console
	DEBUG && console.log(chalk.green("Teardown Puppeteer"));
	if (!DEBUG) {
		await global.browser.close();
		global.server.close();
	}
	rimrafSync(DIR);
}

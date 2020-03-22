const chalk = require("chalk");
const rimraf = require("rimraf");

const { DIR, DEBUG } = require("./constants");

module.exports = async function() {
	// eslint-disable-next-line no-console
	DEBUG && console.log(chalk.green("Teardown Puppeteer"));
	if (!DEBUG) {
		await global.browser.close();
		global.server.close();
	}
	rimraf.sync(DIR);
};

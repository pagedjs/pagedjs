const chalk = require('chalk');
const puppeteer = require('puppeteer');
const rimraf = require('rimraf');
const os = require('os');
const path = require('path');

const { DIR, DEBUG, CI, PORT } = require('./constants');

module.exports = async function() {
	DEBUG && console.log(chalk.green('Teardown Puppeteer'));
	if (!DEBUG) {
		await global.browser.close();
		global.server.close();
	}
	rimraf.sync(DIR);
}

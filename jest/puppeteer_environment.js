const chalk = require('chalk');
const NodeEnvironment = require('jest-environment-node');
const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { WS_ENDPOINT_PATH, DIR, DEBUG, ORIGIN } = require('./constants');

class PuppeteerEnvironment extends NodeEnvironment {
	constructor(config) {
		super(config);
	}

	async setup() {
		DEBUG && console.log(chalk.yellow('Setup Test Environment.'));
		await super.setup()
		const wsEndpoint = fs.readFileSync(WS_ENDPOINT_PATH, 'utf8');
		if (!wsEndpoint) {
			throw new Error('wsEndpoint not found');
		}
		this.global.browser = await puppeteer.connect({
			browserWSEndpoint: wsEndpoint,
		})
		this.global.origin = ORIGIN;
		this.global.DEBUG = DEBUG;
	}

	async teardown() {
		DEBUG && console.log(chalk.yellow('Teardown Test Environment.'));
		await super.teardown();
	}

	runScript(script) {
		return super.runScript(script);
	}
}

module.exports = PuppeteerEnvironment;

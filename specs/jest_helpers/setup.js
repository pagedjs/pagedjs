const chalk = require('chalk');
const puppeteer = require('puppeteer');
const fs = require('fs');
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');

const express = require('express');
const app = express();

const { WS_ENDPOINT_PATH, DIR, DEBUG, CI, PORT } = require('./constants');

module.exports = async function() {

	DEBUG && console.log(chalk.green('Starting Static Server\n'));
	app.use(express.static(path.join(__dirname, '../../')));
	const server = app.listen(PORT);
	global.server = server;
	global.origin = `http://localhost:${PORT}`;

	DEBUG && console.log(chalk.green('Setup Puppeteer'));
	let args = CI ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : ['--disable-dev-shm-usage'];
	const browser = await puppeteer.launch({
		headless: DEBUG ? false : true,
		args: args
	})
	global.browser = browser;
	mkdirp.sync(DIR);
	fs.writeFileSync(WS_ENDPOINT_PATH, browser.wsEndpoint());
}

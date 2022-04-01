import chalk from "chalk";
// import puppeteer from "puppeteer";
import { chromium } from "playwright-core";
import fs from "fs";
import mkdirp from "mkdirp";
import path from "path";
import express from "express";
import { WS_ENDPOINT_PATH, DIR, DEBUG, CI, PORT } from "./constants.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

export default async function() {

	// eslint-disable-next-line no-console
	DEBUG && console.log(chalk.green("Starting Static Server\n"));
	app.use(express.static(path.join(__dirname, "../../")));
	const server = app.listen(PORT);
	global.server = server;
	global.origin = `http://localhost:${PORT}`;

	// eslint-disable-next-line no-console
	DEBUG && console.log(chalk.green("Setup Puppeteer"));
	let args = CI ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] : ["--disable-dev-shm-usage"];
	const browser = await chromium.launchServer({
		headless: !DEBUG,
		args: args
	});
	global.browser = browser;
	mkdirp.sync(DIR);
	fs.writeFileSync(WS_ENDPOINT_PATH, browser.wsEndpoint());
}

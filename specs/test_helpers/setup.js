import chalk from "chalk";
import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import express from "express";
import { WS_ENDPOINT_PATH, DIR, DEBUG, CI, PORT } from "./constants.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let browser;
let server;

export async function setup() {
	// eslint-disable-next-line no-console
	DEBUG && console.log(chalk.green("Starting Static Server\n"));
	const app = express();
	app.use(express.static(path.join(__dirname, "../../")));
	server = app.listen(PORT);

	// eslint-disable-next-line no-console
	DEBUG && console.log(chalk.green("Setup Playwright"));
	let args = CI ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] : ["--disable-dev-shm-usage"];
	browser = await chromium.launchServer({
		headless: !DEBUG,
		args: args
	});

	fs.mkdirSync(DIR, { recursive: true });
	fs.writeFileSync(WS_ENDPOINT_PATH, browser.wsEndpoint());
}

export async function teardown() {
	// eslint-disable-next-line no-console
	DEBUG && console.log(chalk.green("Teardown Playwright"));
	if (!DEBUG) {
		await browser.close();
		server.close();
	}
	fs.rmSync(DIR, { recursive: true, force: true });
}

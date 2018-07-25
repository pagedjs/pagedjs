const path = require('path');
const os = require('os');

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')
const WS_ENDPOINT_PATH = path.join(DIR, 'wsEndpoint')
const DEBUG = process.env.NODE_ENV === 'debug';
const PORT = 9999;
const ORIGIN = `http://localhost:${PORT}`;
const CI = process.env.CI === 'true';

const PDF_SETTINGS = {
		printBackground: true,
		displayHeaderFooter: false,
		preferCSSPageSize: true
	};

module.exports = {
	DIR,
	WS_ENDPOINT_PATH,
	DEBUG,
	PORT,
	ORIGIN,
	CI,
	PDF_SETTINGS
}

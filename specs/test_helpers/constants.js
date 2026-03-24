const DEBUG = process.env.NODE_ENV === "debug";
const PORT = 9999;
const ORIGIN = `http://localhost:${PORT}`;
const CI = process.env.CI === "true";

const PDF_SETTINGS = {
	printBackground: true,
	displayHeaderFooter: false,
	preferCSSPageSize: true
};

export {
	DEBUG,
	PORT,
	ORIGIN,
	CI,
	PDF_SETTINGS
};

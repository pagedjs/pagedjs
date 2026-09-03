const PDF_REVIEW = process.env.PAGED_PDF_REVIEW === "true";
const PORT = 9999;
const ORIGIN = `http://localhost:${PORT}`;
const CI = process.env.CI === "true";

const PDF_SETTINGS = {
	printBackground: true,
	displayHeaderFooter: false,
	preferCSSPageSize: true
};

export {
	PDF_REVIEW,
	PORT,
	ORIGIN,
	CI,
	PDF_SETTINGS
};

import { expect } from "vitest";
import path from "path";
import { fileURLToPath } from "url";
import Printer from "@pagedjs/cli";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { toMatchPDFSnapshot } from "./pdf_snapshot.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPECS_DIR = path.join(__dirname, "..");
const DEBUG = process.env.NODE_ENV === "debug";

// Create a shared Printer instance for this worker
const printer = new Printer({
	allowLocal: true,
	closeAfter: false,
	timeout: 10000,
	headless: !DEBUG,
});

// Register custom matchers
expect.extend({ toMatchImageSnapshot, toMatchPDFSnapshot });

// Expose globals for spec files
globalThis.DEBUG = DEBUG;

globalThis.loadPage = async function (htmlPath) {
	const filePath = path.join(SPECS_DIR, htmlPath);
	const page = await printer.preview(filePath);
	return page;
};

globalThis.generatePdf = async function (htmlPath) {
	const filePath = path.join(SPECS_DIR, htmlPath);
	const pdfBuffer = await printer.pdf(filePath);
	return Buffer.from(pdfBuffer);
};

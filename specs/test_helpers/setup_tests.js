import { expect } from "vitest";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import toMatchPDFSnapshot from "./pdf_snapshot.js";
import { loadPage } from "./browser.js";
import { DEBUG, PDF_SETTINGS } from "./constants.js";

expect.extend({ toMatchImageSnapshot, toMatchPDFSnapshot });

globalThis.loadPage = loadPage;
globalThis.DEBUG = DEBUG;
globalThis.PDF_SETTINGS = PDF_SETTINGS;

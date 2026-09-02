import { registerBrowserSuite } from "./register-browser-suite.js";

registerBrowserSuite("@page data extraction", "./cases/pageData.case.js", import.meta.url);

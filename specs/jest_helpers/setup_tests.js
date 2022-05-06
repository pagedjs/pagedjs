import { toMatchImageSnapshot } from "jest-image-snapshot";
import toMatchPDFSnapshot from "./pdf_snapshot.js";

expect.extend({ toMatchImageSnapshot, toMatchPDFSnapshot });

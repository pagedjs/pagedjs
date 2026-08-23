import { atPageRules } from "./atpage.js";
import { atMediaRules } from "./atmedia.js";

export { atPageRules } from "./atpage.js";
export { atMediaRules } from "./atmedia.js";

/**
 * The page-model rules. They describe how `@page`, its margin boxes and
 * print/screen media map onto the `<paged-page>` element tree, which the
 * components and the page resolver read back — no handler owns them, so
 * they are always applied and cannot be replaced by pushing a handler.
 */
export const coreRules = [...atPageRules, ...atMediaRules];

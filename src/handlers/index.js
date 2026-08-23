import { Fragmenter } from "fragmentainers";
import { Footnote } from "./footnote.js";

/**
 * pagedjs's layout handlers. Appended once, at import, to the shared
 * fragmentainers catalog so every Fragmenter constructed afterwards
 * instantiates them. This module is the one sanctioned import-time side
 * effect for handlers; `src/index.js` and the polyfill import it before
 * any render.
 */
export const pagedHandlers = [Footnote];

for (const Handler of pagedHandlers) {
	if (!Fragmenter.handlers.includes(Handler)) {
		Fragmenter.handlers.push(Handler);
	}
}

export { Footnote };

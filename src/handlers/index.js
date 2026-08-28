import { Fragmenter } from "fragmentainers";
import { Footnote } from "./footnote.js";
import { PageCounter } from "./page-counter.js";
import { NamedStrings } from "./named-strings.js";
import { RunningElements } from "./running-elements.js";
import { TargetText } from "./target-text.js";
import { TargetCounters } from "./target-counters.js";

/**
 * pagedjs's layout handlers. Appended once, at import, to the shared
 * fragmentainers catalog so every Fragmenter constructed afterwards
 * instantiates them. This module is the one sanctioned import-time side
 * effect for handlers; `src/index.js` and the polyfill import it before
 * any render.
 */
export const pagedHandlers = [
	Footnote,
	PageCounter,
	NamedStrings,
	RunningElements,
	TargetText,
	TargetCounters,
];

for (const Handler of pagedHandlers) {
	if (!Fragmenter.handlers.includes(Handler)) {
		Fragmenter.handlers.push(Handler);
	}
}

export { Footnote, PageCounter, NamedStrings, RunningElements, TargetText, TargetCounters };

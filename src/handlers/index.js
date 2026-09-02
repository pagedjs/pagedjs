import { Fragmenter } from "fragmentainers";
import { SourceFilters } from "./source-filters.js";
import { Footnote } from "./footnote.js";
import { PageCounter } from "./page-counter.js";
import { NamedStrings } from "./named-strings.js";
import { RunningElements } from "./running-elements.js";
import { TargetText } from "./target-text.js";
import { TargetCounters } from "./target-counters.js";

/**
 * pagedjs's layout handlers. Registered once, at import, into the shared
 * fragmentainers catalog so every Fragmenter constructed afterwards
 * instantiates them. This module is the one sanctioned import-time side
 * effect for handlers; `src/index.js` and the polyfill import it before
 * any render.
 */
export const pagedHandlers = [
	SourceFilters,
	Footnote,
	PageCounter,
	NamedStrings,
	RunningElements,
	TargetText,
	TargetCounters,
];

// SourceFilters leads the catalog rather than joining its end: the engine's
// StyleResolver freezes `+` and `~` matches over the source tree in its own
// prepareContent, then replays them onto continuation fragments, and a
// <script> counts as an element sibling in that walk. Registered after it,
// `.b + .b` with a script between the two freezes as "no match" and stops
// applying on every fragment.
for (const Handler of pagedHandlers) {
	if (Fragmenter.handlers.includes(Handler)) continue;
	if (Handler === SourceFilters) Fragmenter.handlers.unshift(Handler);
	else Fragmenter.handlers.push(Handler);
}

export {
	SourceFilters,
	Footnote,
	PageCounter,
	NamedStrings,
	RunningElements,
	TargetText,
	TargetCounters,
};

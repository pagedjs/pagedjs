import "./handlers/index.js";
import { PrintStyleSheet } from "./print-stylesheet/PrintStyleSheet.js";
import { PagedPreview } from "./preview/PagedPreview.js";
import * as components from "./components.js";

export { Fragmenter, LayoutHandler } from "fragmentainers";
// Every cataloged handler, so a subclass pushed onto `Fragmenter.handlers` can
// take a specific handler's slot rather than only appending to the catalog.
export {
	pagedHandlers,
	SourceFilters,
	NestedFixedPosition,
	Footnote,
	PageCounter,
	NamedStrings,
	RunningElements,
	TargetText,
	TargetCounters,
} from "./handlers/index.js";

export { PagedPreview, PrintStyleSheet, components };

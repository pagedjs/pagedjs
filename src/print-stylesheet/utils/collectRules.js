import { resolveHandlerClasses } from "fragmentainers/handlers.js";
import { coreRules } from "../rules/index.js";

/**
 * Derive a transformer rule list from a handler catalog.
 *
 * A handler carries the CSS it depends on as `static rules`, so the
 * rewrite and the runtime that consumes it are registered together and a
 * subclass pushed onto the catalog replaces both at once. Ordering is the
 * catalog's resolved order, the same one the flow instantiates in.
 *
 * @param {Array<typeof import("fragmentainers/handlers.js").LayoutHandler>} catalog
 * @returns {Array<{ type: string, match: Function, transform: Function }>}
 */
export function collectRules(catalog) {
	const classes = resolveHandlerClasses(catalog);
	return [...coreRules, ...classes.flatMap((Handler) => Handler.rules ?? [])];
}

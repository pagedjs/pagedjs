import { classifyPrintMedia } from "../utils/printMedia.js";

/**
 * Resolve `@media` against the medium the sheet is being generated for.
 *
 * Each comma-separated query is judged on its own: one that always matches
 * makes the wrapper redundant, one that never matches is struck from the
 * list, and the at-rule goes away once its last query does. Queries that
 * can't be decided statically — a bare feature test, an unknown media
 * type, `not print and (...)` — are left alone.
 */
export const atMediaRules = [
	{
		type: "media-query",
		match: (query) => classifyPrintMedia(query) === "match",
		transform: () => ({ unwrap: true }),
	},
	{
		type: "media-query",
		match: (query) => classifyPrintMedia(query) === "exclude",
		transform: () => ({ remove: true }),
	},
	{
		// The media type is already satisfied, so only the feature test is
		// left to evaluate.
		type: "media-query",
		match: (query) => classifyPrintMedia(query) === "condition",
		transform: ({ condition }) => ({ query: condition }),
	},
];

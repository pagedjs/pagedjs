const PRINT_TYPES = new Set(["print", "all"]);

/**
 * Classify a media query using the print transform's static type rules.
 * Condition presence is sufficient; its AST or serialized text is not evaluated.
 * @param {{modifier: string|null, mediaType: string|null, condition: unknown}} query Media query fields.
 * @returns {"match"|"exclude"|"condition"|"retain"} Static print disposition.
 */
export function classifyPrintMedia({ modifier, mediaType, condition }) {
	modifier = modifier?.toLowerCase();
	mediaType = mediaType?.toLowerCase();
	if ((modifier !== "not" && PRINT_TYPES.has(mediaType) && condition === null) ||
		(modifier === "not" && mediaType === "screen")) return "match";
	if ((modifier !== "not" && mediaType === "screen") ||
		(modifier === "not" && PRINT_TYPES.has(mediaType) && condition === null)) return "exclude";
	if (modifier !== "not" && PRINT_TYPES.has(mediaType) && condition !== null) return "condition";
	return "retain";
}

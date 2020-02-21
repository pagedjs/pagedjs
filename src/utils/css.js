export function cleanPseudoContent(el, trim = "\"' ") {
	return el
		.replace(new RegExp(`^[${trim}]+`), "")
		.replace(new RegExp(`[${trim}]+$`), "")
		.replace(/["']/g, match => {
			return "\\" + match;
		})
		.replace(/[\n]/g, match => {
			return "\\00000A";
		});
}
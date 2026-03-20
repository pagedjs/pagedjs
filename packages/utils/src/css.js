export function cleanPseudoContent(el, trim = "\"' ") {
	if(el == null) return;
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

export function cleanSelector(el) {
	if(el == null) return;
	return el
		.replace(new RegExp("::footnote-call", "g"), "")
		.replace(new RegExp("::footnote-marker", "g"), "");
}

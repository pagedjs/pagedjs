export const NAMED_PAGE_SIZES = {
	a3: ["297mm", "420mm"],
	a4: ["210mm", "297mm"],
	a5: ["148mm", "210mm"],
	b4: ["250mm", "353mm"],
	b5: ["176mm", "250mm"],
	letter: ["8.5in", "11in"],
	legal: ["8.5in", "14in"],
	ledger: ["11in", "17in"],
};

const DEFAULT_SIZE = ["8.5in", "11in"];
const isOrientation = (p) => p === "landscape" || p === "portrait";

export function resolvePageSize(sizeStr) {
	if (!sizeStr) return DEFAULT_SIZE;

	const parts = sizeStr.trim().toLowerCase().split(/\s+/);
	const orientation = parts.find(isOrientation);
	const dims = parts.filter((p) => !isOrientation(p));

	let w, h;
	const namedKey = dims.find((p) => NAMED_PAGE_SIZES[p]);
	if (namedKey) {
		[w, h] = NAMED_PAGE_SIZES[namedKey];
	} else if (dims.length === 0) {
		[w, h] = DEFAULT_SIZE;
	} else if (dims.length === 2) {
		[w, h] = [dims[0], dims[1]];
	} else if (dims.length === 1) {
		[w, h] = [dims[0], dims[0]];
	} else {
		return DEFAULT_SIZE;
	}

	if (orientation === "landscape") [w, h] = [h, w];

	return [w, h];
}

/**
 * Per-fragmentainer selection, shared by named strings (css-gcpm-3 §2) and
 * running elements (css-gcpm-3 §3). Both features answer the same question
 * once per page — which of a name's occurrences applies here — and differ
 * only in what an occurrence carries: a string, or an element to project.
 * https://www.w3.org/TR/css-gcpm-3/#using-named-strings
 */

/** The selection modes `string()` and `element()` accept. */
export const MODES = ["first", "start", "last", "first-except"];

/**
 * Elements that put something on the page without contributing text, so
 * their presence ahead of an occurrence still means the page did not open
 * with it.
 */
const REPLACED = new Set([
	"br",
	"canvas",
	"embed",
	"hr",
	"iframe",
	"img",
	"input",
	"object",
	"svg",
	"video",
]);

/**
 * Resolve one name's occurrences on one fragmentainer.
 *
 * `entry` is the value in effect when the page began. A page with no
 * occurrence carries it through unchanged, which is what keeps a running
 * header on the pages that follow its heading.
 *
 * @param {Array} occurrences - the page's occurrences, in document order
 * @param {*} entry - the value carried in from the preceding fragmentainer
 * @param {boolean} opensFragment - the first occurrence is what opens the page
 * @param {*} empty - what `first-except` yields on a page that does assign
 * @returns {Object} one value per mode
 */
export function selectPerMode(occurrences, entry, opensFragment, empty) {
	if (occurrences.length === 0) {
		return { first: entry, start: entry, last: entry, "first-except": entry };
	}
	return {
		first: occurrences[0],
		// The value *at the start* of the page: the entry value, unless the
		// assigning element is itself what the page opens with.
		start: opensFragment ? occurrences[0] : entry,
		last: occurrences[occurrences.length - 1],
		"first-except": empty,
	};
}

/**
 * The value a page hands to the next one: its last occurrence, or the entry
 * value when it has none.
 *
 * @param {Array} occurrences
 * @param {*} entry
 * @returns {*}
 */
export function exitValue(occurrences, entry) {
	return occurrences.length ? occurrences[occurrences.length - 1] : entry;
}

/**
 * True when nothing renders ahead of `element` inside `root`.
 *
 * This is the DOM reading of "the page begins with the element": ancestors
 * do not count, and neither does the whitespace between blocks, but any
 * text or replaced box before it does.
 *
 * @param {Node} root - the composed fragmentainer's content
 * @param {Element} element
 * @returns {boolean}
 */
export function opensFragment(root, element) {
	if (!root || !element) return false;
	const walker = root.ownerDocument.createTreeWalker(
		root,
		NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
	);
	let node = walker.nextNode();
	while (node && node !== element) {
		if (node.nodeType === Node.TEXT_NODE) {
			if (node.data.trim() !== "") return false;
		} else if (!node.contains(element) && REPLACED.has(node.localName)) {
			return false;
		}
		node = walker.nextNode();
	}
	return node === element;
}

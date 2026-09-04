import { resolvePageSize } from "./pageSize.js";
import { expandBleed, resolveBleed } from "./bleed.js";

/**
 * Build the physical `@page` rules consumed by browser printing.
 *
 * The leading rule fixes the target sheet to the same Letter fallback used by
 * `PageResolver`; later author rules override it through the normal page
 * cascade.
 *
 * @param {Array<Object>} pageData - Extracted author `@page` rules.
 * @returns {string[]} Browser `@page` rules in cascade order.
 */
export function buildAtPageRules(pageData) {
	const [defaultWidth, defaultHeight] = resolvePageSize();
	const rules = [
		`@page { margin: 0; size: ${defaultWidth} ${defaultHeight}; }`,
	];
	for (const d of pageData) {
		if (d.nth) continue;

		const decls = ["margin: 0"];
		if (d.size || d.bleed || d.marks) {
			const sizeRule = resolvePagePropertyRule(pageData, d, "size");
			const bleedRule = resolvePagePropertyRule(pageData, d, "bleed");
			const marksRule = resolvePagePropertyRule(pageData, d, "marks");
			const [w, h] = resolvePageSize(sizeRule?.size);
			const marks = marksRule?.marks ?? null;
			const bleedValue = bleedRule?.bleedAuto
				? resolveBleed("auto", marks)
				: bleedRule?.bleed || resolveBleed("auto", marks);
			const bleed = expandBleed(bleedValue);
			decls.push(
				`size: calc(${bleed.left} + ${w} + ${bleed.right}) calc(${bleed.top} + ${h} + ${bleed.bottom})`,
			);
		}
		const block = `{ ${decls.join("; ")}; }`;

		if (d.pseudo.includes("blank")) {
			const blankName = d.name ? `${d.name}-blank` : "blank";
			rules.push(`@page ${blankName} ${block}`);
			const selector = d.name
				? `paged-page[name="${d.name}"][blank]`
				: "paged-page[blank]";
			rules.push(`${selector} { page: ${blankName}; }`);
		} else {
			const prelude = buildPagePrelude(d.name, d.pseudo);
			const preludePart = prelude ? ` ${prelude}` : "";
			rules.push(`@page${preludePart} ${block}`);
		}
	}
	return rules;
}

function resolvePagePropertyRule(pageData, target, property) {
	let winner = null;
	let winnerSpecificity = null;
	for (let index = 0; index < pageData.length; index += 1) {
		const candidate = pageData[index];
		if (candidate[property] == null || !pageRuleApplies(candidate, target)) continue;

		const specificity = pageRuleSpecificity(candidate);
		if (
			winner == null ||
			compareSpecificity(specificity, winnerSpecificity) >= 0
		) {
			winner = candidate;
			winnerSpecificity = specificity;
		}
	}
	return winner;
}

function pageRuleApplies(candidate, target) {
	if (candidate.nth) return false;
	if (candidate.name && candidate.name !== target.name) return false;
	if (!target.name && candidate.name) return false;
	return candidate.pseudo.every((pseudo) => target.pseudo.includes(pseudo));
}

function pageRuleSpecificity(page) {
	// CSS Page 3 §4.4.1: named page, :first/:blank, then :left/:right.
	return [
		page.name ? 1 : 0,
		page.pseudo.filter((pseudo) => pseudo === "first" || pseudo === "blank").length,
		page.pseudo.filter((pseudo) => pseudo === "left" || pseudo === "right").length,
	];
}

function compareSpecificity(a, b) {
	for (let index = 0; index < a.length; index += 1) {
		if (a[index] !== b[index]) return a[index] - b[index];
	}
	return 0;
}

function buildPagePrelude(name, pseudo) {
	let s = name || "";
	for (const p of pseudo) {
		if (p === "blank") continue;
		s += `:${p}`;
	}
	return s;
}

import * as csstree from "css-tree";

export const ABSOLUTE_URL_RE =
	/^(?:https?:|data:|blob:|javascript:|mailto:|tel:|#|\/\/)/i;

export function transformUrls(ast, rules = [], ctx = {}) {
	const context = ctx ?? {};
	const activeRules = rules ?? [];
	const baseURL = context.baseURL;

	if (!activeRules.length && !baseURL) return ast;

	csstree.walk(ast, {
		visit: "Url",
		enter(node) {
			const meta = readUrlValue(node);
			if (meta == null) return;

			let current = resolveRelativeUrl(meta.text, baseURL);
			for (const rule of activeRules) {
				if (!rule.match(current, context)) continue;
				const next = rule.transform(current, context);
				if (typeof next === "string" && next !== current) {
					current = next;
				}
			}

			if (current !== meta.text) writeUrlValue(node, current, meta);
		},
	});

	return ast;
}

export function resolveRelativeUrl(url, baseURL) {
	if (!baseURL || ABSOLUTE_URL_RE.test(String(url).trim())) return url;

	try {
		return new URL(url, baseURL).href;
	} catch {
		return url;
	}
}

function readUrlValue(node) {
	if (!node.value) return null;

	if (node.value.type === "String" && typeof node.value.value === "string") {
		const raw = node.value.value;
		const quote = raw[0] === "\"" || raw[0] === "'" ? raw[0] : null;
		const text = quote ? raw.slice(1, -1) : raw;
		return { text, kind: "String", quote };
	}

	if (node.value.type === "Raw" && typeof node.value.value === "string") {
		return { text: node.value.value, kind: "Raw", quote: null };
	}

	if (typeof node.value === "string") {
		return { text: node.value, kind: "plain", quote: null };
	}

	return null;
}

function writeUrlValue(node, next, meta) {
	if (meta.kind === "String") {
		const q = meta.quote || "\"";
		node.value.value = `${q}${next}${q}`;
	} else if (meta.kind === "Raw") {
		node.value.value = next;
	} else if (meta.kind === "plain") {
		node.value = next;
	}
}

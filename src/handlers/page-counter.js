import { LayoutHandler } from "fragmentainers";

/**
 * Mirrors the engine's page counter onto each composed fragmentainer.
 *
 * The engine owns the page value: it is not the fragment's index, because
 * `@page` rules can reset or increment `page`, and blank pages consume a value
 * of their own. `<paged-page>` copies the annotation onto its host, where
 * `counter-set: page var(--paged-page)` hands it to the CSS cascade so
 * `counter(page)` in a margin box formats it.
 *
 * The document-wide `pages` total stays with `<paged-document>` as
 * `--paged-page-count`, since it is only known once the flow is complete.
 */
export class PageCounter extends LayoutHandler {
	/**
	 * @param {Element} element - The composed `<fragment-container>`.
	 * @param {import("fragmentainers/fragmentation.js").Fragment} fragment
	 */
	afterCompose(element, fragment) {
		const page = fragment?.page;
		if (page == null || !element?.style) return;
		element.style.setProperty("--paged-page", String(page));
	}
}

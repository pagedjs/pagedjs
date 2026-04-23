const LINK_SELECTOR = 'link[rel="stylesheet"]';
const STYLE_SELECTOR = "style";
const SCREEN_MEDIA_RE = /(^|,)\s*screen\s*($|,)/i;
const FETCH_TIMEOUT_MS = 10000;

export async function loadStylesheets(options = {}) {
  if (typeof document === "undefined") return [];

  const {
    root = document,
    fetchImpl = globalThis.fetch,
    timeoutMs = FETCH_TIMEOUT_MS,
    remove = false,
  } = options;

  const nodes = collectOriginalStyleNodes(root);

  const entries = [];
  const toRemove = [];
  for (const node of nodes) {
    if (node.tagName === "LINK") {
      const entry = await fetchStylesheet(node.getAttribute("href"), {
        fetchImpl,
        timeoutMs,
      });
      if (entry) {
        entries.push(entry);
        if (remove) toRemove.push(node);
      }
    } else if (node.tagName === "STYLE" && node.textContent) {
      entries.push({
        css: node.textContent,
        cssBaseURL: document.baseURI,
      });
      if (remove) toRemove.push(node);
    }
  }

  for (const node of toRemove) node.remove();

  return entries;
}

/**
 * Remove original `<style>` / `<link rel="stylesheet">` nodes from the DOM
 * without fetching anything — used when the caller supplies explicit
 * stylesheets and just needs to prevent the on-page originals from
 * double-applying.
 */
export function removeOriginalStyles(root = document) {
  if (typeof document === "undefined") return;
  for (const node of collectOriginalStyleNodes(root)) {
    node.remove();
  }
}

/**
 * Fetch a single stylesheet URL into a `{ css, cssBaseURL }` entry.
 * Returns `null` on invalid URLs, non-OK responses, or fetch errors,
 * with a console warning.
 */
export async function fetchStylesheet(href, options = {}) {
  const {
    fetchImpl = globalThis.fetch,
    timeoutMs = FETCH_TIMEOUT_MS,
    baseURL = typeof document !== "undefined" ? document.baseURI : undefined,
  } = options;

  if (!href) return null;

  let cssURL;
  try {
    cssURL = new URL(href, baseURL).href;
  } catch (err) {
    console.warn(`Invalid stylesheet URL: ${href}`, err);
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(cssURL, {
      signal: controller.signal,
      headers: { Accept: "text/css,*/*;q=0.1" },
    });
    if (!res.ok) {
      console.warn(`Failed to fetch stylesheet ${cssURL}: HTTP ${res.status}`);
      return null;
    }
    return { css: await res.text(), cssBaseURL: cssURL };
  } catch (err) {
    console.warn(`Failed to fetch stylesheet ${cssURL}:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function collectOriginalStyleNodes(root) {
  const nodes = [
    ...root.querySelectorAll(LINK_SELECTOR),
    ...root.querySelectorAll(STYLE_SELECTOR),
  ];
  return nodes.filter((node) => {
    if (node.dataset && node.dataset.pagedjsIgnore != null) return false;
    // Screen-only sheets should keep applying to the preview viewport
    // unchanged — don't swallow them into the print pipeline.
    if (node.media && SCREEN_MEDIA_RE.test(node.media)) return false;
    return true;
  });
}

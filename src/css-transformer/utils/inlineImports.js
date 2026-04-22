import * as csstree from "css-tree";
import { transformUrls } from "../transformers/transformUrls.js";
import urlRules from "../rules/urlRules.js";

const MAX_DEPTH = 8;

export async function inlineImports(ast, baseURL) {
  await inlineImportsRecursive(ast, baseURL, 0, new Set());
}

async function inlineImportsRecursive(ast, baseURL, depth, seen) {
  if (depth >= MAX_DEPTH) {
    dropAllImports(ast);
    return;
  }

  const targets = [];
  csstree.walk(ast, {
    visit: "Atrule",
    enter(node, item, list) {
      if (node.name === "import" && list) targets.push({ node, item, list });
    },
  });

  for (const { node, item, list } of targets) {
    const descriptor = readImportPrelude(node.prelude);
    if (!descriptor) {
      list.remove(item);
      continue;
    }

    let resolvedUrl;
    try {
      resolvedUrl = new URL(descriptor.url, baseURL || undefined).href;
    } catch {
      list.remove(item);
      continue;
    }

    if (seen.has(resolvedUrl)) {
      list.remove(item);
      continue;
    }
    seen.add(resolvedUrl);

    const cssText = await fetchImport(resolvedUrl);
    if (cssText == null) {
      list.remove(item);
      continue;
    }

    const importedAst = csstree.parse(cssText);

    await inlineImportsRecursive(importedAst, resolvedUrl, depth + 1, seen);

    transformUrls(importedAst, urlRules, { baseURL: resolvedUrl });

    const children = wrapImportedWithConditions(importedAst, descriptor.conditions);
    for (const child of children) {
      list.insert(list.createItem(child), item);
    }
    list.remove(item);
  }
}

function dropAllImports(ast) {
  csstree.walk(ast, {
    visit: "Atrule",
    enter(node, item, list) {
      if (node.name === "import" && list) list.remove(item);
    },
  });
}

function readImportPrelude(prelude) {
  if (!prelude || !prelude.children) return null;

  const children = [];
  prelude.children.forEach((c) => children.push(c));
  if (!children.length) return null;

  const [head, ...rest] = children;
  let url = null;
  if (head.type === "Url") url = readUrlNodeValue(head);
  else if (head.type === "String") url = stripQuotes(head.value);
  if (!url) return null;

  return { url, conditions: rest };
}

function readUrlNodeValue(urlNode) {
  if (typeof urlNode.value === "string") return stripQuotes(urlNode.value);
  if (urlNode.value && typeof urlNode.value.value === "string") {
    return stripQuotes(urlNode.value.value);
  }
  return null;
}

function stripQuotes(s) {
  if (!s) return s;
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

async function fetchImport(url) {
  if (url.startsWith("data:")) return decodeDataUrl(url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`@import fetch failed (HTTP ${res.status}): ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`@import fetch failed: ${url}`, err);
    return null;
  }
}

function decodeDataUrl(url) {
  const m = url.match(/^data:([^,]*?)(;base64)?,(.*)$/);
  if (!m) return null;
  try {
    return m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
  } catch {
    return null;
  }
}

function wrapImportedWithConditions(importedAst, conditions) {
  const rules = [];
  importedAst.children.forEach((c) => rules.push(c));
  if (!conditions || !conditions.length) return rules;

  let layerPart = null;
  let supportsPart = null;
  const mediaParts = [];

  for (const c of conditions) {
    if (c.type === "Identifier" && c.name === "layer") {
      layerPart = "";
    } else if (c.type === "Function" && c.name === "layer") {
      layerPart = unwrapFunction(csstree.generate(c), "layer");
    } else if (c.type === "Function" && c.name === "supports") {
      supportsPart = unwrapFunction(csstree.generate(c), "supports");
    } else {
      mediaParts.push(csstree.generate(c));
    }
  }

  let cssText = rules.map((r) => csstree.generate(r)).join("\n");

  if (mediaParts.length) {
    cssText = `@media ${mediaParts.join(" ")} { ${cssText} }`;
  }
  if (supportsPart != null) {
    cssText = `@supports (${supportsPart}) { ${cssText} }`;
  }
  if (layerPart != null) {
    cssText = `@layer${layerPart ? " " + layerPart : ""} { ${cssText} }`;
  }

  const wrappedAst = csstree.parse(cssText);
  const result = [];
  wrappedAst.children.forEach((c) => result.push(c));
  return result;
}

function unwrapFunction(text, name) {
  const m = text.match(new RegExp(`^${name}\\((.*)\\)$`));
  return m ? m[1].trim() : "";
}

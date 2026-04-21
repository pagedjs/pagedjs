import * as csstree from "css-tree";

export default [
  // Rename @page → paged-page
  {
    match: (n) => n.type === "Atrule" && n.name === "page",
    transform: (n) => {
      // Convert to a normal rule with selector
      n.type = "Rule";
      n.prelude = csstree.parse(".paged-page", {
        context: "selectorList",
      });
      n.name = undefined; // remove old atrule name
    },
  },

  // Rename @footnotes → .paged-footnotes
  {
    match: (n) => n.type === "Atrule" && n.name === "footnotes",
    transform: (n) => {
      // Convert to a normal rule with selector
      n.type = "Rule";
      n.prelude = csstree.parse(".paged-footnotes", {
        context: "selectorList",
      });
      n.name = undefined; // remove old atrule name
    },
  },

  // Margin boxes → convert @top-left, @top-center etc. into class rules
  ...[
    "top-left-corner",
    "top-left",
    "top-center",
    "top-right",
    "top-right-corner",
    "bottom-left-corner",
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "bottom-right-corner",
    "left-top",
    "left-middle",
    "left-bottom",
    "right-top",
    "right-middle",
    "right-bottom",
  ].map((name) => ({
    match: (n) => n.type === "Atrule" && n.name === name,
    transform: (n) => {
      // Convert at-rule into normal rule with class selector
      n.type = "Rule";
      n.prelude = csstree.parse(`& .${name}`, { context: "selectorList" });
      n.name = undefined; // remove old at-rule name
    },
  })),
];

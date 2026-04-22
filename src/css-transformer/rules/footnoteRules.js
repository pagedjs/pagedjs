import * as csstree from "css-tree";

export const footnoteDeclarationRules = [
  {
    match: ({ property, valueString }) =>
      property === "position" && /^\s*running\(/i.test(valueString),
    transform: ({ valueString }) => ({
      declarations: [
        { property: "--page-position", value: valueString.trim() },
        { property: "display", value: "none" },
      ],
    }),
  },
  {
    match: ({ property, valueString }) =>
      property === "float" && valueString.trim().toLowerCase() === "footnote",
    transform: () => ({
      declarations: [
        { property: "--float", value: "footnote" },
        { property: "display", value: "none" },
      ],
    }),
  },
  {
    match: ({ property }) => property === "footnote-display",
    transform: () => ({ property: "--footnote-display" }),
  },
  {
    match: ({ property }) => property === "footnote-policy",
    transform: () => ({ property: "--footnote-policy" }),
  },
];

export const footnotePseudoRules = [
  {
    match: (sel) => sel.includes("::footnote-call"),
    transform: (sel) =>
      sel.replace(/::footnote-call/g, "[data-footnote-call]::after"),
  },
  {
    match: (sel) => sel.includes("::footnote-marker"),
    transform: (sel) =>
      sel.replace(/::footnote-marker/g, "[data-footnote-marker]::marker"),
  },
];

export const footnoteAtRules = [
  {
    match: (node) => node.type === "Atrule" && node.name === "footnotes",
    transform: (node) => {
      node.type = "Rule";
      node.prelude = csstree.parse("& fragment-container::part(footnotes)", {
        context: "selectorList",
      });
      node.name = undefined;
    },
  },
];

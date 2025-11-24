import * as csstree from "css-tree";

export default [
  // content: element
  {
    // Match any Declaration node with property 'content'
    match: (n) => n.type === "Declaration" && n.property === "content",
    transform: (n) => {
      console.log(n);
      // Generate the string of the value
      const valueStr = csstree.generate(n.value).trim();

      // Match element("...") pattern
      const match = valueStr.match(/^element\(["'](.+?)["']\)$/);
      if (match) {
        const name = match[1].replace(/\s+/g, "_"); // sanitize name
        n.value = csstree.parse(`var(--element_${name})`, { context: "value" });
      }
    },
  },
];

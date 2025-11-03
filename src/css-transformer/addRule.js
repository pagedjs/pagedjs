export function addRule() {
  const newRule = {
    type: "Rule",
    prelude: csstree.parse(".paged-", { context: "selectorList" }),
    block: {
      type: "Block",
      children: new csstree.List().appendData({
        type: "Declaration",
        property: "color",
        value: csstree.parse("red", { context: "value" }),
      }),
    },
  };
  return newRule;
}

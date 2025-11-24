export function getCSSOMStringFromCSS(cssString) {
  const styleElement = document.createElement("style");
  styleElement.textContent = cssString;

  document.head.appendChild(styleElement);

  const sheet = styleElement.sheet;
  let result = "";

  if (sheet && sheet.cssRules) {
    for (let rule of sheet.cssRules) {
      result += rule.cssText + "\n";
    }
  }

  document.head.removeChild(styleElement);

  return result.trim();
}

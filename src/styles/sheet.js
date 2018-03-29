import StylesParser from './parser.js';

class Sheet {
  constructor(text) {
    this.original = text;
    this.text = this.parse(text);
    this.add(this.text);
  }

  parse(text) {
    let parser = new StylesParser(text);

    // Add root vars
    let rootVars = `:root {
      --width: ${parser.width};
      --height: ${parser.height};
    }`;
    this.add(rootVars);

    return parser.text;
  }

  add(text){
    let head = document.querySelector("head");
    let style = document.createElement("style");
    style.type = "text/css";

    style.appendChild(document.createTextNode(text));

    head.appendChild(style);
  }

}

export default Sheet;

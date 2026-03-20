@pagedjs/polisher
===========

CSS style processing and transformation engine for [Paged.js](https://pagedjs.org).

The Polisher parses CSS stylesheets and transforms `@page` rules, counters, generated content, and other paged media properties into classes and styles that can be applied to paginated HTML output.

## NPM Module
```sh
$ npm install @pagedjs/polisher
```

## Usage

```js
import Polisher from '@pagedjs/polisher';

let polisher = new Polisher();
polisher.setup();

await polisher.add("path/to/styles.css");
```

## Exports

### Polisher
The main class that manages stylesheet loading, parsing, and transformation.

```js
import Polisher from '@pagedjs/polisher';

let polisher = new Polisher();
polisher.setup();

// Add stylesheets by URL or inline CSS
await polisher.add("path/to/styles.css", { "inline": "body { margin: 0; }" });
```

### Sheet
Handles parsing and transformation of individual CSS stylesheets using `css-tree`.

```js
import Sheet from '@pagedjs/polisher/sheet';
```

### baseStyles
A string containing the default CSS base styles applied to all paged output.

```js
import baseStyles from '@pagedjs/polisher/base';
```

## Hooks

The Polisher exposes hooks that can be used by handler modules:

```js
beforeTreeParse(text, sheet)
beforeTreeWalk(ast)
afterTreeWalk(ast, sheet)
onUrl(urlNode)
onAtPage(atPageNode)
onAtMedia(atMediaNode)
onRule(ruleNode)
onDeclaration(declarationNode, ruleNode)
onContent(contentNode, declarationNode, ruleNode)
onSelector(selectorNode, ruleNode)
onPseudoSelector(pseudoNode, selectorNode, ruleNode)
onImport(importNode)
```

## License

MIT License (MIT)

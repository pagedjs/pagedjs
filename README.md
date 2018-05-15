Paged.js - Paged Media Tools
===========

## NPM Module
```sh
$ npm install pagedjs
```

```js
import { Previewer } from 'pagedjs';

let paged = new Previewer();
let flow = paged.preview(DOMContent, ["path/to/css/file.css"], document.body).then((flow) => {
	console.log("Rendered", flow.total, "pages.");
})
```

## Polyfill

Add the the `paged.polyfill.js` script to replace all `@page` css and render the html page with the Paged Media styles applied:

```html
<script src="https://s3.amazonaws.com/pagedmedia/pagedjs/dist/paged.polyfill.js"></script>
```

Test with Aurorae: [https://s3.amazonaws.com/pagedmedia/pagedjs/examples/aurorae/index.html](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/aurorae/index.html).

## Chunker
Chunks up a document into paged media flows and applies print classes.

Process the first 50 pages of Moby Dick: [https://s3.amazonaws.com/pagedmedia/pagedjs/examples/index.html](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/index.html).

Upload and chunk an Epub (using Epub.js): [https://s3.amazonaws.com/pagedmedia/pagedjs/examples/epub.html](https://s3.amazonaws.com/pagedmedia/examples/epub.html).

## Polisher
Converts `@page` css to classes, and applies counters and content.

Test styles for Aurorae: [https://s3.amazonaws.com/pagedmedia/pagedjs/examples/polisher.html](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/polisher.html).

### CLI

Command line interface to render out PDFs of HTML files using Puppeteer: [https://gitlab.pagedmedia.org/polyfills/pagedjs-cli](https://gitlab.pagedmedia.org/polyfills/pagedjs-cli).

## Modules

Modules are groups of handlers for that apply the layout and styles of a CSS module, such as Generated Content.

New handlers can be registered from `import { registerHandlers } from 'pagedjs'` or by calling `Paged.registerHandlers` on an html page.

```html
<script src="https://s3.amazonaws.com/pagedmedia/pagedjs/dist/paged.polyfill.js"></script>
<script>
	class myHandler() extends Paged.Handler {
		constructor(chunker, polisher, caller) {
			super(chunker, polisher, caller);
		}

		afterPageLayout(pageFragment, page) {
			console.log(pageFragment);
		}
	}
	Paged.registerHandlers(myHandler);
</script>
```

Handlers have methods that correspond to the hooks for the parsing, layout and rendering of the Chunker and Polisher. Returning an promise or `async` function from a method in a handler will complete that task before continuing with the other registered methods for that hook.

```js
// Chunker
afterParsed(parsed)
beforePageLayout(page)
afterPageLayout(pageElement, page, breakToken)
afterRendered(pages)

// Polisher
onUrl(urlNode)
onAtPage(atPageNode)
onRule(ruleNode)
onDeclaration(declarationNode, ruleNode)
onContent(contentNode, declarationNode, ruleNode)
```

## Setup
Install dependencies
```sh
$ npm install
```

## Development
Run the local dev-server with livereload and autocompile on [http://localhost:9090/](http://localhost:9090/)
```sh
$ npm start
```

## Deployment
Build the `dist` output
```sh
$ npm run prepare
```

## Testing

Testing for Paged.js uses [Jest](https://facebook.github.io/jest/en/) but is split into Tests and Specs.

### Tests

Unit tests for Chunker and Polisher methods are run in node using JSDOM.

```bash
npm run tests
```

### Specs

Specs run a html file in Chrome (using puppeteer) to test against CSS specifications.

They can also output a pdf and compare pages (one at a time) in that PDF with samples PDFs (saved as images).

To test the pdf output of specs, you'll need to install ghostscript locally.

```bash
brew install ghostscript
```

Then run the jest tests in puppeteer.

```bash
npm run specs
```

To debug the results of a test in a browser you can add `NODE_ENV=debug`

```bash
NODE_ENV=debug npm run specs
```

To update the stored pdf images you can run

```bash
npm run specs -- --updateSnapshot
```

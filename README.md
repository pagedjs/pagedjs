<img style="display: block; margin: 5em 0 auto;" src="https://www.pagedmedia.org/wp-content/uploads/2018/11/pagedjs.png" alt="Paged.js logo - pagination in the browser"/>

Paged.js - Paged Media Tools
===========

Paged.js is an open-source library to display paginated content in the browser and to generate print books using web technology.

It contains a set of handlers for CSS transformations and fragmented layout which polyfill the [Paged Media](https://www.w3.org/TR/css-page-3/) and [Generated Content](https://www.w3.org/TR/css-gcpm-3/) CSS modules, along with hooks to create new handlers for custom properties.

The currently supported properties can be found on [the wiki](https://gitlab.pagedmedia.org/tools/pagedjs/wikis/Support-of-specifications).

A quick overview to getting started with Paged Media CSS and Paged.js is available on [pagedmedia.org](https://www.pagedmedia.org/paged-js/).

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
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
```

Try the [polyfill with Aurorae](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/polyfill.html).

By default the polyfill will run automatically as soon as the DOM is ready.
However, you can add an async `before` function or return a Promise to delay the polyfill starting.

```html
<script>
	window.PagedConfig = {
		before: () => {
			return new Promise(resolve, reject) {
				setTimeout(() => { resolve() }, 1000);
			}
		},
		after: (flow) => { console.log("after", flow) },
	};
</script>
```

Otherwise you can disable `auto` running the previewer and call `window.PagedPolyfill.preview();`
whenever you want to start.

```html
<script>
	window.PagedConfig = {
		auto: false
		after: (flow) => { console.log("after", flow) },
	};

	setTimeout(() => {
		window.PagedPolyfill.preview();
	}, 1000);
</script>
```

## Chunker
Chunks up a document into paged media flows and applies print classes.

Examples:

* Process the [first 50 pages of Moby Dick](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/index.html).
* Upload and [chunk an Epub using Epub.js](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/epub.html).

## Polisher
Converts `@page` css to classes, and applies counters and content.

Examples:

* Test [styles for print](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/polisher.html).

### CLI

Command line interface to render out PDFs of HTML files using Puppeteer: [https://gitlab.pagedmedia.org/tools/pagedjs-cli](https://gitlab.pagedmedia.org/tools/pagedjs-cli).

## Modules

Modules are groups of handlers for that apply the layout and styles of a CSS module, such as Generated Content.

New handlers can be registered from `import { registerHandlers } from 'pagedjs'` or by calling `Paged.registerHandlers` on an html page.

```html
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
<script>
	class MyHandler extends Paged.Handler {
		constructor(chunker, polisher, caller) {
			super(chunker, polisher, caller);
		}

		afterPageLayout(pageFragment, page) {
			console.log(pageFragment);
		}
	}
	Paged.registerHandlers(MyHandler);
</script>
```

Handlers have methods that correspond to the hooks for the parsing, layout and rendering of the Chunker and Polisher. Returning an promise or `async` function from a method in a handler will complete that task before continuing with the other registered methods for that hook.

```js
// Previewer
beforePreview(content, renderTo)
afterPreview(pages)

// Chunker
beforeParsed(content)
filter(content)
afterParsed(parsed)
beforePageLayout(page)
afterPageLayout(pageElement, page, breakToken)
afterRendered(pages)

// Polisher
beforeTreeParse(text, sheet)
beforeTreeWalk(ast)
afterTreeWalk(ast, sheet)
onUrl(urlNode)
onAtPage(atPageNode)
onRule(ruleNode)
onDeclaration(declarationNode, ruleNode)
onContent(contentNode, declarationNode, ruleNode)

// Layout
layoutNode(node)
renderNode(node, sourceNode, layout)
onOverflow(overflow, rendered, bounds)
onBreakToken(breakToken, overflow, rendered)
afterOverflowRemoved(removed, rendered)
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
$ npm run build
```

Compile the `lib` output
```sh
$ npm run compile
```

Generate legacy builds with polyfills included
```sh
$ npm run legacy
```

## Testing

Testing for Paged.js uses [Jest](https://facebook.github.io/jest/en/) but is split into Tests and Specs.

### Tests

Unit tests for Chunker and Polisher methods are run in node using JSDOM.

```bash
npm test
```

### Specs

Specs run a html file in Chrome (using puppeteer) to test against CSS specifications.

They can also output a pdf and compare pages (one at a time) in that PDF with samples PDFs (saved as images).

The PDF comparison tests depend on the `ghostscript` and the `ghostscript4js` package.

To run them you'll need to install a local version of Ghostscript for you system according to https://www.npmjs.com/package/ghostscript4js#prerequisites

For Mac you can install it with

```bash
brew install ghostscript
```

For Debian you can install it with

```bash
sudo apt-get install ghostscript
sudo apt-get install libgs-dev
```

To test the pdf output of specs, you'll need to build the library locally.

```bash
npm run build
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

### Docker

A `pagedmedia/pagedjs` docker image contains all the dependencies needed to run the `pagedjs` development server, as well as the pdf comparison tests.

To build the image run

```bash
docker build -t pagedmedia/pagedjs .
```

By default the container will run the development server with `npm start`

```bash
docker run -it -p 9090:9090 pagedmedia/pagedjs
```

The tests and specs can be run within the container by passing a `seccomp` file for Chrome and running `npm test`

```bash
docker run -it --security-opt 'seccomp=seccomp.json' pagedmedia/pagedjs npm test
```

## Contributors

### Core team
The core team behind paged.js includes [Adam Hyde](https://adamhyde.net), [Julie Blanc](http://julie-blanc.fr/), [Fred Chasen](http://fchasen.com/) & Julien Taquet.

## Licence

MIT License (MIT), which you can read [here](https://gitlab.pagedmedia.org/tools/pagedjs/blob/master/LICENSE.md)

<img style="display: block; margin: 5em 0 auto;" src="assets/pagedjs.png" alt="Paged.js logo - pagination in the browser"/>

Paged.js - Paged Media Tools
===========

Paged.js is an open-source library to display paginated content in the browser and to generate print books using web technology.

It contains a set of handlers for CSS transformations and fragmented layout which polyfill the [Paged Media](https://www.w3.org/TR/css-page-3/) and [Generated Content](https://www.w3.org/TR/css-gcpm-3/) CSS modules, along with hooks to create new handlers for custom properties.

The currently supported properties can be found on [the pagedjs website](https://pagedjs.org/documentation/cheatsheet/).

A quick overview to getting started with Paged Media CSS and Paged.js is available on [pagedjs.org/documentation](https://pagedjs.org/documentation/).

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
			return new Promise((resolve, reject) => {
				setTimeout(() => { resolve() }, 1000);
			})
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
		auto: false,
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

Command line interface to render out PDFs of HTML files using Puppeteer: [https://github.com/pagedjs/pagedjs-cli](https://github.com/pagedjs/pagedjs-cli).

## Module

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

Handlers have methods that correspond to the hooks for the parsing, layout and rendering of the Chunker and Polisher. Returning a promise or `async` function from a method in a handler will complete that task before continuing with the other registered methods for that hook.

```js
// Previewer
beforePreview(content, renderTo)
afterPreview(pages)

// Chunker
beforeParsed(content)
filter(content)
afterParsed(parsed)
beforePageLayout(page)
onPageLayout(pageWrapper, breakToken, layout);
afterPageLayout(pageElement, page, breakToken)
finalizePage(pageElement, page, breakToken)
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
beforeRenderResult(breakToken, pageWrapper)
```

## How Pagedjs processes content

Chunker.flow()\
└── Chunker.render() -> Looping through all pages\
└──── Chunker.layout*() -> Handles overflowing pages, adding new ones\
└────── Page.layout() -> Creates new Layout and waits for new Breaktoken\
└──────── Layout.renderTo() -> Iterates through nodes\
└────────── Layout.findBreakToken() -> Tries to find overflow/breaktoken

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

Unit tests use Vitest and JSDOM:

```bash
npm test
```

### Specs

Browser specs use Playwright. This command builds the library and runs the specs:

```bash
npm run specs
```

PDF comparisons use `to-match-pdf-snapshot` and PDF.js. Snapshots are stored in
`test-results/pdf`; test artifacts are stored in `test-results/specs`.
Generate or refresh local snapshots with:

```bash
npm run specs -- --update-snapshots=all
```

Run behavioral checks without PDF comparisons with:

```bash
NODE_ENV=debug npm run specs
```

### Docker

The Docker image supplies the matching Playwright browsers, system dependencies,
and fonts. Dependencies are installed from the lockfile with `npm ci`.

```bash
npm run docker-build
npm run docker-test
npm run docker-specs
```

The specs commands mount `test-results` so generated snapshots and test artifacts
remain available on the host. Generate or refresh those snapshots with:

```bash
npm run docker-update-specs
```

To run the development server:

```bash
docker run --rm -p 9090:9090 pagedmedia/pagedjs
```

## License

MIT License (MIT), which you can read [here](https://github.com/pagedjs/pagedjs-cli?tab=MIT-1-ov-file)

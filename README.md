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

Try the showcase books in [pagedjs-examples](https://github.com/pagedjs/pagedjs-examples).

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

## Handlers

A feature is a `LayoutHandler` subclass. It carries the CSS rewrites it depends
on as `static rules`, and hooks into layout through the methods it overrides.
Append the class to `Fragmenter.handlers` before the first render — pagedjs's own
handlers are appended the same way, when the package is imported.

```html
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
<script>
	class Watermark extends Paged.LayoutHandler {
		static rules = [
			{
				type: "declaration",
				match: ({ property }) => property === "watermark",
				transform: () => ({ property: "--watermark" }),
			},
		];

		matchRule(rule) {
			const text = rule.style.getPropertyValue("--watermark").trim();
			if (text) this.text = text;
		}
	}

	Paged.Fragmenter.handlers.push(Watermark);
</script>
```

Appending a subclass of a handler already in the catalog replaces it in place,
taking over both its rules and its hooks:

```js
class MyFootnote extends Paged.Footnote {
	static rules = [...super.rules, myExtraRule];
}
Paged.Fragmenter.handlers.push(MyFootnote);
```

For a CSS rewrite with no layout behaviour behind it, pass rules to a single
previewer instead of registering a handler:

```js
new Paged.PagedPreview({ rules: [myRule] });
// or, for the polyfill: window.PagedConfig = { settings: { rules: [myRule] } };
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

Current-engine tests run in Chromium with [Playwright](https://playwright.dev).

### Tests

Behavior tests under `test/` load source modules directly through the browser
import map. Every test gets a fresh page and treats browser errors as failures.

```bash
npm test
```

### Specs

The supported handler and preview specs under `specs/` also import source
modules directly. They do not require a build first.

```bash
npm run specs
```

Use `PAGED_TEST_PORT` to override the behavior-test server port when running
multiple checkouts at once.

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

The tests and specs can be run within the container by running `npm test`

```bash
docker run -it pagedmedia/pagedjs npm test && npm run specs
```


## License

MIT License (MIT), which you can read [here](https://github.com/pagedjs/pagedjs-cli?tab=MIT-1-ov-file)

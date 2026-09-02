<img style="display: block; margin: 5em 0 auto;" src="assets/pagedjs.png" alt="Paged.js logo - pagination in the browser"/>

Paged.js - Paged Media Tools
===========

Paged.js is an open-source library to display paginated content in the browser and to generate print books using web technology.

It contains a set of handlers for CSS transformations and fragmented layout which polyfill the [Paged Media](https://www.w3.org/TR/css-page-3/) and [Generated Content](https://www.w3.org/TR/css-gcpm-3/) CSS modules, along with hooks to create new handlers for custom properties.

The property support matrix on [the pagedjs website](https://pagedjs.org/en/documentation/14-supported-feature-of-the-w3c-specifications/)
describes the released library. This branch has moved ahead of it — see
[src/handlers/README.md](src/handlers/README.md) for what the current engine implements.

A quick overview to getting started with Paged Media CSS and Paged.js is available on [pagedjs.org/en/documentation](https://pagedjs.org/en/documentation/).

## NPM Module
```sh
$ npm install pagedjs
```

```js
import { PagedPreview } from "pagedjs";

const preview = new PagedPreview();
const flow = await preview.preview(DOMContent, ["path/to/css/file.css"], document.body);
console.log("Rendered", preview.pages.length, "pages.");
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

## Components

A render produces custom elements rather than classed `<div>`s. `<paged-document>`
holds the flow; each page is a `<paged-page>` rendering a sheet with its bleed,
margins and page area, and exposing the sixteen CSS margin boxes of Paged Media
as parts — `::part(top-center)::before { content: string(title); }`. The page
pseudo-classes are custom states, so `@page :first` becomes
`paged-page:state(first)`.

## Generated content

Named strings, running elements, `target-text()`, `target-counter()`,
`target-counters()` and footnotes are documented in
[src/handlers/README.md](src/handlers/README.md), along with the hooks a
handler can implement, the layout-pass loop, the `--paged-` annotation contract,
and the current limitations.

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

The [handlers page on pagedjs.org](https://pagedjs.org/en/documentation/10-handlers-hooks-and-custom-javascript/)
still documents the previous API — `Paged.Handler`, `registerHandlers`, and the
`Chunker` / `Polisher` hooks. None of those exist here; use the form above.

For a CSS rewrite with no layout behaviour behind it, pass rules to a single
previewer instead of registering a handler:

```js
new Paged.PagedPreview({ rules: [myRule] });
// or, for the polyfill: window.PagedConfig = { settings: { rules: [myRule] } };
```

## How Paged.js processes content

```
PagedPreview.preview()
└── PrintStyleSheet.fromDocument() -> Collects the document's stylesheets
└──── CssTransformer.apply()      -> Rewrites paged-media CSS the browser would discard
└────── collectAllPageData()      -> Reads @page size, margins, bleed and marks
└──────── PageResolver            -> Picks the page size for each named page
└────────── Fragmenter            -> Yields one fragment per page
└──────────── PagedDocument.addPage() -> Renders each fragment as a <paged-page>
```

Fragmentation itself — measurement, break tokens, overflow — lives in the
[fragmentainers](https://www.npmjs.com/package/fragmentainers) package.

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
Build the `dist` output — the ES library (`dist/paged.js`) and the IIFE polyfill
(`dist/paged.polyfill.js`), in two passes
```sh
$ npm run build
```

## Testing

Current-engine tests run in Chromium with [Playwright](https://playwright.dev).

### Tests

Behavior tests under `test/` load source modules directly through the browser
import map. Every test gets a fresh page and treats browser errors as failures.

```bash
npm test
```

Use `PAGED_TEST_PORT` to override the behavior-test server port when running
multiple checkouts at once.

### Specs

The supported handler and preview specs under `specs/` also import source
modules directly. They do not require a build first.

```bash
npm run specs
```

### Lint

```bash
npm run lint
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

The tests and specs can be run within the container. `&&` has to be inside the
quoted command, or the second half runs on the host instead:

```bash
docker run -it pagedmedia/pagedjs sh -c "npm test && npm run specs"
```

There are wrapper scripts for the common cases, which build the image first:

```bash
npm run docker-test          # npm test in the container
npm run docker-specs         # npm run specs in the container
npm run docker-update-specs  # regenerate the PDF snapshots
```

PDF snapshots are authored in the container because `pdf-to-img` renders
differently across platforms.


## License

MIT License (MIT), which you can read [here](https://github.com/pagedjs/pagedjs-cli?tab=MIT-1-ov-file)

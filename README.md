Paged.js - Paged Media Tools
===========

## NPM Module
```sh
$ npm install pagedjs
```

```js
import { Chunker, Styler} from 'pagedjs';

let styles = new Styler();
let styleText = await styles.add("path/to/css/file.css");

let chunker = new Chunker(DOMContent, document.body, styles).then((flow) => {
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

## Styler
Converts `@page` css to classes, and applies counters and content.

Test styles for Aurorae: [https://s3.amazonaws.com/pagedmedia/pagedjs/examples/styler.html](https://s3.amazonaws.com/pagedmedia/examples/styler.html).

### CLI

Command line interface to render out PDFs of HTML files using Puppeteer: [https://gitlab.pagedmedia.org/polyfills/pagedjs-cli](https://gitlab.pagedmedia.org/polyfills/pagedjs-cli).

## Setup
Install dependencies
```sh
$ npm install
```

## Development
Run the local dev-server with livereload and autocompile on [http://localhost:8080/](http://localhost:8080/)
```sh
$ npm start
```

## Deployment
Build the `dist` output
```sh
$ npm run prepare
```

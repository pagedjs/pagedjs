@pagedjs/chunker
===========

Page chunking and fragmented layout engine for [Paged.js](https://pagedjs.org).

The Chunker takes a DOM document and splits it into discrete pages, handling content overflow, page breaks, and element fragmentation according to the CSS Paged Media specification.

## NPM Module
```sh
$ npm install @pagedjs/chunker
```

## Usage

```js
import Chunker from '@pagedjs/chunker';

let chunker = new Chunker(content, renderTo);
let flow = await chunker.flow(content, renderTo);
console.log("Rendered", flow.total, "pages.");
```

## Exports

### Chunker
The main class that orchestrates document pagination. It parses content, creates pages, and manages the layout flow.

```js
import Chunker from '@pagedjs/chunker';

let chunker = new Chunker(content, renderTo, settings);

chunker.on("page", (page) => {
    console.log("Page rendered:", page);
});

chunker.on("rendering", () => {
    console.log("Rendering in progress...");
});

let flow = await chunker.flow(content, renderTo);
```

### Layout
Handles the layout of content within a single page, including overflow detection and content splitting.

```js
import { Layout } from '@pagedjs/chunker/layout';
```

### Page
Represents a single rendered page with its associated DOM elements and area references.

```js
import { Page } from '@pagedjs/chunker/page';
```

### ContentParser
Parses source content into a format suitable for fragmented rendering.

```js
import { ContentParser } from '@pagedjs/chunker/parser';
```

### BreakToken
Tracks where content was split between pages, enabling continuation on the next page.

```js
import { BreakToken } from '@pagedjs/chunker/breaktoken';
```

### RenderResult
Tracks the outcome of rendering content into a page, including overflow information.

```js
import { RenderResult } from '@pagedjs/chunker/renderresult';
```

## Hooks

The Chunker exposes hooks that can be used by handler modules:

```js
beforeParsed(content)
filter(content)
afterParsed(parsed)
beforePageLayout(page)
afterPageLayout(pageElement, page, breakToken)
afterRendered(pages)
```

## License

MIT License (MIT)

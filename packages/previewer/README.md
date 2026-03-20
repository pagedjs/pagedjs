@pagedjs/previewer
===========

Preview interface and handler modules for [Paged.js](https://pagedjs.org).

This package provides the `Previewer` class that orchestrates the full Paged.js pipeline (style processing, handler initialization, and page chunking), along with the `Handler` base class for creating custom handler modules.

## NPM Module
```sh
$ npm install @pagedjs/previewer
```

## Previewer

The `Previewer` class provides a high-level API for rendering paginated content:

```js
import { Previewer } from '@pagedjs/previewer';

let paged = new Previewer();
let flow = await paged.preview(DOMContent, ["path/to/css/file.css"], document.body);
console.log("Rendered", flow.total, "pages.");
```

### Events

```js
paged.on("page", (page) => {
    console.log("Page rendered");
});

paged.on("rendering", (chunker) => {
    console.log("Rendering in progress...");
});

paged.on("rendered", (flow) => {
    console.log("All pages rendered:", flow.total);
});

paged.on("size", (size) => {
    console.log("Page size:", size);
});
```

## Handler Registration

Custom handlers can be registered to extend the previewer:

```js
import { registerHandlers, Handler } from '@pagedjs/previewer';

class MyHandler extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
    }

    afterPageLayout(pageFragment, page) {
        console.log(pageFragment);
    }
}

registerHandlers(MyHandler);
```

## Built-in Handler Modules

The previewer includes three sets of built-in handlers in its `modules/` directory:

- **paged-media** — Implements CSS Paged Media features including `@page` size, page breaks (`break-before`, `break-after`, `break-inside`), `nth` page selectors, and named pages.
- **generated-content** — Handles CSS Generated Content for paged media including running headers/footers, `target-counter`, `target-text`, `string-set`, and `content()` functions.
- **filters** — Post-processing filters applied to pages after layout, such as widow/orphan handling and whitespace cleanup.

## Exports

### Previewer
The main preview class that coordinates style processing, handler initialization, and content chunking.

### Handler
Base class for creating custom handler modules. Handlers hook into the Chunker, Polisher, and Previewer lifecycle by defining methods that match hook names.

### registerHandlers
Registers additional handler classes to be initialized during preview.

### initializeHandlers
Creates and initializes all registered handler instances for a given chunker, polisher, and caller.

## Previewer Hooks

```js
beforePreview(content, renderTo)
afterPreview(pages)
```

## License

MIT License (MIT)

@pagedjs/utils
===========

Shared utility modules for [Paged.js](https://pagedjs.org).

This package provides the foundational utilities used across the Paged.js monorepo, including DOM manipulation helpers, CSS processing tools, a hook/plugin system, and an async task queue.

## NPM Module
```sh
$ npm install @pagedjs/utils
```

## Exports

### Hook
An extensible hook system for registering and triggering plugin callbacks.

```js
import { Hook } from '@pagedjs/utils';

let hook = new Hook(context);
hook.register(callback);
await hook.trigger(arg1, arg2);
```

### Queue
An async task queue for handling operations one at a time.

```js
import { Queue } from '@pagedjs/utils';

let queue = new Queue();
await queue.enqueue(() => someAsyncWork());
```

### DOM Utilities
Helpers for walking, cloning, and inspecting DOM trees used during page fragmentation.

```js
import { walk, cloneNode, isElement, isText, findElement, nodeAfter } from '@pagedjs/utils';
```

### CSS Utilities
Functions for cleaning and processing CSS selectors and pseudo-content.

```js
import { cleanPseudoContent, cleanSelector } from '@pagedjs/utils';
```

### General Utilities
Common helpers including UUID generation, bounding rect access, and idle callback scheduling.

```js
import { UUID, getBoundingClientRect, requestIdleCallback } from '@pagedjs/utils';
```

### Page Sizes
A map of standard page size names to their dimensions.

```js
import { sizes } from '@pagedjs/utils';

console.log(sizes["A4"]); // { width: { value: 210, unit: "mm" }, height: { value: 297, unit: "mm" } }
```

### Subpath Imports
Individual modules can also be imported directly:

```js
import Hook from '@pagedjs/utils/hook';
import Queue from '@pagedjs/utils/queue';
import { UUID } from '@pagedjs/utils/utils';
import { walk, cloneNode } from '@pagedjs/utils/dom';
import { cleanSelector } from '@pagedjs/utils/css';
import request from '@pagedjs/utils/request';
import pageSizes from '@pagedjs/utils/sizes';
```

## License

MIT License (MIT)

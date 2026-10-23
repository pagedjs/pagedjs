# PagedDocument

The `<paged-document>` component contains `<paged-page>` elements in document
order. It sets a zero-based `index` attribute on every element assigned to its
default slot. It also sets `--paged-page-count`, which initializes the `pages`
CSS counter.

## Adding pages

Import `PagedDocument` from the components entry point and use `addPage()` to
create a page:

```html
<script type="module">
  import { PagedDocument } from "pagedjs/components.js";

  const documentElement = new PagedDocument();
  document.body.append(documentElement);
  documentElement.addPage(document.createTextNode("First page"), {
    first: true,
    recto: true,
  });
</script>
```

The first argument can be any DOM node. The second argument can set the page's
`name`, `blank`, `verso` (left), `recto` (right), and `first` properties.

## Adding pages in HTML

Pages can also be assigned directly to the default slot:

```html
<paged-document>
  <paged-page>First page</paged-page>
  <paged-page>Second page</paged-page>
</paged-document>
```

The `pages` getter returns assigned elements in document order. It does not
filter them by tag name and returns an empty array before the first render.
Native DOM insertions, removals, reordering, and slot reassignment update the
indexes. Appending pages indexes only the new suffix.

Await `updateComplete` to wait for the document and its assigned pages to finish
their Lit updates.

## Inserting several pages

Append a `DocumentFragment` to insert several pages together:

```js
const batch = document.createDocumentFragment();
batch.append(firstPage, secondPage);
documentElement.append(batch);
```

`totalPages` optionally supplies the total used by the `pages` CSS counter
while only part of a document is inserted. Set it before insertion when the
final total is known. Its default, `null`, counts assigned elements automatically;
setting it back to `null` resumes automatic counting. Explicit totals must be
nonnegative integers. The `pages` getter always reports the elements currently
assigned, regardless of the explicit total.

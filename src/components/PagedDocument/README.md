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
filter them by tag name. The document updates their indexes when the slot
changes.

Await `updateComplete` to wait for the document and its assigned pages to finish
their Lit updates.

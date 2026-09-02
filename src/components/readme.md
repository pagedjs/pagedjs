# Components

Paged.js renders into custom elements rather than classed `<div>`s. All three
are Lit-based and define themselves on import.

| Element | Documentation |
| --- | --- |
| `<paged-document>` | [PagedDocument/Readme.md](PagedDocument/Readme.md) |
| `<paged-page>` | [PagedPage/PagedPaged.md](PagedPage/PagedPaged.md) |
| `<paged-margins>`, `<paged-margin-box>`, `<paged-margin-content>` | [PagedMargins/PagedMargins.md](PagedMargins/PagedMargins.md) |

They nest in that order: a document holds pages, and each page renders a sheet
with its bleed, margins and page area, with a `<paged-margins>` supplying the
sixteen page-margin boxes of
[CSS Paged Media 3 §5](https://www.w3.org/TR/css-page-3/#margin-boxes).

```html
<paged-document>
    <paged-page name="cover" bleed="3mm" marks="crop cross">
        <span slot="top-center">Chapter title</span>
        <p>Page content.</p>
    </paged-page>
</paged-document>
```

## Rendering is asynchronous

Each element updates on its own schedule, so a page's margin boxes do not exist
the moment it is appended. Every level folds the level below it into its
`updateComplete`, so awaiting the outermost element you care about is enough:

```js
await document.querySelector("paged-document").updateComplete;
// every page, its margins, and its margin-box content have now rendered
```

Reading `marginBox()`, `slottedNodes`, or a computed custom property before that
resolves gives a null or an empty value, not a stale one.

## Styling from the author document

Page geometry and margin-box content reach the components through the cascade,
not through attributes: the stylesheet build turns the document's `@page` rules
into `--paged-*` custom properties and `paged-page` selectors. Margin-box
content is addressable two ways — `::part(top-center)::before { content: … }`,
which matches the spec, or the named slots above, which go beyond it.

Setting the attributes directly is what a `<paged-page>` used on its own does
instead. A page with no `--paged-marks` in its cascade falls back to its `marks`
and `bleed` properties as the rendering source.

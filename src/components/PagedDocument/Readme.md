# PagedDocument

element that will control the state of the fragmentation, and will manage
the page management, kicking off fragmentation and CSS parsing when passed content.

The `paged-document` gathers `paged-pages`. And provides an API to add them.

- addPage
- removePage
- replacePage
- getPage

## 

Provide preview on screen. Probably more of a thing for a CSS?

## 

Should `paged-document` also plug in to or facilitate imposition workflows? e.g. allow to shuffle them? Alternative approaches would be:
- use CSS Grid to move them around;
- retrieve the 'flown' pages with the `getPage`-method and for the user to construct new structure themselves.


and will manage the page management, kicking off fragmentation and CSS parsing when passed content

### Content is fed to <paged-document> through a slot

The component is used as an entry-point to feed content to paged.js.
It raises the question on how the paged result is accessed.
Through a property?

```html
<paged-document>
    Content to be paged.
</paged-document>
```

### <paged-document> is a wrapper for the generated pages

The component wraps around the pages. In this scenario the component does
not have a lot of responsibility. Could have a some convenience functions
to add, access or remove pages.

- How is the prototype of the page set. Through a slot?

```html
<paged-document>
    <paged-page>
        Fragment of content
    </paged-page>
    <paged-page>
        Other fragment of content
    </paged-page>
</paged-document>
```

### Combination of both

The component has two slots. One for the content. One for the generated pages.

```html
<paged-document>
    <slot name="content"></slot>
    <slot name="pages"></slot>
</paged-document>
```

Concept of 'managed' pages; pages are either inserted by the user, or they are managed by paged.js,
where the library chunks the content and flows it automatically.

---

Link paged.js to a PagedDocument.

Add Page.

Flow content.


---

Paged.js constructs a PagedDocument element and adds pages to it.
Insert content to the pages.


----

### How to deal with pagenumbers

`pagedPage` component has the `index` attribute to set page numbers. 

- Do `pagedPage`-elements without a value for `index` which are assigned to a `pagedDocument` receive one from the component automatically?

- How is index consistency ensured if pages are taken out?

First naive implementation is to set an index in the addPage() method:

```javascript
addPage () {
  let newPage = document.createElement('paged-page');
  newPage.setAttribute('index', this.pages.length);
  this.appendChild(newPage);
}
```

Downside of this is that pages which are already set through the DOM do not
receive an index. Not clear what the event cycle is when pages are added or
removed.

Alternative is to have a callback which treats all pages. Can be executed 
on initialization an relevant events


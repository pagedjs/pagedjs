
# PagedPage

The **`paged-page`** component represents a printable page with full CSS-controlled geometry, dynamic `@page` sizing, bleed, page-marks, and integrated margin-box rendering via `<paged-margins>`.  
It is designed to work seamlessly with `<paged-margins>` but can also be used by itself.

Each page instance auto-generates a unique `@page <name>` rule so that print and preview rendering stay synchronized.

- - -

## Usage

A `<paged-page>` represents a single page:

```html
<paged-page>
    <p>Your page content goes here.</p>
</paged-page>
```

### Page sizing

```html
<paged-page width="148mm" height="210mm" bleed="3mm">
    <p>A5 page with bleed.</p>
</paged-page>
```

### Custom page name

```html
<paged-page name="cover">
    <h1>Cover Page</h1>
</paged-page>
```

CSS can target the page by name:

```css
@page cover {
    size: 210mm 297mm;
    margin: 0;
}
```

### Custom margins

Override the default `<paged-margins>` by providing your own:

```html
<paged-page>
    <paged-margins slot="margins">
        <paged-margin-content slot="top-center">Header</paged-margin-content>
    </paged-margins>
</paged-page>
```

### Margin box content without a custom margins element

Content can be assigned to a page-margin box directly on the page, using the
slot of that name. It reaches the default `<paged-margins>` the same way it
reaches a custom one:

```html
<paged-page>
    <span slot="top-center">Chapter title</span>
</paged-page>
```

The CSS route is `::part()`, and matches the spec:

```css
paged-page::part(top-center)::before {
    content: string(title);
}
```

### Page marks (crop & cross)

Marks only render when bleed > 0:

```html
<paged-page bleed="3mm" marks="crop cross">
    <p>Printing with crop &amp; cross marks.</p>
</paged-page>
```

- - -

## Page Layout Diagram

Below is an SVG illustrating how `<paged-page>` constructs its layout:  
**Bleed → Margin → Page-Area**

<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">
  <!-- Bleed area -->
  <rect x="20" y="20" width="560" height="800" fill="#ffe6e6" stroke="#cc0000" stroke-width="2"/>
  <text x="300" y="45" text-anchor="middle" font-size="14" fill="#cc0000">Bleed Area</text>

  <!-- Margin area -->
  <rect x="60" y="60" width="480" height="720" fill="#e6f0ff" stroke="#0052cc" stroke-width="2"/>
  <text x="300" y="85" text-anchor="middle" font-size="14" fill="#0052cc">Margin Area</text>

  <!-- Page area -->
  <rect x="100" y="100" width="400" height="640" fill="#eaffea" stroke="#009933" stroke-width="2"/>
  <text x="300" y="125" text-anchor="middle" font-size="14" fill="#009933">Page Area (content)</text>

  <!-- Labels -->
  <text x="300" y="810" text-anchor="middle" font-size="16" fill="#333">paged-page layout: bleed → margins → page-area</text>
</svg>

- - -

## API

### PagedPage `<paged-page>`

- - -

### Properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| name | name | string | auto-generated | Name used in `@page` rule; reflected. |
| index | index | number \| null | null | Optional index for multi-page systems. |
| width | width | string \| null | null | Page width for self-configuration. |
| height | height | string \| null | null | Page height for self-configuration. |
| bleed | bleed | string | `"0mm"` | Bleed around the page. |
| margin | margin | string | `""` | Shorthand margin value (`"20mm 10mm"` etc). |
| marks | marks | string | `""` | `"crop"` and/or `"cross"`. |

- - -

### Methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| marginBox | `name` | `Element \| null` | The `<paged-margin-box>` for one page-margin box. Null until the margins element has rendered. |
| setMarginContent | `name`, `node` | —   | Place a node in a page-margin box, replacing whatever it held. Throws when `name` is not a margin box. |
| clearMarginContent | `name` | —   | Empty one page-margin box. Throws when `name` is not a margin box. |
| getUpdateComplete | —   | `Promise<boolean>` | Awaited by `updateComplete`. Resolves once the page, its `<paged-margins>`, and any running elements it places have all settled. |

`name` is one of the sixteen page-margin box names, exported as `MARGIN_BOXES`.

- - -

### Getters

| Getter | Type | Description |
| --- | --- | --- |
| pageArea | `Element \| null` | The page-area element inside the shadow root, the grid region the default slot renders into. |
| contentArea | `Element \| null` | The `<fragment-container>` slotted into the page. |
| footnotesArea | `Element \| null` | The footnote area within the content area, when one was composed. |
| marginsArea | `Element \| null` | The `<paged-margins>` in effect — the slotted one, or the default the slot falls back to. |

- - -

### Slots

| Slot | Type | Default | Description |
| --- | --- | --- | --- |
| _(default)_ | Element | —   | Main page content, placed inside the page-area. |
| margins | Element | `<paged-margins>` | Provides custom margins; replaces default margins. |
| _sixteen named slots_ | Element | —   | One per page-margin box — `top-left-corner`, `top-left`, `top-center`, `top-right`, `top-right-corner`, `left-top`, `left-middle`, `left-bottom`, `right-top`, `right-middle`, `right-bottom`, `bottom-left-corner`, `bottom-left`, `bottom-center`, `bottom-right`, `bottom-right-corner`. Forwarded to `<paged-margins>`, so content assigned here survives the margins element being replaced. |

- - -

### Parts

| Part | Description |
| --- | --- |
| page-area | The main printable content region inside margins. |

_Additional parts come from the forwarded `<paged-margins>` element._

- - -

### Custom CSS Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| \--paged-width | length | 8.5in | Internal page width including bleed. |
| \--paged-height | length | 11in | Internal page height including bleed. |
| \--paged-bleed | length | 0mm | Bleed area around the page. |
| \--paged-margin-top | length | Implementation default | Size of the top margin. |
| \--paged-margin-right | length | Implementation default | Size of the right margin. |
| \--paged-margin-bottom | length | Implementation default | Size of the bottom margin. |
| \--paged-margin-left | length | Implementation default | Size of the left margin. |
| \--paged-marks | keywords | —   | `crop` and/or `cross`; overrides the `marks` property when set. |
| \--paged-page-orientation | keyword | —   | `rotate-left`, `rotate-right` or `upright`. |
| \--paged-page | integer | —   | The page number the engine assigned, fed to the `page` counter. |
| \--paged-mark-color | color | `black` | Colour of the crop and cross marks. |

When no valid `margin` attribute is provided, all margins default to **1in**.

`--paged-width`, `--paged-height`, `--paged-bleed`, the four margins,
`--paged-marks` and `--paged-page-orientation` are normally written by the
stylesheet build from the document's `@page` rules; setting them by hand is what
a directly configured `<paged-page>` does instead of using the attributes.

- - -

## Behavior

### Automatic `@page` rule injection

Each `<paged-page>` instance installs its own rule into its shadow root:

```css
@page <name> { size: … }
```

This ensures print dimensions match the element's rendered size.

### Page counter

The host carries `counter-increment: page` together with
`counter-set: page var(--paged-page)`. When the engine supplies a page number
the `counter-set` wins; with `--paged-page` unset the declaration is invalid at
computed-value time and computes to `none`, leaving the increment to number a
standalone page. So `counter(page)` works both inside a flow and on a page used
on its own.

### Print marks

Marks render only when the bleed is non-zero — that is, when at least one
component of the bleed value is something other than zero, so `0`, `0mm` and
`0mm 0mm` all count as no bleed:

*   `cross` creates registration cross marks
*   `crop` draws crop lines around the bleed box

Both read `--paged-marks` when it is set, and the `marks` property otherwise.

### Running elements

When a page-margin box asks for a running element through
`--paged-running-element: <name> <mode>`, the page clones the selected element
into that box's slot. Selection is re-read on every update, because the request
is cascaded — a rule such as `@page :first` only wins once the page's states are
set. A box the page did not fill itself is never cleared, so content placed
through `setMarginContent` survives.

- - -

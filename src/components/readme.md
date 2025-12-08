# Paged-page
A webcomponent to preview on screen the result of your CSS Print
Absolutely — here is the complete **Markdown version** (no commentary, ready to paste into a README), **including an SVG diagram** of the page grid with bleed, margins, and the page-area.

---

# PagedPage

The **`paged-page`** component represents a printable page with full CSS-controlled geometry, dynamic `@page` sizing, bleed, page-marks, and integrated margin-box rendering via `<paged-margins>`.  
It is designed to work seamlessly with `<paged-margins>` but can also be used by itself.

Each page instance auto-generates a unique `@page <name>` rule so that print and preview rendering stay synchronized.

---

## Usage

A `<paged-page>` represents a single page:

```html
<paged-page> 
    <p>Your page content goes here.</p>
</paged-page>`
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
</paged-page>````

CSS can target the page by name:

```css
@page cover {   size: 210mm 297mm;   margin: 0; }`
```

### Custom margins

Override the default `<paged-margins>` by providing your own:


```html
`<paged-page>
    <paged-margins slot="margins">
        <paged-margin-content slot="top-center">Header</paged-margin-content>   
    </paged-margins> 
</paged-page>`
```

### Page marks (crop & cross)

Marks only render when bleed > 0 and marks are crop and/or cross:

```html
<paged-page bleed="3mm" marks="crop cross">   
    <p>Printing with crop & cross marks.</p> 
</paged-page>
```

---

## Page Layout Diagram

Below is an SVG illustrating how `<paged-page>` constructs its layout:  
**Bleed → Margin → Page-Area**

`![](data:image/svg+xml;utf8,%3Csvg%20width%3D%22600%22%20height%3D%22840%22%20viewBox%3D%220%200%20600%20840%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3C!--%20Bleed%20area%20--%3E%0A%20%20%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%22560%22%20height%3D%22800%22%20fill%3D%22%23ffe6e6%22%20stroke%3D%22%23cc0000%22%20stroke-width%3D%222%22%3E%3C%2Frect%3E%0A%20%20%3Ctext%20x%3D%22300%22%20y%3D%2245%22%20text-anchor%3D%22middle%22%20font-size%3D%2214%22%20fill%3D%22%23cc0000%22%3EBleed%20Area%3C%2Ftext%3E%0A%0A%20%20%3C!--%20Margin%20area%20--%3E%0A%20%20%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22480%22%20height%3D%22720%22%20fill%3D%22%23e6f0ff%22%20stroke%3D%22%230052cc%22%20stroke-width%3D%222%22%3E%3C%2Frect%3E%0A%20%20%3Ctext%20x%3D%22300%22%20y%3D%2285%22%20text-anchor%3D%22middle%22%20font-size%3D%2214%22%20fill%3D%22%230052cc%22%3EMargin%20Area%3C%2Ftext%3E%0A%0A%20%20%3C!--%20Page%20area%20--%3E%0A%20%20%3Crect%20x%3D%22100%22%20y%3D%22100%22%20width%3D%22400%22%20height%3D%22640%22%20fill%3D%22%23eaffea%22%20stroke%3D%22%23009933%22%20stroke-width%3D%222%22%3E%3C%2Frect%3E%0A%20%20%3Ctext%20x%3D%22300%22%20y%3D%22125%22%20text-anchor%3D%22middle%22%20font-size%3D%2214%22%20fill%3D%22%23009933%22%3EPage%20Area%20(content)%3C%2Ftext%3E%0A%0A%20%20%3C!--%20Labels%20--%3E%0A%20%20%3Ctext%20x%3D%22300%22%20y%3D%22810%22%20text-anchor%3D%22middle%22%20font-size%3D%2216%22%20fill%3D%22%23333%22%3Epaged-page%20layout%3A%20bleed%20%E2%86%92%20margins%20%E2%86%92%20page-area%3C%2Ftext%3E%0A%3C%2Fsvg%3E%0A)`

---

## API

### PagedPage `<paged-page>`

---

### Properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| name | name | string | auto-generated | Name used in `@page` rule; reflected. |
| index | index | number | null | null | Optional index for multi-page systems. |
| width | width | string | `"210mm"` | Page width. |
| height | height | string | `"297mm"` | Page height. |
| bleed | bleed | string | `"0mm"` | Bleed around the page. |
| margin | margin | string | `""` | Shorthand margin value (`"20mm 10mm"` etc). |
| marks | marks | string | `""` | `"crop"` and/or `"cross"`. |

---

### Methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| _(none public)_ | — | — | No public API methods. Internal routines inject `@page` rules and print setup. |

---

### Slots

| Slot | Type | Default | Description |
| --- | --- | --- | --- |
| _(default)_ | Element | — | Main page content, placed inside the page-area. |
| margins | Element | `<paged-margins>` | Provides custom margins; replaces default margins. |

---

### Parts

| Part | Description |
| --- | --- |
| page-area | The main printable content region inside margins. |

_Additional parts come from the forwarded `<paged-margins>` element._

---

### Custom CSS Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| \--paged-width | length | 210mm | Internal page width including bleed. |
| \--paged-height | length | 297mm | Internal page height including bleed. |
| \--paged-bleed | length | 0mm | Bleed area around the page. |
| \--paged-margin-top | length | Implementation default | Size of the top margin. |
| \--paged-margin-right | length | Implementation default | Size of the right margin. |
| \--paged-margin-bottom | length | Implementation default | Size of the bottom margin. |
| \--paged-margin-left | length | Implementation default | Size of the left margin. |

When no valid `margin` attribute is provided, all margins default to **1in**.

---

## Behavior

### Automatic `@page` rule injection

Each `<paged-page>` instance installs its own:

```css
page <name> { size: … }`
```

This ensures print dimensions match the element’s rendered size.

### Global print cleanup

The component injects the following once:

```css
@media print {   body {     margin: 0 !important;     padding: 0 !important;   } }
```

### Print marks

When and marks are needed `bleed != "0mm"`:

-   `"cross"` creates registration cross marks
-   `"crop"` draws crop lines around the bleed box

---


# PagedMargins

The PagedMargins components facilitates rendering page-margin boxes as defined in the [W3C Paged Media Module](https://www.w3.org/TR/css-page-3/#margin-boxes). The components aim to cover the standard, and support some functionality beyond the standard.

## Usage

The paged-margins component renders the page-margin boxes. It is intended to be
used with a paged-page component. But can also be used by itself:

```html
<paged-margins></paged-margins>
```


### Assigning content

The paged-margins component renders a series of page-margin boxes. Content can be assigned through CSS, as defined in the standard, or the DOM, beyond the standard. 

#### CSS

Content can be assigned with CSS through a combination of a `::part`-selector
which targets the relevant `<margin-box>` and a `::before` or `::after` pseudo-selector
which create a pseudo-element.

This snippet will render a `<paged-margins>` with the text 'Hello, world!' printed
at the top center.

Note: the `<paged-margins>` doesn't have an inherent size, much a like a `<div>`. The component is expected to be used in contexts where it either receives geometry from its parent or it being set with CSS, like in the example code:

```html
<style>
paged-margins {
  width: 210mm;
  height: 297mm;
}

paged-margins::part(top-center)::before {
  content: "Hello, world!";
}
</style>

<paged-margins></paged-margins>
```

#### DOM

Content can also be assigned directly in the DOM by inserting elements into the provided slots. The `<paged-margin-content>` component is the most transparent way to insert plain text. But arbitrary elements can be assigned to the slots.

This snippet will render a paged-margin box with the text 'Hello, world!' printed at the top center. It uses the `<paged-margin-content>` component and targets the margin-box with the `slot`-attribute.

```html
<style>
paged-margins {
  width: 210mm;
  height: 297mm;
}
</style>

<paged-margins>
  <paged-margin-content slot="top-center">Hello, world!</paged-margin-content>
</paged-margins>
```

It is possible to assign any HTML-element to a marginbox using the slot attribute. This snippet will render a h1 element at the top center of the page.

```html
<style>
paged-margins {
  width: 210mm;
  height: 297mm;
}
</style>

<paged-margins>
  <h1 slot="top-center">Hello, world!</h1>
</paged-margins>
```

### Setting the margin size

The paged-margins component has default margins of 15mm. The margin-sizes can be influenced through four custom css properties: `--paged-margin-top`, `--paged-margin-right`, `--paged-margin-bottom` & `--paged-margin-left`.

```html
<style>
paged-margins {
  width: 210mm;
  height: 297mm;

  --paged-margin-top: 30mm;
  --paged-margin-right: 10mm;
  --paged-margin-bottom: 10mm;
  --paged-margin-left: 10mm;
}
</style>

<paged-margins>
  <paged-margin-content slot="top-center">Hello, world!</paged-margin-content>
</paged-margins>
```


### Styling the page-margin boxes

The `paged-margins` component exposes a set of parts to style and set content on the margin-boxes. The parts for the individual page-margin boxes follow the naming scheme of the paged media spec.

The following sample changes the font-style and background for the bottom-center page-margin box:

```html
<style>
  paged-margins {
    width: 210mm;
    height: 297mm;
  }

  paged-margins::part(bottom-center) {
    color: white;
    background: black;
    font-weight: bold;
  }
</style>

<paged-margins></paged-margins>
```

### Adjusting dimensions of variable size page-margin boxes

As defined in the W3C specification the width and height of the corner page-margin boxes is fixed and defined by the margin size. The space in between the corners is divided into three boxes which have either a variable width on the top and bottom of the page, or a variable height on the left and right side of the page. The page-margin component wraps these boxes in a margin-box-group and uses a grid to control the dimensions of the boxes in the group.

The component exposes five parts to select either all, or an individual group allowing to change the grid and thus the size of the boxes. 

| Part | Description |
| ---- | ----------- |
| margin-box-group | all the page-margin box groups |
| margin-box-group-top | top page-margin box group: top-left, top-center & top-right |
| margin-box-group-right | right page-margin box group: right-top, right-middle & right-bottom |
| margin-box-group-bottom | bottom page-margin box group: bottom-left, bottom-center & bottom-right |
| margin-box-group-left | left page-margin box group: left-top, left-middle & left-bottom |

The following sample adjusts the grid of the margin-box-group-top to make the top-center page-margin box occupy the full width between the corner boxes.

```html
<style>
  paged-margins {
    width: 210mm;
    height: 297mm;
  }

  paged-margins::part(margin-box-group-top) {
    grid-template-columns: 0 1fr 0;
  }
</style>

<paged-margins></paged-margins>
```

### Special parts (groups)

In addition to the individual boxes the component also offers parts to target all the page-margin boxes or a side of the sheet. The corner boxes are always part of two sides, example, the top-left-corner box will be targeted by both the `left` as well as the `top`-part. 

| Part | Description |
| ---- | ----------- |
| margin-box | all the page-margin boxes |
| top | all page-margin boxes on the top side of the page, including top left corner and top right corner |
| right | all page-margin boxes on the right side of the page, including top right and bottom right corner. |
| bottom | all page-margin boxes on the bottom side of the page, including bottom left corner and bottom right corner. |
| left | all page-margin boxes on the left side of the page, including top left corner and bottom left corner |

The sample below uses the `margin-box` part to set the background of all page-margin boxes while it uses the part `left` to set the color of the page-margin boxes on the left side of the page.

```html

<style>
paged-margins {
  width: 210mm;
  height: 297mm;

  --paged-margin-top: 30mm;
  --paged-margin-right: 10mm;
  --paged-margin-left: 10mm;
  --paged-margin-bottom: 10mm;
}

paged-margins::part(margin-box) {
  background: grey;
}

paged-margins::part(left) {
  background: red;
}
</style>

<paged-margins></paged-margins>

```

Note: the parts are not meant to be used to set the margin sizes (or the block size of the page-margin boxes), this might lead to unexpected results.


## API

### PagedMargins `<paged-margins>`

#### properties

| Property | Attribute | Type | Default | Description |
| -------- | --------- | ---- | ------- | ----------- |
| marginBoxes | | { str: MarginBox \| null} \| null | | Returns a dictionary with the MarginBoxes or null. Keys are the names of the page-margin boxes. |


#### Methods

| Method | parameters | Returns | Description |
| ------ | ---------- | ------- | ----------- |


#### Slots

| Slot | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| top-left-corner | Element | `<empty>` | top left corner page-margin box |
| top-left | Element | `<empty>` | top left page-margin box |
| top-center | Element | `<empty>` | top center page-margin box |
| top-right | Element | `<empty>` | top right page-margin box |
| top-right-corner | Element | `<empty>` | top right corner page-margin box |
| left-top | Element | `<empty>` | left top page-margin box |
| left-middle | Element | `<empty>` | left middle page-margin box |
| left-bottom | Element | `<empty>` | left bottom page-margin box |
| right-top | Element | `<empty>` | right top page-margin box |
| right-middle | Element | `<empty>` | right middle page-margin box |
| right-bottom | Element | `<empty>` | right bottom page-margin box |
| bottom-left-corner | Element | `<empty>` | bottom left corner page-margin box |
| bottom-left | Element | `<empty>` | bottom left page-margin box |
| bottom-center | Element | `<empty>` | bottom center page-margin box |
| bottom-right | Element | `<empty>` | bottom right page-margin box |
| bottom-right-corner | Element | `<empty>` | bottom right corner page-margin box |

#### Parts

| Part | Description |
| ---- | ----------- |
| margin-box | all the page-margin boxes |
| top | all page-margin boxes on the top side of the page, including top left corner and top right corner |
| right | all page-margin boxes on the right side of the page, including top right and bottom right corner. |
| bottom | all page-margin boxes on the bottom side of the page, including bottom left corner and bottom right corner. |
| left | all page-margin boxes on the left side of the page, including top left corner and bottom left corner |
| margin-box-group | all the page-margin box groups |
| margin-box-group-top | top page-margin box group: top-left, top-center & top-right |
| margin-box-group-right | right page-margin box group: right-top, right-middle & right-bottom |
| margin-box-group-bottom | bottom page-margin box group: bottom-left, bottom-center & bottom-right |
| margin-box-group-left | left page-margin box group: left-top, left-middle & left-bottom |
| top-left-corner | the top left corner page-margin box |
| top-left | top left page-margin box |
| top-center | top center page-margin box |
| top-right | top right page-margin box |
| top-right-corner | top right corner page-margin box |
| left-top | the left top page-margin box |
| left-middle | the left middle page-margin box |
| left-bottom | the left bottom page-margin box |
| right-top | the right top page-margin box |
| right-middle | the right middle page-margin box |
| right-bottom | the right bottom page-margin box |
| bottom-left-corner | bottom top left corner page-margin box |
| bottom-left | bottom left page-margin box |
| bottom-center | bottom center page-margin box |
| bottom-right | bottom right page-margin box |
| bottom-right-corner | bottom right corner page-margin box |

#### Custom CSS Properties

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| --paged-margin-top | length | 15mm | Size of the top margin |
| --paged-margin-right | length | 15mm | Size of the right margin |
| --paged-margin-bottom | length | 15mm | Size of the bottom margin |
| --paged-margin-left | length | 15mm | Size of the left margin |


### PagedMarginContent `<paged-margin-content>`

#### Slots

| Slot | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| \<default\> | Element | - | Content |


### PagedMarginBox `<paged-margin-box>`

#### properties

| Property | Attribute | Type | Default | Description |
| -------- | --------- | ---- | ------- | ----------- |
| contentNodes | | Node[] \| null | | Returns an array with the nodes assigned to the slot of the page-margin box. |
| contentElements | | Element[] \| null | | Returns an array with the elements assigned to the slot of the page-margin box. |


#### Slots
| Slot | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| \<default\> | Element | - | Content to insert in the marginbox |

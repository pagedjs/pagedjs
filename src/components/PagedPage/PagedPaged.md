
# PagedPage

The **`paged-page`** component represents a printable page with full CSS-controlled geometry, dynamic `@page` sizing, bleed, page-marks, and integrated margin-box rendering via `<paged-margins>`.  
It is designed to work seamlessly with `<paged-margins>` but can also be used by itself.

Each page instance auto-generates a unique `@page <name>` rule so that print and preview rendering stay synchronized.

- - -

## Usage

A `<paged-page>` represents a single page:

html

Copy code

`<paged-page>   <p>Your page content goes here.</p> </paged-page>`

### Page sizing

html

Copy code

`<paged-page width="148mm" height="210mm" bleed="3mm">   <p>A5 page with bleed.</p> </paged-page>`

### Custom page name

html

Copy code

`<paged-page name="cover">   <h1>Cover Page</h1> </paged-page>`

CSS can target the page by name:

css

Copy code

`@page cover {   size: 210mm 297mm;   margin: 0; }`

### Custom margins

Override the default `<paged-margins>` by providing your own:

html

Copy code

`<paged-page>   <paged-margins slot="margins">     <paged-margin-content slot="top-center">Header</paged-margin-content>   </paged-margins> </paged-page>`

### Page marks (crop & cross)

Marks only render when bleed > 0:

html

Copy code

`<paged-page bleed="3mm" marks="crop cross">   <p>Printing with crop & cross marks.</p> </paged-page>`

- - -

## Page Layout Diagram

Below is an SVG illustrating how `<paged-page>` constructs its layout:  
**Bleed → Margin → Page-Area**

svg

Copy code

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
| width | width | string | `"210mm"` | Page width. |
| height | height | string | `"297mm"` | Page height. |
| bleed | bleed | string | `"0mm"` | Bleed around the page. |
| margin | margin | string | `""` | Shorthand margin value (`"20mm 10mm"` etc). |
| marks | marks | string | `""` | `"crop"` and/or `"cross"`. |

- - -

### Methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| _(none public)_ | —   | —   | No public API methods. Internal routines inject `@page` rules and print setup. |

- - -

### Slots

| Slot | Type | Default | Description |
| --- | --- | --- | --- |
| _(default)_ | Element | —   | Main page content, placed inside the page-area. |
| margins | Element | `<paged-margins>` | Provides custom margins; replaces default margins. |

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
| \--paged-width | length | 210mm | Internal page width including bleed. |
| \--paged-height | length | 297mm | Internal page height including bleed. |
| \--paged-bleed | length | 0mm | Bleed area around the page. |
| \--paged-margin-top | length | Implementation default | Size of the top margin. |
| \--paged-margin-right | length | Implementation default | Size of the right margin. |
| \--paged-margin-bottom | length | Implementation default | Size of the bottom margin. |
| \--paged-margin-left | length | Implementation default | Size of the left margin. |

When no valid `margin` attribute is provided, all margins default to **1in**.

- - -

## Behavior

### Automatic `@page` rule injection

Each `<paged-page>` instance installs its own:

css

Copy code

`@page <name> { size: … }`

This ensures print dimensions match the element’s rendered size.

### Global print cleanup

The component injects the following once:

css

Copy code

`@media print {   body {     margin: 0 !important;     padding: 0 !important;   } }`

### Print marks

When `bleed != "0mm"`:

*   `"cross"` creates registration cross marks
    
*   `"crop"` draws crop lines around the bleed box
    

- - -


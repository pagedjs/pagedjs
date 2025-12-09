import { LitElement, html, css, unsafeCSS } from "lit";
import { cross } from "../utils/assets";

/**
 * `<paged-page>` — A printable, CSS-controlled page component with support for
 * margins, bleed, full-page grid layout, and print sizing via the `@page` rule.
 *
 * This element:
 * - Auto-assigns a unique page name when none is provided, ensuring consistent
 *   print and preview rendering.
 * - Reflects the `name`, `width`, and `height` properties to attributes so
 *   CSS selectors like `[name="..."]` work on both screen and print.
 * - Injects a dynamic `@page <name>` rule using `adoptedStyleSheets` so each
 *   page instance can have unique print dimensions.
 *
 * @element paged-page
 *
 * @slot - Main content of the page, placed inside the page-area grid region.
 * @slot - Slot to insert custom margins; replaces default paged-margins component. 
 *
 * @csspart page-area - The main printable content area.
 *
 * @cssprop --paged-width - Internal CSS width used for layout.
 * @cssprop --paged-height - Internal CSS height used for layout.
 * @cssprop --paged-bleed - Extra print bleed size.
 * @cssprop --paged-margin-top - Size of the top margin.
 * @cssprop --paged-margin-bottom - Size of the bottom margin.
 * @cssprop --paged-margin-left - Size of the left margin.
 * @cssprop --paged-margin-right - Size of the right margin.
 */
export class PagedPage extends LitElement {
  /**
   * Lit properties for the component.
   *
   * @property {string} name
   *  The name of the page used in the `@page` rule and exposed as an attribute.
   *  Auto-generated if not provided.
   *
   * @property {number|null} index
   *  Optional index for multi-page contexts.
   *
   * @property {string} width
   *  Page width, e.g. `"210mm"`. Reflected so CSS `[width="..."]` selectors
   *  and internal sizing work consistently.
   *
   * @property {string} height
   *  Page height, e.g. `"297mm"`. Reflected so CSS `[height="..."]` selectors
   *  and internal sizing work consistently.
   */
  static properties = {
    name: { type: String, reflect: true },
    index: { type: Number },
    width: { type: String, reflect: true },
    height: { type: String, reflect: true },
    bleed: { type: String },
    margin: { type: String },
    marks: { type: String },
  };

  /**
   * Component-wide stylesheet defining layout, grid tracks, default margins,
   * print behavior, and preview appearance.
   */
  static styles = css`
    body {
      margin: 0;
      padding: 0;
    }
    *,
    * * {
      box-sizing: border-box;
    }

    :host {

      --paged-mark-color: black;
      --paged-bleed: 0mm;
      --paged-width: 210mm;
      --paged-height: 297mm;

      /* margins are part of the geometry */
  /*    // --paged-margin-left: 15mm;
      // --paged-margin-right: 15mm;
      // --paged-margin-top: 15mm;
      // --paged-margin-bottom: 15mm; */

      width: calc(var(--paged-bleed) + var(--paged-width) + var(--paged-bleed));
      height: calc(var(--paged-bleed) + var(--paged-height) + var(--paged-bleed));
      overflow: hidden;
      break-after: page;
      display: grid;
      margin: 0;
      padding: 0;

      grid-template-rows:
        [bleed-top-start] var(--paged-bleed)
        [bleed-top-end margin-top-start] var(--paged-margin-top)
        [margin-top-end page-area-start] minmax(1px, 1fr)
        [page-area-end margin-bottom-start] var(--paged-margin-bottom)
        [margin-bottom-end bleed-bottom-start] var(--paged-bleed)
        [bleed-bottom-end];

      grid-template-columns:
        [bleed-left-start] var(--paged-bleed)
        [bleed-left-end margin-left-start] var(--paged-margin-left)
        [margin-left-end page-area-start] 1fr
        [page-area-end margin-right-start] var(--paged-margin-right)
        [margin-right-end bleed-right-start] var(--paged-bleed)
        [bleed-right-end];

      /*  ==> dont need template area with template columns. (we should keep either one or the other
      //   grid-template-areas:
      //     "bleed-top bleed-top bleed-top bleed-top bleed-top"
      //     "bleed-left margin-top-left-corner margin-top margin-top-right-corner bleed-right"
      //     "bleed-left margin-left page-area margin-right bleed-right"
      //     "bleed-left margin-bottom-left-corner margin-bottom margin-bottom-right-corner bleed-right";
      //     "bleed-bottom bleed-bottom bleed-bottom bleed-bottom bleed-bottom ";
      //     */
    }

    // ::target(top) {
    // grid-area: margin-top;
    // }

    .page-area {
      grid-column: page-area-start / page-area-end;
      grid-row: page-area-start / page-area-end;
      /*the page-area has an overflow:hidden to follow the W3C specifications, but it can be overriden with the author css.*/
      overflow:hidden;
    }

    @media screen {
      :host {
        outline: 1px solid gainsboro;
        margin: 2rem auto;
      }
    }

    .page-margins, 
    .page-marks {
      display: contents;
    }

    .paged-crop {
      width: 100%;
      heigth:100%
      background: black;
    }

    #paged-crop-t,
    #paged-crop-b {
        grid-column: 2/5;
        grid-row: 1;
        height: 10px;
        border-left: 2px solid var(--paged-mark-color);
        border-right: 2px solid var(--paged-mark-color);
    }

    #paged-crop-b {
      grid-row: 5;
      align-self: end;
    }

    #paged-crop-r,
    #paged-crop-l {
        grid-row: 2/5;
        grid-column: 1;
        width: 10px;
        height: 100%;
        border-top: 2px solid var(--paged-mark-color);
        border-bottom: 2px solid var(--paged-mark-color);
    }

    #paged-crop-r {
      grid-column: 5;
      align-self: end;
      justify-self: end;
    }

    .paged-cross {
      width: 4mm;
      height: auto;
      align-self: center;
      justify-self: center;
      svg {
        width: 100%;
        height: auto;
      }
    }

    #paged-cross-t {
      grid-column: 3;
      grid-row: 1;
    }
    #paged-cross-b {
      grid-column: 3;
      grid-row: 5;
    }
    #paged-cross-l {
      grid-column: 1;
      grid-row: 3;
    }
    #paged-cross-r {
      grid-column: 5;
      grid-row: 3;
    }

    /*
      Make slotted content of page-margins, and default content
      render as a subgrid;
     */
    .page-margins slot *,
    .page-margins ::slotted(*) {
      grid-template-columns: subgrid;
      grid-template-rows: subgrid;
      grid-column: margin-left-start / margin-right-end;
      grid-row: margin-top-start / margin-bottom-end;
    }
  `;

  /**
   * Constructor initializes defaults.
   */
  constructor() {
    super();
    this.index = null;
    this.width = "210mm";
    this.height = "297mm";
    this.name = ""; // auto-filled in connectedCallback
    this.bleed = "0mm";
    this.marks = "";
    this.margin = "";
  }

  /**
   * Lifecycle: Runs when component is added to the DOM.
   *
   * - Ensures the element has a valid `name` attribute.
   * - Injects a dynamic `@page` rule to ensure print sizing matches preview.
   */
  connectedCallback() {
    super.connectedCallback();

    // Auto-assign name if missing
    if (!this.hasAttribute("name") || !this.name?.trim()) {
      const autoName = `page-${crypto.randomUUID()}`;
      this.name = autoName; // reflect:true ensures the attribute is written on the parent object so CSS can use it.
    }

    // validate value for width and height
    if ((this.width && !CSS.supports("width", this.width)) || !this.width) {
      console.log("there is no width for the page, using 210mm");
      this.width = "210mm";
    }
    if ((this.height && !CSS.supports("height", this.height)) || !this.height) {
      console.log("there is no height for the page, using 210mm");
      this.height = "297mm";
    }
    // if there is no bleed or bleed = 0, then set the bleed to 0
    // chrome seems to have issue with calc when one of the number is 0 without any value
    if (!this.bleed || this.bleed == "0") {
      this.bleed = "0mm";
    }

    // Inject the @page rules
    this.#injectPageStyles();

    // Inject the  default printing rule
    this.#injectGlobalPrintStyles();
  }

  static globalPrintStylesApplied = false;

  /**
   * Injects global @media print rules into the document.
   * Ensures it only runs once.
   *
   * @private
   */
  #injectGlobalPrintStyles() {
    if (PagedPage.globalPrintStylesApplied) return;
    PagedPage.globalPrintStylesApplied = true;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  `);

    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }

  /**
   * Injects a dynamic stylesheet that defines a unique `@page <name>` rule
   * and binds the host element to that page context.
   *
   * This is required because:
   * - CSS variables cannot be used in `@page`
   * - browsers do not always apply unnamed @page rules consistently
   *
   * @private
   */
  #injectPageStyles() {
    let marginsBlock;

    // add support for margins from the component?
    if (!this.margin || (this.margin && !CSS.supports("margin", this.margin))) {
      marginsBlock = css`
        --paged-margin-top: 1in;
        --paged-margin-right: 1in;
        --paged-margin-bottom: 1in;
        --paged-margin-left: 1in;
      `;
    } else {
      marginsBlock = this.margin ? getMargin(this.margin) : "";
    }

    // console.log(marginsBlock);
    const sheet = new CSSStyleSheet();

    sheet.replaceSync(`
      @page ${this.name} {
        margin: 0;
        size: calc(var(--paged-bleed, 0mm) + ${this.width} + var(--paged-bleed, 0mm))
              calc(var(--paged-bleed, 0mm) + ${this.height} + var(--paged-bleed, 0mm));
      }

 
      [name="${this.name}"] {
        page: ${this.name};
        --paged-bleed: ${this.bleed};
        --paged-width: calc(var(--paged-bleed, 0mm) + ${this.width} + var(--paged-bleed, 0mm));
        --paged-height: calc(var(--paged-bleed, 0mm) + ${this.height} + var(--paged-bleed, 0mm));
       ${marginsBlock}
      }
    `);

    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }

  /**
   * Renders the content area of the page.
   *
   * @returns {import("lit").TemplateResult}
   */
  render() {
    const crossMarks = [];
    const cropMarks = [];

    if (this.marks?.includes("cross") && this.bleed != "0mm") {
      crossMarks.push(
        html`<div class="paged-cross" id="paged-cross-t">${cross}</div>`,
      );
      crossMarks.push(
        html`<div class="paged-cross" id="paged-cross-r">${cross}</div>`,
      );
      crossMarks.push(
        html`<div class="paged-cross" id="paged-cross-b">${cross}</div>`,
      );
      crossMarks.push(
        html`<div class="paged-cross" id="paged-cross-l">${cross}</div>`,
      );
    }

    if (this.marks?.includes("crop") && this.bleed != "0mm") {
      cropMarks.push(html`<div class="paged-crop" id="paged-crop-t"></div>`);
      cropMarks.push(html`<div class="paged-crop" id="paged-crop-r"></div>`);
      cropMarks.push(html`<div class="paged-crop" id="paged-crop-b"></div>`);
      cropMarks.push(html`<div class="paged-crop" id="paged-crop-l"></div>`);
    }

    return html`
      <div class="page-marks">${crossMarks} ${cropMarks}</div>
      <div class="page-margins">
        <slot name="margins">
          <paged-margins
            exportparts="margin-box, top, right, bottom, left,
            margin-box-group, margin-box-group-top, margin-box-group-right,
            margin-box-group-bottom, margin-box-group-left,
            top-left-corner, top-left, top-center, top-right, top-right-corner,
            left-top, left-middle, left-bottom,
            right-top, right-middle, right-bottom,
            bottom-left-corner, bottom-left, bottom-center, bottom-right,
            bottom-right-corner"
          >
          </paged-margins>
        </slot>
      </div>
      <div class="page-area" part="page-area">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("paged-page", PagedPage);

function getMargin(string) {
  const units = string.split(" ");
  const margins = [];
  switch (units.length) {
    case 4: // top right bottom left
      margins.push(css`
        --paged-margin-top: ${unsafeCSS(units[0])};
        --paged-margin-right: ${unsafeCSS(units[1])};
        --paged-margin-bottom: ${unsafeCSS(units[2])};
        --paged-margin-left: ${unsafeCSS(units[3])};
      `);
      break;
    case 3: // top right bottom right
      margins.push(css` 
        --paged-margin-top: ${unsafeCSS(units[0])};
        --paged-margin-right: ${unsafeCSS(units[1])};
        --paged-margin-bottom: ${unsafeCSS(units[2])};
        --paged-margin-left: ${unsafeCSS(units[1])};
      }`);
      break;
    case 2: // top right top right
      margins.push(css` 
        --paged-margin-top: ${unsafeCSS(units[0])};
        --paged-margin-right: ${unsafeCSS(units[1])};
        --paged-margin-bottom: ${unsafeCSS(units[0])};
        --paged-margin-left: ${unsafeCSS(units[1])};
      });`);
      break;
    default: // top top top top
      margins.push(css` 
        --paged-margin-top: ${unsafeCSS(units[0])};
        --paged-margin-right: ${unsafeCSS(units[0])};
        --paged-margin-bottom: ${unsafeCSS(units[0])};
        --paged-margin-left: ${unsafeCSS(units[0])};
      };`);
  }
  return margins;
}

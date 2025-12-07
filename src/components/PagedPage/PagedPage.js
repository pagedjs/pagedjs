import { LitElement, html, css } from "lit";
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
 *
 * @csspart page-area - The main printable content area.
 *
 * @cssprop --paged-width - Internal CSS width used for layout.
 * @cssprop --paged-height - Internal CSS height used for layout.
 * @cssprop --paged-bleed - Extra print bleed size.
 * @cssprop --margin-top
 * @cssprop --margin-bottom
 * @cssprop --margin-left
 * @cssprop --margin-right
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

      width: calc(var(--paged-width, 210mm) + var(--paged-bleed, 0mm));
      height: calc(var(--paged-height, 297mm) + var(--paged-bleed, 0mm));
      overflow: hidden;
      break-after: page;
      display: grid;
      margin: 0;
      padding: 0;

      /* margins are part of the geometry */
      --margin-left: 8mm;
      --margin-right: 10mm;
      --margin-top: 6mm;
      --margin-bottom: 12mm;

      grid-template-rows:
        [bleed-top-start] var(--paged-bleed, 0mm)
        [bleed-top-end margin-top-start] var(--margin-top)
        [margin-top-end page-area-start] minmax(1px, 1fr)
        [page-area-end margin-bottom-start] var(--margin-bottom)
        [margin-bottom-end bleed-bottom-start] var(--paged-bleed, 0mm)
        [bleed-bottom-end];

      grid-template-columns:
        [bleed-left-start] var(--paged-bleed, 0mm)
        [bleed-left-end margin-left-start] var(--margin-left)
        [margin-left-end page-area-start] 1fr
        [page-area-end margin-right-start] var(--margin-right)
        [margin-right-end bleed-right-start] var(--paged-bleed, 0mm)
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
    }

    @media screen {
      :host {
        outline: 1px solid gainsboro;
        margin: 2rem auto;
      }
    }

    .paged-crop {
      width: 100%;
      heigth:100%
      background: black;
    }

    #paged-crop-t, #paged-crop-b {
        grid-column: 2/5;
        grid-row: 1;
        height: 10px;
        border-left:2px solid var(--paged-mark-color);
        border-right:2px solid var(--paged-mark-color);
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
        height:100%;
        border-top:2px solid var(--paged-mark-color);
        border-bottom :2px solid var(--paged-mark-color);
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
    console.log(this.width);
    console.log(CSS.supports(this.width));
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

    // cropsmark

    // check if marks="crop cross"

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
    const sheet = new CSSStyleSheet();

    sheet.replaceSync(`
      @page ${this.name} {
        margin: 0;
        size: calc(${this.width} + var(--paged-bleed, 0mm))
              calc(${this.height} + var(--paged-bleed, 0mm));
      }

 
      [name="${this.name}"] {
        page: ${this.name};
        --paged-bleed: ${this.bleed};
        --paged-width: calc( ${this.width} + var(--paged-bleed, 0mm));
        --paged-height: calc( ${this.height} + var(--paged-bleed, 0mm));
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
      ${crossMarks} ${cropMarks}
      <div class="page-area" part="page-area">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("paged-page", PagedPage);

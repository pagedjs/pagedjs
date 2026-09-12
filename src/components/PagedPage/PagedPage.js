import { LitElement, html, css, unsafeCSS } from "lit";
import { cross } from "../utils/assets.js";
import { expandBleed } from "../utils/bleed.js";
import "../PagedMargins/PagedMargins.js";

/**
 * Names of the sixteen page-margin boxes in CSS Paged Media Level 3 §5.
 *
 * @see https://www.w3.org/TR/css-page-3/#margin-boxes
 */
export const MARGIN_BOXES = [
	"top-left-corner",
	"top-left",
	"top-center",
	"top-right",
	"top-right-corner",
	"left-top",
	"left-middle",
	"left-bottom",
	"right-top",
	"right-middle",
	"right-bottom",
	"bottom-left-corner",
	"bottom-left",
	"bottom-center",
	"bottom-right",
	"bottom-right-corner",
];

/**
 * `<paged-page>` — A printable, CSS-controlled page component with support for
 * margins, bleed, full-page grid layout, and print sizing via the `@page` rule.
 *
 * This element:
 * - Auto-assigns a unique page name when `autoName` is enabled.
 * - Reflects the `name`, `width`, and `height` properties to attributes so
 *   CSS selectors like `[name="..."]` work on both screen and print.
 * - Injects a dynamic `@page <name>` rule using `adoptedStyleSheets` when
 *   `inject` is enabled, so each page instance can have unique print dimensions.
 * - Forwards slots named by {@link MARGIN_BOXES} to the corresponding box in
 *   the default `<paged-margins>` element.
 *
 * @element paged-page
 *
 * @slot - Main content of the page, placed inside the page-area grid region.
 * @slot margins - Slot to insert custom margins; replaces the default
 *   paged-margins component.
 *
 * @csspart page-area - The main printable content area.
 *
 * @cssprop --paged-width - Internal CSS width used for layout.
 * @cssprop --paged-height - Internal CSS height used for layout.
 * @cssprop --paged-bleed - Print bleed shorthand.
 * @cssprop --paged-bleed-top - Size of the top bleed area.
 * @cssprop --paged-bleed-right - Size of the right bleed area.
 * @cssprop --paged-bleed-bottom - Size of the bottom bleed area.
 * @cssprop --paged-bleed-left - Size of the left bleed area.
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
   *  Auto-generated when `autoName` or `inject` is enabled.
   *
   * @property {number|null} index
   *  Optional index for multi-page contexts.
   *
   * @property {string|null} width
   *  Page width, e.g. `"210mm"`. Reflected so CSS `[width="..."]` selectors
   *  and internal sizing work consistently.
   *
   * @property {string|null} height
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
    recto: { type: Boolean, reflect: true },
    verso: { type: Boolean, reflect: true },
    blank: { type: Boolean, reflect: true },
    first: { type: Boolean, reflect: true },
    autoName: { type: Boolean, reflect: true, attribute: "auto-name" },
    inject: { type: Boolean, reflect: true },
  };

  /**
   * Component-wide stylesheet defining layout, grid tracks, default margins,
   * print behavior, and preview appearance.
   */
  static styles = css`
    *,
    * * {
      box-sizing: border-box;
    }

    :host {
      --paged-mark-color: black;
      --paged-auto-bleed: 0px;
      --paged-bleed: var(--paged-auto-bleed);
      --paged-bleed-top: var(--paged-bleed);
      --paged-bleed-right: var(--paged-bleed);
      --paged-bleed-bottom: var(--paged-bleed);
      --paged-bleed-left: var(--paged-bleed);
      --paged-width: 8.5in;
      --paged-height: 11in;
      --paged-margin-top: 0;
      --paged-margin-right: 0;
      --paged-margin-bottom: 0;
      --paged-margin-left: 0;
      --paged-padding-top: 0;
      --paged-padding-right: 0;
      --paged-padding-bottom: 0;
      --paged-padding-left: 0;
      --paged-border-top-width: medium;
      --paged-border-right-width: medium;
      --paged-border-bottom-width: medium;
      --paged-border-left-width: medium;
      --paged-border-top-style: none;
      --paged-border-right-style: none;
      --paged-border-bottom-style: none;
      --paged-border-left-style: none;
      --paged-border-top-color: currentcolor;
      --paged-border-right-color: currentcolor;
      --paged-border-bottom-color: currentcolor;
      --paged-border-left-color: currentcolor;

      display: block;
      width: var(--paged-width);
      height: var(--paged-height);
      overflow: hidden;
      contain: strict;
      content-visibility: auto;
      break-after: page;
      margin: 0;
      padding: 0;
      counter-increment: page;
    }

    .sheet {
      width: var(--paged-width);
      height: var(--paged-height);
      overflow: hidden;
      display: grid;
      margin: 0;
      padding: 0;

      grid-template-rows:
        [bleed-top-start] var(--paged-bleed-top)
        [bleed-top-end margin-top-start] var(--paged-margin-top)
        [margin-top-end page-area-start] minmax(1px, 1fr)
        [page-area-end margin-bottom-start] var(--paged-margin-bottom)
        [margin-bottom-end bleed-bottom-start] var(--paged-bleed-bottom)
        [bleed-bottom-end];

      grid-template-columns:
        [bleed-left-start] var(--paged-bleed-left)
        [bleed-left-end margin-left-start] var(--paged-margin-left)
        [margin-left-end page-area-start] 1fr
        [page-area-end margin-right-start] var(--paged-margin-right)
        [margin-right-end bleed-right-start] var(--paged-bleed-right)
        [bleed-right-end];
    }

    .page-box {
      grid-column: page-area-start / page-area-end;
      grid-row: page-area-start / page-area-end;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      padding:
        var(--paged-padding-top)
        var(--paged-padding-right)
        var(--paged-padding-bottom)
        var(--paged-padding-left);
      border-width:
        var(--paged-border-top-width)
        var(--paged-border-right-width)
        var(--paged-border-bottom-width)
        var(--paged-border-left-width);
      border-style:
        var(--paged-border-top-style)
        var(--paged-border-right-style)
        var(--paged-border-bottom-style)
        var(--paged-border-left-style);
      border-color:
        var(--paged-border-top-color)
        var(--paged-border-right-color)
        var(--paged-border-bottom-color)
        var(--paged-border-left-color);
      z-index: 0;
    }

    .page-area {
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
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
      height: 100%;
      background: transparent;
    }

    #paged-crop-t,
    #paged-crop-b {
        grid-column: 2/5;
        grid-row: 1;
        height: min(10px, var(--paged-bleed-top));
        border-left: 2px solid var(--paged-mark-color);
        border-right: 2px solid var(--paged-mark-color);
    }

    #paged-crop-b {
      grid-row: 5;
      height: min(10px, var(--paged-bleed-bottom));
      align-self: end;
    }

    #paged-crop-r,
    #paged-crop-l {
        grid-row: 2/5;
        grid-column: 1;
        width: min(10px, var(--paged-bleed-left));
        height: 100%;
        border-top: 2px solid var(--paged-mark-color);
        border-bottom: 2px solid var(--paged-mark-color);
    }

    #paged-crop-r {
      grid-column: 5;
      width: min(10px, var(--paged-bleed-right));
      align-self: end;
      justify-self: end;
    }

    .paged-cross {
      --paged-cross-size: min(4mm, var(--paged-bleed-top));
      width: var(--paged-cross-size);
      height: var(--paged-cross-size);
      align-self: center;
      justify-self: center;
      svg {
        display: block;
        width: 100%;
        height: 100%;
      }
    }

    #paged-cross-t {
      grid-column: 2/5;
      grid-row: 1;
    }
    #paged-cross-b {
      --paged-cross-size: min(4mm, var(--paged-bleed-bottom));
      grid-column: 2/5;
      grid-row: 5;
    }
    #paged-cross-l {
      --paged-cross-size: min(4mm, var(--paged-bleed-left));
      grid-column: 1;
      grid-row: 2/5;
    }
    #paged-cross-r {
      --paged-cross-size: min(4mm, var(--paged-bleed-right));
      grid-column: 5;
      grid-row: 2/5;
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
      z-index: 1;
    }
  `;

  #internals = null;

  /**
   * Constructor initializes defaults.
   */
  constructor() {
    super();
    this.#internals = this.attachInternals?.() ?? null;
    this.index = null;
    this.width = null;
    this.height = null;
    this.name = "";
    this.bleed = "0mm";
    this.marks = "";
    this.margin = "";
    this.autoName = false;
    this.inject = false;
  }

  /**
   * Lifecycle: Runs when component is added to the DOM.
   *
   * - Ensures the element has a valid `name` attribute when `autoName` or
   *   `inject` is enabled.
   * - Injects a dynamic `@page` rule when `inject` is enabled.
   */
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "none");

    // Auto-assign name if missing
    if (this.autoName && (!this.hasAttribute("name") || !this.name?.trim())) {
      this.name = `page-${crypto.randomUUID()}`;
    }

    if (!this.inject) return;

    if (!this.name?.trim()) this.name = `page-${crypto.randomUUID()}`;
    // validate value for width and height
    if (!this.width || !CSS.supports("width", this.width)) {
      this.width = "210mm";
    }
    if (!this.height || !CSS.supports("height", this.height)) {
      this.height = "297mm";
    }
    // calc() addition requires matching types, so normalize unitless zero to a length.
    if (!this.bleed || this.bleed === "0") this.bleed = "0mm";
    // Inject the @page rules
    this.#injectPageStyles();
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
    const bleed = expandBleed(this.bleed) ?? expandBleed("0mm");

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
         size: calc(${bleed.left} + ${this.width} + ${bleed.right})
               calc(${bleed.top} + ${this.height} + ${bleed.bottom});
      }


      [name="${this.name}"] {
        page: ${this.name};
        --paged-bleed: ${this.bleed};
        --paged-bleed-top: ${bleed.top};
        --paged-bleed-right: ${bleed.right};
        --paged-bleed-bottom: ${bleed.bottom};
        --paged-bleed-left: ${bleed.left};
        --paged-width: calc(${bleed.left} + ${this.width} + ${bleed.right});
        --paged-height: calc(${bleed.top} + ${this.height} + ${bleed.bottom});
        ${marginsBlock}
      }
    `);

    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }

  get pageArea() {
    return this.renderRoot.querySelector(".page-area") ?? null;
  }

  get contentArea() {
    return this.querySelector(":scope > :not([slot])") ?? null;
  }

  /**
   * Returns the assigned `<paged-margins>` element or the default fallback.
   *
   * @returns {Element|null} The margins element, or `null` when unavailable.
   */
  get marginsArea() {
    const slot = this.renderRoot?.querySelector("slot[name='margins']");
    const assigned = slot?.assignedElements({ flatten: true }) ?? [];
    return assigned.find((node) => node.localName === "paged-margins") ?? null;
  }

  /**
   * Returns a rendered margin box by its CSS Paged Media name.
   *
   * @param {string} name - One of {@link MARGIN_BOXES}.
   * @returns {Element|null} The matching box, or `null` when unavailable.
   */
  marginBox(name) {
    const margins = this.marginsArea;
    const root = margins?.renderRoot ?? margins?.shadowRoot;
    return root?.getElementById?.(name) ?? root?.querySelector(`#${name}`) ?? null;
  }

  /**
   * Resolves when the page and its margins finish updating.
   *
   * @returns {Promise<boolean>} Whether the page finished without scheduling
   *   another update.
   */
  async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this.marginsArea?.updateComplete;
    return result;
  }

  firstUpdated() {
    this.dispatchEvent(
      new CustomEvent("first-updated", { detail: null, bubbles: false }),
    );
  }

  #setState(name, on) {
    if (!this.#internals?.states) return;
    if (on) this.#internals.states.add(name);
    else this.#internals.states.delete(name);
  }

  updated(changedProperties) {
    if (changedProperties.has("blank")) this.#setState("blank", this.blank);
    if (changedProperties.has("verso")) this.#setState("left", this.verso);
    if (changedProperties.has("recto")) this.#setState("right", this.recto);
    if (changedProperties.has("first")) this.#setState("first", this.first);
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
      <div class="sheet">
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
              ${MARGIN_BOXES.map((box) => html`<slot name=${box} slot=${box}></slot>`)}
            </paged-margins>
          </slot>
        </div>
        <div class="page-box">
          <div class="page-area" part="page-area">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("paged-page", PagedPage);

function getMargin(value) {
  const lengths = value.trim().split(/\s+/);
  const [top, right = top, bottom = top, left = right] = lengths;
  return css`
    --paged-margin-top: ${unsafeCSS(top)};
    --paged-margin-right: ${unsafeCSS(right)};
    --paged-margin-bottom: ${unsafeCSS(bottom)};
    --paged-margin-left: ${unsafeCSS(left)};
  `;
}

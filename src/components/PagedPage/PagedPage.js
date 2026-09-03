import { LitElement, html, css, unsafeCSS } from "lit";
import { cross } from "../utils/assets.js";
// The default `<paged-margins>` is fallback content of this component's
// `margins` slot, so the element has to be defined for the page to own boxes.
import "../PagedMargins/PagedMargins.js";

/**
 * The sixteen page-margin boxes of CSS Paged Media, in the order the spec lists
 * them (CSS Paged Media 3 §5). `<paged-page>` forwards one slot per box into
 * `<paged-margins>` so content can be placed on the page itself rather than on
 * the margins element.
 * https://www.w3.org/TR/css-page-3/#margin-boxes
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
 * @slot top-left-corner|top-left|top-center|top-right|top-right-corner|left-top|left-middle|left-bottom|right-top|right-middle|right-bottom|bottom-left-corner|bottom-left|bottom-center|bottom-right|bottom-right-corner
 *  - Content for the page-margin box of that name, forwarded to `<paged-margins>`.
 *
 * @csspart page-area - The main printable content area.
 *
 * @cssprop --paged-width - Internal CSS width used for layout.
 * @cssprop --paged-height - Internal CSS height used for layout.
 * @cssprop --paged-bleed - Extra print bleed size.
 * @cssprop --paged-auto-bleed - Used `auto` bleed selected by the page's marks.
 * @cssprop --paged-margin-top - Size of the top margin.
 * @cssprop --paged-margin-bottom - Size of the bottom margin.
 * @cssprop --paged-margin-left - Size of the left margin.
 * @cssprop --paged-margin-right - Size of the right margin.
 * @cssprop --paged-padding-top - Size of the top page padding.
 * @cssprop --paged-padding-right - Size of the right page padding.
 * @cssprop --paged-padding-bottom - Size of the bottom page padding.
 * @cssprop --paged-padding-left - Size of the left page padding.
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
      --paged-width: 210mm;
      --paged-height: 297mm;
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
      break-after: page;
      margin: 0;
      padding: 0;
      counter-increment: page;
      /*
       * The engine's page value wins when a fragmentainer supplied one.
       * With --paged-page unset the declaration is invalid at
       * computed-value time and computes to none, leaving the increment
       * above to number a standalone page. See CSS Lists 3, counter-set.
       */
      counter-set: page var(--paged-page);
    }

    .sheet {
      width: var(--paged-width);
      height: var(--paged-height);
      overflow: hidden;
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

    .pagedjs_area > .pagedjs_page_content {
      width: 100%;
      height: 100%;
      position: relative;
      column-fill: auto;
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
      z-index: 1;
    }
  `;

	#internals = null;
	#styledBleed = null;
	#styledMarks = null;
	// The running element each margin box currently holds, so a re-run only
	// touches the boxes whose selection actually changed.
	#placedRunning = new Map();
	#placing = null;

	/**
	 * Constructor initializes defaults.
	 */
	constructor() {
		super();
		this.#internals = this.attachInternals();
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
	 * - Ensures the element has a valid `name` attribute when autoName is true.
	 * - Injects a dynamic `@page` rule to ensure print sizing matches preview when inject is true.
	 */
	connectedCallback() {
		super.connectedCallback();
		this.setAttribute("role", "none");

		if (this.autoName && (!this.hasAttribute("name") || !this.name?.trim())) {
			this.name = `page-${crypto.randomUUID()}`;
		}

		if (this.inject) {
			if (this.width && !CSS.supports("width", this.width)) {
				console.warn(`paged-page: invalid width "${this.width}"`);
				this.width = "";
			}
			if (this.height && !CSS.supports("height", this.height)) {
				console.warn(`paged-page: invalid height "${this.height}"`);
				this.height = "";
			}
			if (this.bleed === "0") this.bleed = "0mm";
			this.#injectPageStyles();
		}
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

	get pageArea() {
		return this.renderRoot.querySelector(".page-area") ?? null;
	}

	get contentArea() {
		return this.querySelector(":scope > fragment-container") ?? null;
	}

	get footnotesArea() {
		return this.contentArea?.querySelector("[data-footnote-area]") ?? null;
	}

	/**
	 * The `<paged-margins>` in effect: the one slotted into `margins`, or the
	 * default the slot falls back to. Flattened assignment covers both, so a
	 * caller never has to know which one a page ended up with.
	 *
	 * @returns {Element|null}
	 */
	get marginsArea() {
		const slot = this.renderRoot?.querySelector("slot[name='margins']");
		const assigned = slot?.assignedElements({ flatten: true }) ?? [];
		return assigned.find((node) => node.localName === "paged-margins") ?? null;
	}

	/**
	 * The `<paged-margin-box>` element for one page-margin box.
	 *
	 * @param {string} name - One of MARGIN_BOXES, for example "top-center".
	 * @returns {Element|null} null before the margins element has rendered.
	 */
	marginBox(name) {
		const margins = this.marginsArea;
		const root = margins?.renderRoot ?? margins?.shadowRoot;
		return root?.getElementById?.(name) ?? root?.querySelector(`#${name}`) ?? null;
	}

	/**
	 * Place a node in a page-margin box, replacing whatever that box held.
	 *
	 * The node is assigned to the page's own slot for that box rather than
	 * inserted into the margins element, so it survives the margins element
	 * being replaced and reaches a custom `<paged-margins>` the same way.
	 *
	 * @param {string} name - One of MARGIN_BOXES.
	 * @param {Node} node - The content to place.
	 * @throws {Error} when `name` is not a page-margin box.
	 */
	setMarginContent(name, node) {
		this.clearMarginContent(name);
		if (node instanceof Element) {
			node.setAttribute("slot", name);
		}
		this.appendChild(node);
	}

	/**
	 * Remove whatever a page-margin box holds.
	 *
	 * @param {string} name - One of MARGIN_BOXES.
	 * @throws {Error} when `name` is not a page-margin box.
	 */
	clearMarginContent(name) {
		if (!MARGIN_BOXES.includes(name)) {
			throw new Error(
				`"${name}" is not a page-margin box. Expected one of: ${MARGIN_BOXES.join(", ")}.`,
			);
		}
		for (const child of [...this.children]) {
			if (child.getAttribute("slot") === name) {
				child.remove();
			}
		}
	}

	/**
	 * Resolve once the page *and everything it renders* is settled.
	 *
	 * Lit's update cycle is per element: `updated()` means this element's own
	 * template has been committed, not that the `<paged-margins>` that template
	 * created has rendered its boxes, and not that the running elements the
	 * cascade asked for have been placed in them. Folding both in here is what
	 * lets a caller await the page alone and find `marginBox()` and its margin
	 * content already there.
	 *
	 * @returns {Promise<boolean>} false when a further update was requested
	 *   during this one, per Lit's contract.
	 */
	async getUpdateComplete() {
		const result = await super.getUpdateComplete();
		await this.marginsArea?.updateComplete;
		await this.#placing;
		return result;
	}

	firstUpdated() {
		this.#adoptContent();
		this.dispatchEvent(
			new CustomEvent("first-updated", { detail: null, bubbles: false }),
		);
	}

	/**
	 * Copy the annotations the engine stamped on the adopted fragmentainer onto
	 * the host, where the cascade can reach them.
	 *
	 * Handlers annotate the `<fragment-container>` because that is what they are
	 * handed, but `@page` rules style the page. Mirroring is what joins the two,
	 * and it is confined to the `--paged-` namespace so a document's own custom
	 * properties are never copied.
	 */
	#adoptContent() {
		const container = this.contentArea;
		if (!container?.style) return;
		// Indexed rather than iterated: a CSSStyleDeclaration exposes its
		// declarations by index everywhere, but is not iterable in every DOM.
		for (let index = 0; index < container.style.length; index += 1) {
			const name = container.style.item(index);
			if (name.startsWith("--paged-")) {
				this.style.setProperty(name, container.style.getPropertyValue(name));
			}
		}
		this.#queueRunningElements();
	}

	/**
	 * Run placement after whatever run is already in flight.
	 *
	 * Placement is asynchronous and re-runs on every update, so two runs can
	 * otherwise overlap and resolve the cascade out of order. Chaining also
	 * leaves one promise for `getUpdateComplete` to await.
	 */
	#queueRunningElements() {
		this.#placing = Promise.resolve(this.#placing).then(() =>
			this.#placeRunningElements(),
		);
	}

	/**
	 * Slot the running element each margin box asked for.
	 *
	 * The box names its request in `--paged-running-element: <name> <mode>`,
	 * written by the transformer from `content: element(name, mode)`. Reading it
	 * from computed style is what lets the cascade choose the running element per
	 * page, the same way `#resolvePrintProperties` reads `--paged-marks`.
	 *
	 * The boxes belong to `<paged-margins>`, which renders on its own schedule,
	 * so a box has no computed style to read until that render completes.
	 * Placement is re-run on every update because the request is cascaded: a
	 * page-state rule such as `@page :first` only wins once the state is set.
	 */
	async #placeRunningElements() {
		const running = this.contentArea?.runningElements;
		if (!running) return;
		const margins = this.marginsArea;
		if (!margins) return;
		await margins.updateComplete;

		for (const name of MARGIN_BOXES) {
			const box = this.marginBox(name);
			if (!box) continue;
			const request = getComputedStyle(box)
				.getPropertyValue("--paged-running-element")
				.trim();
			const [element, mode = "first"] = request ? request.split(/\s+/) : [];
			const node = element ? running[element]?.[mode] ?? null : null;

			// Only a box this page filled itself is cleared, so margin content
			// placed by anyone else survives a re-run.
			const placed = this.#placedRunning.get(name) ?? null;
			if (placed === node) continue;
			this.#placedRunning.set(name, node);
			if (node) this.setMarginContent(name, node.cloneNode(true));
			else this.clearMarginContent(name);
		}
	}

	#setState(name, on) {
		if (on) this.#internals.states.add(name);
		else this.#internals.states.delete(name);
	}

	/**
	 * Sync reflected Boolean properties to `:state(...)` pseudo-classes
	 * named after the corresponding CSS @page pseudo-classes:
	 *   • `blank` property → `:state(blank)` ← matches `@page :blank`
	 *   • `verso` property → `:state(left)`  ← matches `@page :left`
	 *   • `recto` property → `:state(right)` ← matches `@page :right`
	 *   • `first` property → `:state(first)` ← matches `@page :first`
	 *
	 * Author CSS can target either the attribute or the state:
	 *   paged-page[verso], paged-page:state(left) { … }
	 */
	updated(changedProps) {
		super.updated?.(changedProps);
		if (changedProps.has("blank")) this.#setState("blank", this.blank);
		if (changedProps.has("verso")) this.#setState("left", this.verso);
		if (changedProps.has("recto")) this.#setState("right", this.recto);
		if (changedProps.has("first")) this.#setState("first", this.first);
		this.#resolvePrintProperties();
		this.#queueRunningElements();
	}

	/**
	 * Preview styles reach the component as custom properties. Resolve them
	 * after page attributes and custom states have been applied so named and
	 * pseudo-page rules participate in the cascade before marks are rendered.
	 */
	#resolvePrintProperties() {
		const styles = getComputedStyle(this);
		const marks = styles.getPropertyValue("--paged-marks").trim();

		// No custom-property value means this is a directly configured component;
		// retain its `marks` and `bleed` properties as the rendering source.
		if (!marks) {
			if (this.#styledMarks === null && this.#styledBleed === null) return;
			this.#styledMarks = null;
			this.#styledBleed = null;
			this.requestUpdate();
			return;
		}

		const bleed = styles.getPropertyValue("--paged-bleed").trim() || "0mm";
		if (marks === this.#styledMarks && bleed === this.#styledBleed) return;

		this.#styledMarks = marks;
		this.#styledBleed = bleed;
		this.requestUpdate();
	}

	/**
	 * Renders the content area of the page.
	 *
	 * @returns {import("lit").TemplateResult}
	 */
	render() {
		const crossMarks = [];
		const cropMarks = [];
		const marks = this.#styledMarks ?? this.marks;
		const bleed = this.#styledBleed ?? this.bleed;

		if (marks?.includes("cross") && hasBleed(bleed)) {
			crossMarks.push(
				html`<div
					part="paged-cross paged-cross-top"
					class="paged-cross"
					id="paged-cross-t"
				>
					${cross}
				</div>`,
			);
			crossMarks.push(
				html`<div
					part="paged-cross paged-cross-right"
					class="paged-cross"
					id="paged-cross-r"
				>
					${cross}
				</div>`,
			);
			crossMarks.push(
				html`<div
					part="paged-cross paged-cross-bottom"
					class="paged-cross"
					id="paged-cross-b"
				>
					${cross}
				</div>`,
			);
			crossMarks.push(
				html`<div
					part="paged-cross paged-cross-left"
					class="paged-cross"
					id="paged-cross-l"
				>
					${cross}
				</div>`,
			);
		}

		if (marks?.includes("crop") && hasBleed(bleed)) {
			cropMarks.push(
				html`<div
					part="paged-crop paged-crop-top"
					class="paged-crop"
					id="paged-crop-t"
				></div>`,
			);
			cropMarks.push(
				html`<div
					part="paged-crop paged-crop-right"
					class="paged-crop"
					id="paged-crop-r"
				></div>`,
			);
			cropMarks.push(
				html`<div
					part="paged-crop paged-crop-bottom"
					class="paged-crop"
					id="paged-crop-b"
				></div>`,
			);
			cropMarks.push(
				html`<div
					part="paged-crop paged-crop-left"
					class="paged-crop"
					id="paged-crop-l"
				></div>`,
			);
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
						<slot @slotchange=${this.#adoptContent}></slot>
					</div>
				</div>
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
			`);
			break;
		case 2: // top right top right
			margins.push(css`
				--paged-margin-top: ${unsafeCSS(units[0])};
				--paged-margin-right: ${unsafeCSS(units[1])};
				--paged-margin-bottom: ${unsafeCSS(units[0])};
				--paged-margin-left: ${unsafeCSS(units[1])};
			`);
			break;
		default: // top top top top
			margins.push(css`
				--paged-margin-top: ${unsafeCSS(units[0])};
				--paged-margin-right: ${unsafeCSS(units[0])};
				--paged-margin-bottom: ${unsafeCSS(units[0])};
				--paged-margin-left: ${unsafeCSS(units[0])};
			`);
	}
	return margins;
}

function hasBleed(value) {
	const lengths = value?.trim().split(/\s+/) ?? [];
	return lengths.some((length) => !/^[+-]?0*(?:\.0+)?(?:[a-z%]+)?$/i.test(length));
}

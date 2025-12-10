import { LitElement, html, css } from "lit";


/**
 * `<paged-margin-box>` - private component used within the PagedMargins
 * Shadow DOM. It exposes two properties giving access to *slotted* content.
 * 
 * @element paged-margin-box
 * 
 * @slot - The content to be displayed in the margin
 */
export class PagedMarginBox extends LitElement {
  constructor() {
    super();
  }

  /**
   * Returns the nodes slotted in the marginBox.
   * 
   * @returns {Node[]|null} - Array of slotted nodes or null
   */
  get slottedNodes () {
    return this.renderRoot.querySelector('slot')
      .assignedNodes({ flatten: true }) ?? null;
  }

  /**
   * Returns the elements slotted in the marginBox.
   * 
   * @returns {Element[]|null} - Array of slotted elements or null
   */
  get slottedElements () {
    return this.renderRoot.querySelector('slot')
      .assignedElements({ flatten: true }) ?? null;
  }


  render () {
    return html`<slot></slot>`;
  }
}


/**
 * `<paged-margin-content>` - Component used to assign text
 * content to a PagedMarginBox. 
 * 
 * 
 * @element paged-margin-content
 * 
 * @slot - The content to be inserted into the margin
 */
export class PagedMarginContent extends LitElement {
  constructor() {
    super();
  }

  render () {
    return html`<slot></slot>`;
  }
}


/**
 * Object with references to the PagedMarginBoxes within a PagedMargins component.
 * 
 * @typedef {Object} PagedMarginsMarginBoxes
 * @property {null|PagedMarginBox} topLeftCorner - the top left corner PagedMarginBox, or null
 * @property {null|PagedMarginBox} topLeft - the top left PagedMarginBox, or null 
 * @property {null|PagedMarginBox} topCenter - the top center PagedMarginBox, or null 
 * @property {null|PagedMarginBox} topRight - the top right PagedMarginBox, or null 
 * @property {null|PagedMarginBox} topRightCorner - the top right corner PagedMarginBox, or null 
 * @property {null|PagedMarginBox} leftTop - the left top PagedMarginBox, or null 
 * @property {null|PagedMarginBox} leftMiddle - the left middle PagedMarginBox, or null 
 * @property {null|PagedMarginBox} leftBottom - the left bottom PagedMarginBox, or null 
 * @property {null|PagedMarginBox} rightTop - the right top PagedMarginBox, or null 
 * @property {null|PagedMarginBox} rightMiddle - the right middle PagedMarginBox, or null 
 * @property {null|PagedMarginBox} rightBottom - the right bottom PagedMarginBox, or null 
 * @property {null|PagedMarginBox} bottomLeftCorner - the bottom left corner PagedMarginBox, or null 
 * @property {null|PagedMarginBox} bottomLeft - the bottom left PagedMarginBox, or null 
 * @property {null|PagedMarginBox} bottomCenter - the bottom center PagedMarginBox, or null 
 * @property {null|PagedMarginBox} bottomRight - the bottom right PagedMarginBox, or null 
 * @property {null|PagedMarginBox} bottomRightCorner - the bottom right corner PagedMarginBox, or null 
 */

/**
 * `<paged-margins>` - A css-controlable component the renders the page-margin boxes.
 * Content can be inserted through the relevant parts and a ::before, or after. Or, by
 * inserting nodes into the relevant slots. Consider using the `<paged-margin-content>`
 * to insert text content.
 * 
 * @element paged-margins
 * 
 * @property {null|PagedMarginBoxes} - References to the PagedMarginBoxes within the component.
 * 
 * @slot margin-box - all the page-margin boxes
 * @slot top - all page-margin boxes on the top side of the page, including top left corner and top right corner
 * @slot right - all page-margin boxes on the right side of the page, including top right and bottom right corner.
 * @slot bottom - all page-margin boxes on the bottom side of the page, including bottom left corner and bottom right corner.
 * @slot left - all page-margin boxes on the left side of the page, including top left corner and bottom left corner
 * @slot margin-box-group - all the page-margin box groups
 * @slot margin-box-group-top - top page-margin box group: top-left, top-center & top-right
 * @slot margin-box-group-right - right page-margin box group: right-top, right-middle & right-bottom
 * @slot margin-box-group-bottom - bottom page-margin box group: bottom-left, bottom-center & bottom-right
 * @slot margin-box-group-left - left page-margin box group: left-top, left-middle & left-bottom
 * @slot top-left-corner - the top left corner page-margin box
 * @slot top-left - top left page-margin box
 * @slot top-center - top center page-margin box
 * @slot top-right - top right page-margin box
 * @slot top-right-corner - top right corner page-margin box
 * @slot left-top - the left top page-margin box
 * @slot left-middle - the left middle page-margin box
 * @slot left-bottom - the left bottom page-margin box
 * @slot right-top - the right top page-margin box
 * @slot right-middle - the right middle page-margin box
 * @slot right-bottom - the right bottom page-margin box
 * @slot bottom-left-corner - bottom top left corner page-margin box
 * @slot bottom-left - bottom left page-margin box
 * @slot bottom-center - bottom center page-margin box
 * @slot bottom-right - bottom right page-margin box
 * @slot bottom-right-corner - bottom right corner page-margin box
 * 
 * @csspart margin-box - all the page-margin boxes
 * @csspart top - all page-margin boxes on the top side of the page, including top left corner and top right corner
 * @csspart right - all page-margin boxes on the right side of the page, including top right and bottom right corner.
 * @csspart bottom - all page-margin boxes on the bottom side of the page, including bottom left corner and bottom right corner.
 * @csspart left - all page-margin boxes on the left side of the page, including top left corner and bottom left corner
 * @csspart margin-box-group - all the page-margin box groups
 * @csspart margin-box-group-top - top page-margin box group: top-left, top-center & top-right
 * @csspart margin-box-group-right - right page-margin box group: right-top, right-middle & right-bottom
 * @csspart margin-box-group-bottom - bottom page-margin box group: bottom-left, bottom-center & bottom-right
 * @csspart margin-box-group-left - left page-margin box group: left-top, left-middle & left-bottom
 * @csspart top-left-corner - the top left corner page-margin box
 * @csspart top-left - top left page-margin box
 * @csspart top-center - top center page-margin box
 * @csspart top-right - top right page-margin box
 * @csspart top-right-corner - top right corner page-margin box
 * @csspart left-top - the left top page-margin box
 * @csspart left-middle - the left middle page-margin box
 * @csspart left-bottom - the left bottom page-margin box
 * @csspart right-top - the right top page-margin box
 * @csspart right-middle - the right middle page-margin box
 * @csspart right-bottom - the right bottom page-margin box
 * @csspart bottom-left-corner - bottom top left corner page-margin box
 * @csspart bottom-left - bottom left page-margin box
 * @csspart bottom-center - bottom center page-margin box
 * @csspart bottom-right - bottom right page-margin box
 * @csspart bottom-right-corner - bottom right corner page-margin box
 * 
 * @cssprop {length} --paged-margin-top 15mm Size of the top margin
 * @cssprop {length} --paged-margin-right 15mm Size of the right margin
 * @cssprop {length} --paged-margin-bottom 15mm Size of the bottom margin
 * @cssprop {length} --paged-margin-left 15mm Size of the left margin
 */
export class PagedMargins extends LitElement {
  constructor () {
    super();
  }

  static styles = css`
    :host {
      --paged-margin-top: 15mm;
      --paged-margin-right: 15mm;
      --paged-margin-bottom: 15mm;
      --paged-margin-left: 15mm;

      display: grid;

      grid-template-columns: 
        [margin-left-start] var(--paged-margin-left)
        [margin-left-end page-area-start] 1fr
        [margin-right-start page-area-end] var(--paged-margin-right)
        [margin-right-end];
      
      grid-template-rows:
        [margin-top-start] var(--paged-margin-top)
        [margin-top-end page-area-start] 1fr
        [margin-bottom-start page-area-end] var(--paged-margin-bottom)
        [margin-bottom-end];
    }

    #top-left-corner {
      grid-row: margin-top-start;
      grid-column: margin-left-start;
    }

    #top {
      grid-row: margin-top-start;
      grid-column: page-area-start;
    }

    #top-right-corner {
      grid-row: margin-top-start;
      grid-column: margin-right-start;
    }

    #right {
      grid-row: page-area-start;
      grid-column: margin-right-start;
    }

    #bottom-left-corner {
      grid-row: margin-bottom-start;
      grid-column: margin-left-start;
    }

    #bottom {
      grid-row: margin-bottom-start;
      grid-column: page-area-start;
    }

    #bottom-right-corner {
      grid-row: margin-bottom-start;
      grid-column: margin-right-start;
    }

    #left {
      grid-row: page-area-start;
      grid-column: margin-left-start;
    }

    paged-margin-box {
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #top,
    #bottom {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
    }
    
    #left,
    #right {
      display: grid;
      grid-template-rows: 1fr 1fr 1fr;
    }

    #top-left,
    #bottom-left {
      text-align: left;
      justify-content: start;
    }

    #top-right,
    #bottom-right {
      text-align: right;
      justify-content: end;
    }

    #left-top,
    #right-top {
      align-items: start;
    }

    #left-bottom,
    #right-bottom {
      align-items: end;
    }
  `

  /**
   * References to the PagedMarginBoxes within the component.
   * 
   * @returns {null|PagedMarginsMarginBoxes} 
   */
  get marginBoxes () {
    if (this.renderRoot) {
      return {
        topLeftCorner: this.renderRoot.querySelector('#top-left-corner') ?? null,
        topLeft: this.renderRoot.querySelector('#top-left') ?? null,
        topCenter: this.renderRoot.querySelector('#top-center') ?? null,
        topRight: this.renderRoot.querySelector('#top-right') ?? null,
        topRightCorner: this.renderRoot.querySelector('#top-right-corner') ?? null,
        leftTop: this.renderRoot.querySelector('#left-top') ?? null,
        leftMiddle: this.renderRoot.querySelector('#left-middle') ?? null,
        leftBottom: this.renderRoot.querySelector('#left-bottom') ?? null,
        rightTop: this.renderRoot.querySelector('#right-top') ?? null,
        rightMiddle: this.renderRoot.querySelector('#right-middle') ?? null,
        rightBottom: this.renderRoot.querySelector('#right-bottom') ?? null,
        bottomLeftCorner: this.renderRoot.querySelector('#bottom-left-corner') ?? null,
        bottomLeft: this.renderRoot.querySelector('#bottom-left') ?? null,
        bottomCenter: this.renderRoot.querySelector('#bottom-center') ?? null,
        bottomRight: this.renderRoot.querySelector('#bottom-right') ?? null,
        bottomRightCorner: this.renderRoot.querySelector('#bottom-right-corner') ?? null
      }
    }

    return null;
  }

  render () {
    return html`
      <paged-margin-box id="top-left-corner" part="margin-box top left corner top-left-corner">
        <slot name="top-left-corner"></slot>
      </paged-margin-box>

      <div id="top" part="margin-box-group margin-box-group-top">
        <paged-margin-box id="top-left" part="margin-box top top-left">
          <slot name="top-left"></slot>
        </paged-margin-box>
        <paged-margin-box id="top-center" part="margin-box top top-center">
          <slot name="top-center"></slot>
        </paged-margin-box>
        <paged-margin-box id="top-right" part="margin-box top top-right">
          <slot name="top-right"></slot>
        </paged-margin-box>
      </div>

      <paged-margin-box id="top-right-corner" part="margin-box top right corner top-right-corner">
        <slot name="top-right-corner"></slot>
      </paged-margin-box>
      
      <div id="left" part="margin-box-group margin-box-group-left">
        <paged-margin-box id="left-top" part="margin-box left left-top">
          <slot name="left-top"></slot>
        </paged-margin-box>
        <paged-margin-box id="left-middle" part="margin-box left left-middle">
          <slot name="left-middle"></slot>
        </paged-margin-box>
        <paged-margin-box id="left-bottom" part="margin-box left left-bottom">
          <slot name="left-bottom"></slot>
        </paged-margin-box>
      </div>

      <div id="right" part="margin-box-group margin-box-group-right">
        <paged-margin-box id="right-top" part="margin-box right right-top">
          <slot name="right-top"></slot>
        </paged-margin-box>
        <paged-margin-box id="right-middle" part="margin-box right right-middle">
          <slot name="right-middle"></slot>
        </paged-margin-box>
        <paged-margin-box id="right-bottom" part="margin-box right right-bottom">
          <slot name="right-bottom"></slot>
        </paged-margin-box>
      </div>
      
      <paged-margin-box id="bottom-left-corner" part="margin-box bottom left corner bottom-left-corner">
        <slot name="bottom-left-corner"></slot>
      </paged-margin-box>
      
      <div id="bottom" part="margin-box-group margin-box-group-bottom">
        <paged-margin-box id="bottom-left" part="margin-box bottom bottom-left">
          <slot name="bottom-left"></slot>
        </paged-margin-box>
        <paged-margin-box id="bottom-center" part="margin-box bottom bottom-center">
          <slot name="bottom-center"></slot>
        </paged-margin-box>
        <paged-margin-box id="bottom-right" part="margin-box bottom bottom-right">
          <slot name="bottom-right"></slot>
        </paged-margin-box>
      </div>

      <paged-margin-box id="bottom-right-corner" part="margin-box bottom right corner bottom-right-corner">
        <slot name="bottom-right-corner"></slot>
      </paged-margin-box>
    `;
  }
}

customElements.define("paged-margin-content", PagedMarginContent);
customElements.define("paged-margin-box", PagedMarginBox);
customElements.define("paged-margins", PagedMargins);
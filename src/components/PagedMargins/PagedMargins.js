import { LitElement, html, css } from "lit";

/**
 * Essentially a no-op wrapper.
 * Should make it easier to style of select with javascript.
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
 * No-op wrapper. Makes the code a little more legible?
 * And easier to write the selector in the component.
 */
export class PagedMarginBox extends LitElement {
  constructor() {
    super();
  }

  /**
   * Returns the nodes assigned to the slot of the marginBox
   * 
   * @returns Array<Node>|null Array of assigned nodes, or null
   * @question, does it make sens to include this?
   * 
   * Convenience, in that it shortens:
   * marginBox.querySelector('slot').assignedNodes({flatten: true})
   * 
   * to:
   * marginBox.contentNodes
   * 
   * But could achieve a comparable result by exposing the slot through a 
   * shortcut?
   */
  get contentNodes () {
    return this.renderRoot.querySelector('slot').assignedNodes({ flatten: true }) ?? null;
  }

  get contentElements () {
    return this.renderRoot.querySelector('slot').assignedElements({ flatten: true }) ?? null;
  }


  render () {
    return html`<slot></slot>`;
  }
}


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
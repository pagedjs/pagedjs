import { LitElement, html, css } from "lit";

/**
 * Expected use:
 * PagedHorizontalMarginAutosize
 *    PagedMarginBoxAutosize
 *      slot
 *    PagedMarginBoxAutosize
 *      slot
 *    PagedMarginBoxAutosize
 *      slot
 * 
 * 
 * The PagedMarginBoxAutosize measures length of its slotted content after 
 * it is added to DOM. It then emits an event `intrinsic-content-width`.
 * 
 * PagedHorizontalMarginAutosize listens for this event. When it receives it
 * it will update its internal registry and update sizes of the content
 * boxes by updating template column string.
 * 
 * At the moment changes in the element are not recognized.
 * slotchange event exists but only fires when nodes are added or removed.
 */

export class PagedMarginBoxAutosize extends LitElement {
  static properties = {
    position: { type: String }
  };

  constructor() {
    super();
  }

  static styles = css`
  :host {
    display: flex;
    align-items: center;
  }
  `

  /**
   * Measure intrinsic width of content in the slot.
   * 
   * @param {Array} nodes Nodes to measure
   * @returns int
   */
  _measureIntrinsicContentWidth (nodes) {
    return Array.from(nodes).reduce((width, node) => {
      if (node.nodeName == 'SLOT') {
        return width + this._measureIntrinsicContentWidth(Array.from(node.assignedElements()));
      }
      else {
        node.style.whiteSpace = 'nowrap';
        const nodeWidth = node.offsetWidth;
        node.style.removeProperty('white-space');
        return width + nodeWidth;
      }
    }, 0);
  }

  /**
   * Ran after DOM is updated.
   * Measure intrinsic content width and dispatch event.
   */
  updated () {
    console.log('updated')
    const intrinsicWidth = this._measureIntrinsicContentWidth(Array.from(this.querySelector('slot').assignedElements()));
    this.dispatchEvent(
      new CustomEvent('intrinsic-content-width', {detail: intrinsicWidth, bubbles: true})
    );
  }

  render () {
    return html`<slot></slot>`;
  }
}

export class PagedHorizontalMarginAutosize extends LitElement {
  static properties = {
    side: { type: String}
  };

  constructor() {
    super();
    this.contentWidth = {
      left: 0,
      center: 0,
      right: 0
    }
  }

  static styles = css`
  :host {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }
   
  paged-margin-box-autosize[position="center"] {
    text-align: center;
    justify-content: center;
  }

  paged-margin-box-autosize[position="right"] {
    text-align: right;
    justify-content: end;
  }
  `

  setContentWidth (marginBox, width) {
    if (marginBox in this.contentWidth) {
      this.contentWidth[marginBox] = width;
    }
  }

  updateGridColumns () {
    let gridTemplateColumnsString = '';

    if (this.contentWidth.center > 0) {
      if (this.contentWidth.left == 0 && this.contentWidth.right == 0) {
        gridTemplateColumnsString = '0 1fr 0';
      }
      else {
        if (this.contentWidth.left > 0) {
          if (this.contentWidth.right > 0) {
            const outerwidths = this.contentWidth.left + this.contentWidth.center + this.contentWidth.right;
            const newcenterWidth = this.contentWidth.center * 100 / outerwidths;
            if (newcenterWidth > 40) {
              gridTemplateColumnsString = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
            } else {
              gridTemplateColumnsString = "repeat(3, 1fr)";
            }
          }
          else {
            let outerwidths = this.contentWidth.left + this.contentWidth.center;
            let newcenterWidth = this.contentWidth.center * 100 / outerwidths;
            gridTemplateColumnsString = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
          }
        }
        else {
          const outerwidths = this.contentWidth.right + this.contentWidth.center;
          const newcenterWidth = this.contentWidth.center * 100 / outerwidths;
          gridTemplateColumnsString = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
        }
      }
    }
    else if (this.contentWidth.left > 0) {
      if (this.contentWidth.right > 0) {
        const outerwidths = this.contentWidth.left + this.contentWidth.right;
        const newLeftWidth = this.contentWidth.left * 100 / outerwidths;
        gridTemplateColumnsString = "minmax(16.66%, " + newLeftWidth + "%) 0 1fr";							
      }
      else {
        gridTemplateColumnsString = '1fr 0 0';
      }
    }
    else if (this.contentWidth.right > 0) {
      gridTemplateColumnsString = '0 0 1fr'
    }
 
    this.style.gridTemplateColumns = gridTemplateColumnsString;
  }

  firstUpdated () {
    this.renderRoot.addEventListener('intrinsic-content-width', (e) => {
      const target = e.target,
            width = e.detail;

      this.setContentWidth(target.getAttribute('position'), width);
      this.updateGridColumns();
    });
  }

  render () {
    return html`
    <paged-margin-box-autosize part="left margin-box" position="left">
      <slot name="left"></slot>
    </paged-margin-box-autosize>
    <paged-margin-box-autosize part="center margin-box" position="center">
      <slot name="center"></slot>
    </paged-margin-box-autosize>
    <paged-margin-box-autosize part="right margin-box" position="right">
      <slot name="right"></slot>
    </paged-margin-box-autosize>
    `;
  }
}

customElements.define("paged-margin-box-autosize", PagedMarginBoxAutosize);
customElements.define("paged-horizontal-margin-autosize", PagedHorizontalMarginAutosize);

/*
  Example use:

  <paged-horizontal-margin side="top">
    <paged-margin-box part="left" position="left"></paged-margin-box>
    <paged-margin-box part="center" position="center"></paged-margin-box>
    <paged-margin-box part="right" position="right"></paged-margin-box>
  </paged-horizontal-margin>
*/
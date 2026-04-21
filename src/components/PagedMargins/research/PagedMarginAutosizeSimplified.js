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

export class PagedHorizontalMarginAutosizeSimplified extends LitElement {
  static properties = {
    side: { type: String}
  };

  constructor() {
    super();
  }

  static styles = css`
  :host {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }

  .paged_margin {
    display: flex;
    align-items: center;
  }
   
  .paged_margin-center {
    text-align: center;
    justify-content: center;
  }

  .paged_margin-right {
    text-align: right;
    justify-content: end;
  }
  `

  render () {
    return html`
    <div class="paged_margin paged_margin-left" part="left margin-box">
      <slot name="left"></slot>
    </div>
    <div class="paged_margin paged_margin-center" part="center margin-box">
      <slot name="center"></slot>
    </div>
    <div class="paged_margin paged_margin-right" part="right margin-box">
      <slot name="right"></slot>
    </div>
    `;
  }
}

customElements.define("paged-horizontal-margin-autosize-simplified", PagedHorizontalMarginAutosizeSimplified);

/*
  Example use:

  <paged-horizontal-margin side="top">
    <paged-margin-box part="left" position="left"></paged-margin-box>
    <paged-margin-box part="center" position="center"></paged-margin-box>
    <paged-margin-box part="right" position="right"></paged-margin-box>
  </paged-horizontal-margin>
*/
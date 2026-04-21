import { LitElement, html, css } from "lit";


export class PagedMarginBoxThroughPseudo extends LitElement {
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

  :host::before,
  ::slotted(*) {
    flex-grow: 1;
  }
  `

  render () {
    return html`<slot></slot>`;
  }
}

export class PagedHorizontalMarginThroughPseudo extends LitElement {
  static properties = {
    side: { type: String}
  };

  constructor() {
    super();
    this.marginBoxWidths = {
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
    
  paged-margin-box-through-pseudo[position="center"] {
    text-align: center;
  }

  paged-margin-box-through-pseudo[position="right"] {
    text-align: right;
  }
  `

  render () {
    return html`
    <paged-margin-box-through-pseudo part="left margin-box" position="left">
      <slot name="left"></slot>
    </paged-margin-box-through-pseudo>
    <paged-margin-box-through-pseudo part="center margin-box" position="center">
      <slot name="center"></slot>
    </paged-margin-box-through-pseudo>
    <paged-margin-box-through-pseudo part="right margin-box" position="right">
      <slot name="right"></slot>
    </paged-margin-box-through-pseudo>
    `;
  }
}

customElements.define("paged-margin-box-through-pseudo", PagedMarginBoxThroughPseudo);
customElements.define("paged-horizontal-margin-through-pseudo", PagedHorizontalMarginThroughPseudo);

/*
  Example use:

  <paged-horizontal-margin side="top">
    <paged-margin-box part="left" position="left"></paged-margin-box>
    <paged-margin-box part="center" position="center"></paged-margin-box>
    <paged-margin-box part="right" position="right"></paged-margin-box>
  </paged-horizontal-margin>
*/
import { LitElement, html } from "lit";

export class PagedDocument extends LitElement {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  /**
   * Returns children assigned to the default slot.
   * Does currently not do any filtering.
   */
  get pages () {
    const slot = this.renderRoot.querySelector('slot');
    
    if (slot) {
      return slot.assignedElements({ flatten: true });
    }

    return null;
  }

  /**
   * Should be ran after first render. Set a listener for slot change
   * to update page indexes (page numbers).
   */
  firstUpdated () {
    const slot = this.renderRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => this.updatePageIndexes());
  }

  /**
   * Set indexes on pages.
   * 
   * Not sure this is necessary. Would prevent a reordering workflow.
   * Unless that is done through order declarations
   */
  updatePageIndexes () {
    this.pages.forEach((page, index) => {
      if (page.getAttribute('index') != index) {
        page.setAttribute('index', index)
      }
    });
  }

  /**
   * Adds a page by constructing a pagedPage and attaching it to itself.
   * @FIXME: find way to set page constructor?
   */
  addPage () {
    let page = document.createElement('paged-page');
    this.appendChild(page);
    return page;
  }

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define("paged-document", PagedDocument);


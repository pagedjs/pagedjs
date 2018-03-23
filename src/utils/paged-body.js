let tmpl = document.createElement('template');
tmpl.innerHTML = `
  <slot></slot>
`;

class PagedBody extends HTMLElement {
	constructor() {
		super();

		// let shadowRoot = this.attachShadow({mode: 'open'});
		// shadowRoot.appendChild(tmpl.content.cloneNode(true));
	}
}

window.customElements.define('paged-body', PagedBody);

export default PagedBody;

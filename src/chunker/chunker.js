import Section from "./section";
import Page from "./page";
import ContentParser from "./parser";
// import PagedBody from "../utils/paged-body.js";

const MAX_SECTIONS = 1;

const TEMPLATE = `<div class="page">
	<div class="top">
		<div class="top-left-corner"><div class="content"></div></div>
		<div class="top-left"><div class="content"></div></div>
		<div class="top-center"><div class="content"></div></div>
		<div class="top-right"><div class="content"></div></div>
		<div class="top-right-corner"><div class="content"></div></div>
	</div>
	<div class="right">
		<div class="right-top"><div class="content"></div></div>
		<div class="right-middle"><div class="content"></div></div>
		<div class="right-bottom"><div class="content"></div></div>
	</div>
	<div class="left">
		<div class="left-top"><div class="content"></div></div>
		<div class="left-middle"><div class="content"></div></div>
		<div class="left-bottom"><div class="content"></div></div>
	</div>
	<div class="bottom">
		<div class="bottom-left-corner"><div class="content"></div></div>
		<div class="bottom-left"><div class="content"></div></div>
		<div class="bottom-center"><div class="content"></div></div>
		<div class="bottom-right"><div class="content"></div></div>
		<div class="bottom-right-corner"><div class="content"></div></div>
	</div>
	<div class="area"></div>
</div>`;

/**
 * Chop up text into flows
 * @class
 */
class Chunker {
	constructor(content, renderTo, preview) {
		this.pagesArea = document.createElement("div");
		this.pagesArea.classList.add("pages");

		if (renderTo) {
			renderTo.appendChild(this.pagesArea);
		} else {
			document.querySelector("body").appendChild(this.pagesArea);
		}

		this.pageTemplate = document.createElement("template");
		this.pageTemplate.innerHTML = TEMPLATE;

		this.preview = preview;

		this.pages = [];
		this.total = 0;
		this.sectionsTotal = 0;

		if (content) {
			this.content = content;

			let parsed = new ContentParser(content);

			let sections = [...parsed.children];

			if (sections.length > 0) {
				return this.sections(sections).then(() => {
					return this;
				});
			} else {
				return this.section(parsed)
					.then((section) => {
						this.total += section.total;
						this.sectionsTotal += 1;
						return this;
					});
			}

		}
	}

	async sections(sections) {
		// let sectionContent = sections.shift();
		// let frag = document.createDocumentFragment();
		// frag.appendChild(section);

		for (let sectionContent of sections) {

			// Wait for section to finish rendering before adding the next section
			let rendered = await this.section(sectionContent).then((section) => {
				this.total = section.total;
				this.sectionsTotal += 1;
			});

			if (MAX_SECTIONS && this.sectionsTotal >= MAX_SECTIONS) {
				break;
			}

		}
	}

	section(sectionContent) {

		let section = new Section(this.pagesArea, this.pageTemplate, this.total, this.preview);

		// section.create(this.sectionsTotal, this.total);

		return section.render(sectionContent);
	}

}

export default Chunker;

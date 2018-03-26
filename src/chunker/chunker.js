import Section from "./section";
import Page from "./page";
import Parser from "./parser";
// import PagedBody from "../utils/paged-body.js";

const MAX_SECTIONS = false;

/**
 * Chop up text into flows
 * @class
 */
class Chunker {
	constructor(content, preview) {

		this.pagesArea = document.querySelector(".pages");
		this.pageTemplate = document.querySelector("#page-template");

		this.preview = preview;

		this.pages = [];
		this.total = 0;
		this.sectionsTotal = 0;

		if (content) {
			this.content = content;

			let parsed = new Parser(content);

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
				this.total += section.total;
				this.sectionsTotal += 1;
			});

			if (MAX_SECTIONS && this.sectionsTotal >= MAX_SECTIONS) {
				break;
			}

		}
	}

	section(sectionContent) {

		let section = new Section(this.pagesArea, this.pageTemplate, this.preview);

		section.create(this.sectionsTotal, this.total);

		return section.render(sectionContent);
	}

}

export default Chunker;

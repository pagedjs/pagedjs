import Section from "./section";
import Page from "./page";
import ContentParser from "./parser";
// import PagedBody from "../utils/paged-body.js";

const MAX_SECTIONS = false;

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
	constructor(content, renderTo, breaks, preview) {
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
			this.breaks = breaks;

			let parsed = new ContentParser(content);

			let sections;
			if (breaks) {
				sections = this.processBreaks(parsed, breaks);
			} else {
				sections = [...parsed.children];
			}

			this.namedPages = this.findNamedPages(parsed, breaks);

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

	processBreaks(parsed, breaks) {
		let selectors = [];
		for (let b in breaks) {
			selectors.push(b);
		}
		let s = selectors.join(",");
		let parts = parsed.querySelectorAll(s);
		return parts;
	}

	findNamedPages(parsed, breaks) {
		let named = {};
		for (let b in breaks) {
			for (let p of breaks[b]) {
				if (p.name) {
					let parts = parsed.querySelectorAll(b);
					named[p.name] = parts;
				}
			}
		}
		return named;
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
		let name;
		for (let named in this.namedPages) {
			for (let element of this.namedPages[named]) {
				if(sectionContent == element) {
					name = named;
					break;
				}
			}
			if (name) {
				break;
			}
		}

		let section = new Section(this.pagesArea, this.pageTemplate, this.total, name, this.preview);

		// section.create(this.sectionsTotal, this.total);

		return section.render(sectionContent);
	}

}

export default Chunker;

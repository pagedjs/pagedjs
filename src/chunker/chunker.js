import Section from "./section";
import Page from "./page";
import ContentParser from "./parser";
import { split } from "../utils/dom";
import EventEmitter from "event-emitter";

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
	constructor(content, renderTo, styler, preview) {
		this.pagesArea = document.createElement("div");
		this.pagesArea.classList.add("pages");
		this.styles = styler;
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

		this.content = content;
		this.breaks = this.styles && this.styles.breaks;

		if (content) {
			this.flowed = this.flow(content, this.breaks);
		} else {
			this.flowed = new new Promise(function(resolve, reject) {
				// TODO: handle deffered
			});
		}

		return this;
	}

	then() {
	  return this.flowed.then;
	}

	flow(content, breaks) {
		let parsed = new ContentParser(content);

		this.styles && this.styles.contents(parsed);

		let sections;
		if (breaks) {
			sections = this.processBreaks(parsed, breaks);
		} else {
			sections = [...parsed.children];
		}

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

	processBreaks(parsed, breaks) {
		let selectors = [];
		for (let b in breaks) {
			// Find elements
			let elements = parsed.querySelectorAll(b);
			// Add break data
			for (var i = 0; i < elements.length; i++) {
				for (let prop of breaks[b]) {
					elements[i].setAttribute("data-" + prop.property, prop.value);
				}
			}
			// Add to global selector
			selectors.push(b);
		}

		// Add any other direct children
		for (var i = 0; i < parsed.children.length; i++) {
			selectors.push("[ref='"+parsed.children[i].getAttribute("ref")+"']");
		}

		let s = selectors.join(",");
		let parts = Array.from(parsed.querySelectorAll(s));

		let part;
		let sections = [];

		for (var i = 0; i < parts.length; i++) {
			part = parts[i];
			if (part.parentNode && part.parentNode.nodeType === 1) {
				let parent = part.parentNode;
				let before = part.dataset.breakBefore;
				let after = part.dataset.breakAfter;
				let index = Array.prototype.indexOf.call(parent.childNodes, part);

				// Get the top parent
				let topParent = part.parentNode;
				while (topParent) {
					if(topParent.parentNode.nodeType === 1) {
						topParent = topParent.parentNode;
					} else {
						break;
					}
				}

				// Split
				let dup = split(topParent, part, before);

				if (dup) {
					// console.log("dup", part, dup);

					sections.concat(sections, dup);
				} else {
					// console.log("topParent", topParent);
					sections.push(topParent);
				}
			} else {
				// console.log("parT", part);

				sections.push(part);
			}
		}

		return sections;
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
		section.on("page", (page) => {
			this.styles && this.styles.counters(this.pagesArea);
		})

		return section.render(sectionContent);
	}

}

EventEmitter(Chunker.prototype);

export default Chunker;

import Handler from "../handler.js";
import { isContainer, isElement } from "../../utils/dom.js";
import { getBoundingClientRect } from "../../utils/utils.js";
// import Layout from "../../chunker/layout.js";
import csstree from "css-tree";

const FOOTNOTES_OVERLAPS_WITH = -1;
const FOOTNOTES_NO_OVERLAP = 0;
const FOOTNOTES_CONTAINS = 1;

class Footnotes extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.footnotes = {};
		this.needsLayout = [];
		this.callsDone = 0; this.numDeferredFootnotes = 0;
		this.deferredFootnotes = [];
	}

	onDeclaration(declaration, dItem, dList, rule) {
		let property = declaration.property;
		if (property === "float") {
			let identifier = declaration.value.children && declaration.value.children.first();
			let location = identifier && identifier.name;
			if (location === "footnote") {
				let selector = csstree.generate(rule.ruleNode.prelude);
				this.footnotes[selector] = {
					selector: selector,
					policy: "auto",
					display: "block"
				};
				dList.remove(dItem);
			}
		}
		if (property === "footnote-policy") {
			let identifier = declaration.value.children && declaration.value.children.first();
			let policy = identifier && identifier.name;
			if (policy) {
				let selector = csstree.generate(rule.ruleNode.prelude);
				let note = this.footnotes[selector];
				if (note) {
					note.policy = policy;
				}
			}
		}
		if (property === "footnote-display") {
			let identifier = declaration.value.children && declaration.value.children.first();
			let display = identifier && identifier.name;
			let selector = csstree.generate(rule.ruleNode.prelude);
			if (display && this.footnotes[selector]) {
				let note = this.footnotes[selector];
				if (note) {
					note.display = display;
				}
			}
		}
	}

	onPseudoSelector(pseudoNode, pItem, pList, selector, rule) {
		let name = pseudoNode.name;
		if (name === "footnote-marker") {
			// switch ::footnote-marker to [data-footnote-marker]::before
			let prelude = rule.ruleNode.prelude;
			let newPrelude = new csstree.List();

			// Can't get remove to work, so just copying everything else
			prelude.children.first().children.each((node) => {
				if (node.type !== "PseudoElementSelector") {
					newPrelude.appendData(node);
				}
			});

			// Add our data call
			newPrelude.appendData({
				type: "AttributeSelector",
				name: {
					type: "Identifier",
					name: "data-footnote-marker",
				},
				flags: null,
				loc: null,
				matcher: null,
				value: null
			});

			// Add new pseudo element
			newPrelude.appendData({
				type: "PseudoElementSelector",
				name: "marker",
				loc: null,
				children: null
			});

			prelude.children.first().children = newPrelude;
		}

		if (name === "footnote-call") {
			// switch ::footnote-call to [data-footnote-call]::after

			let prelude = rule.ruleNode.prelude;
			let newPrelude = new csstree.List();

			// Can't get remove to work, so just copying everything else
			prelude.children.first().children.each((node) => {
				if (node.type !== "PseudoElementSelector") {
					newPrelude.appendData(node);
				}
			});

			// Add our data call
			newPrelude.appendData({
				type: "AttributeSelector",
				name: {
					type: "Identifier",
					name: "data-footnote-call",
				},
				flags: null,
				loc: null,
				matcher: null,
				value: null
			});

			// Add new pseudo element
			newPrelude.appendData({
				type: "PseudoElementSelector",
				name: "after",
				loc: null,
				children: null
			});

			prelude.children.first().children = newPrelude;
		}
	}

	processFootnotes(parsed, notes, pageArea) {
		if (0) {
			for (let n in notes) {
				// Find elements
				let elements = parsed.querySelectorAll(n);
				let element;
				let note = notes[n];
				for (var i = 0; i < elements.length; i++) {
					element = elements[i];
					// Add note type
					element.setAttribute("data-note", "footnote");
					element.setAttribute("data-break-before", "avoid");
					element.setAttribute("data-note-policy", note.policy || "auto");
					element.setAttribute("data-note-display", note.display || "block");
					// Mark all parents
					this.processFootnoteContainer(element);

					// Make the caller.
					this.moveFootnote(element, true);
				}
			}
		}
	}

	processFootnoteContainer(node) {
		if (1) {
			// Find the container
			let element = node.parentElement;
			let prevElement = element;
			// Walk up the dom until we find a container element
			while (element) {
				if (isContainer(element)) {
					// Add flag to the previous non-container element that will render with children
					prevElement.setAttribute("data-has-notes", "true");
					break;
				}

				prevElement = element;
				element = element.parentElement;

				// If no containers were found and there are no further parents flag the last element
				if (!element) {
					prevElement.setAttribute("data-has-notes", "true");
				}
			}
		}
	}

	renderNode(node) {
		if (1) {
			if (node.nodeType == 1) {
				// Get all notes
				let notes;

				// Ingnore html element nodes, like mathml
				if (!node.dataset) {
					return;
				}

				for (let noteSelector in this.footnotes) {
					let note = this.footnotes[noteSelector];
					let elements = node.querySelectorAll(noteSelector);
					for (var i = 0; i < elements.length; i++) {
						let element = elements[i];
						// Add note type
						element.setAttribute("data-note", "footnote");
						element.setAttribute("data-break-before", "avoid");
						element.setAttribute("data-note-policy", note.policy || "auto");
						element.setAttribute("data-note-display", note.display || "block");
						// Mark all parents
						this.processFootnoteContainer(element);

						// Make the caller.
						this.moveFootnote(element, true);
					}
				}
			}
		}
	}

	moveFootnote(node, needsNoteCall, fallbackPageArea) {
		if (1) {
			let pageArea = node.closest(".pagedjs_area") || fallbackPageArea;
			let noteArea = pageArea.querySelector(".pagedjs_footnote_area");
			let noteContent = noteArea.querySelector(".pagedjs_footnote_content");
			let noteInnerContent = noteContent.querySelector(".pagedjs_footnote_inner_content");

			if (!isElement(node)) {
				return;
			}

			// Check if note already exists for overflow
			let existing = noteInnerContent.querySelector(`[data-ref="${node.dataset.ref}"]`);
			if (existing) {
				return;
			}

			// Add call for the note
			let noteCall;
			if (needsNoteCall) {
				noteCall = this.createFootnoteCall(node);
			}

			// Remove the break before attribute for future layout
			node.removeAttribute("data-break-before");

			// Add the note node
			noteInnerContent.appendChild(node);

			// Remove empty class
			if (noteContent.classList.contains("pagedjs_footnote_empty")) {
				noteContent.classList.remove("pagedjs_footnote_empty");
			}

			// Add marker
			node.dataset.footnoteMarker = node.dataset.ref;

			// Add Id
			node.id = `note-${node.dataset.ref}`;

			// Get note content size
			let height = noteContent.scrollHeight;

			// Check the noteCall is still on screen
			let area = pageArea.querySelector(".pagedjs_page_content");
			let size = area.getBoundingClientRect();
			let right = size.left + size.width;

			// TODO: add a max height in CSS

			// Check element sizes
			let noteCallBounds = noteCall && noteCall.getBoundingClientRect();
			let noteAreaBounds = noteArea.getBoundingClientRect();

			// Get the @footnote margins
			let noteContentMargins = this.marginsHeight(noteContent);
			let noteContentPadding = this.paddingHeight(noteContent);
			let noteContentBorders = this.borderHeight(noteContent);
			let total = noteContentMargins + noteContentPadding + noteContentBorders;

			// Get the top of the @footnote area
			let notAreaTop = Math.floor(noteAreaBounds.top);
			// If the height isn't set yet, remove the margins from the top
			if (noteAreaBounds.height === 0) {
				notAreaTop -= this.marginsHeight(noteContent, false);
				notAreaTop -= this.paddingHeight(noteContent, false);
				notAreaTop -= this.borderHeight(noteContent, false);
			}
			// Determine the note call position and offset per policy
			let notePolicy = node.dataset.notePolicy;
			let noteCallPosition = 0;
			let noteCallOffset = 0;
			if (noteCall) {
				// Get the correct line bottom for super or sub styled callouts
				let prevSibling = noteCall.previousSibling;
				let range = new Range();
				if (prevSibling) {
					range.setStartBefore(prevSibling);
				} else {
					range.setStartBefore(noteCall);
				}
				range.setEndAfter(noteCall);
				let rangeBounds = range.getBoundingClientRect();
				noteCallPosition = rangeBounds.bottom;
				if (!notePolicy || notePolicy === "auto") {
					noteCallOffset = Math.ceil(rangeBounds.bottom);
				} else if (notePolicy === "line") {
					noteCallOffset = Math.ceil(rangeBounds.top);
				} else if (notePolicy === "block") {
					// Check that there is a previous element on the page
					let parentParagraph = noteCall.closest("p").previousElementSibling;
					if (parentParagraph) {
						noteCallOffset = Math.ceil(
							parentParagraph.getBoundingClientRect().bottom
						);
					} else {
						noteCallOffset = Math.ceil(rangeBounds.bottom);
					}
				}
			}

			let contentDelta = height + total - noteAreaBounds.height;
			// Space between the top of the footnotes area and the bottom of the footnote call
			let noteDelta = noteCallPosition ? notAreaTop - noteCallPosition : 0;
			// Space needed for the force a break for the policy of the footnote
			let notePolicyDelta = noteCallPosition ? Math.floor(noteAreaBounds.top) - noteCallOffset : 0;
			let hasNotes = noteArea.querySelector("[data-note='footnote']");
			if (needsNoteCall && noteCallBounds.left > right) {
				// Note is offscreen and will be chunked to the next page on overflow
				node.remove();
			} else if (!hasNotes && needsNoteCall && total > noteDelta) {
				// No space to add even the footnote area
				pageArea.style.setProperty("--pagedjs-footnotes-height", "0px");
				// Add a wrapper as this div is removed later
				let wrapperDiv = document.createElement("div");
				wrapperDiv.appendChild(node);
				// Push to the layout queue for the next page
				this.needsLayout.push(wrapperDiv);
			} else if (!needsNoteCall) {
				// Call was previously added, force adding footnote
				pageArea.style.setProperty(
					"--pagedjs-footnotes-height",
					`${height + total}px`
				);
			} else if (noteCallPosition < noteAreaBounds.top - contentDelta) {
				// the current note content will fit without pushing the call to the next page
				pageArea.style.setProperty(
					"--pagedjs-footnotes-height",
					`${height + noteContentMargins + noteContentBorders}px`
				);
			} else {
				// set height to just before note call
				pageArea.style.setProperty(
					"--pagedjs-footnotes-height",
					`${noteAreaBounds.height + notePolicyDelta}px`
				);
				noteInnerContent.style.height =
					noteAreaBounds.height + notePolicyDelta - total + "px";
			}
		}
	}

	createFootnoteCall(node) {
		this.mightLog(`Create footnote call ${node.id}`);
		if (1) {
			let parentElement = node.parentElement;
			let footnoteCall = document.createElement("a");
			for (const className of node.classList) {
				footnoteCall.classList.add(`${className}`);
			}

			footnoteCall.dataset.footnoteCall = node.dataset.ref;
			footnoteCall.dataset.ref = node.dataset.ref;

			// Increment for counters
			footnoteCall.dataset.dataCounterFootnoteIncrement = 1;

			// Add link
			footnoteCall.href = `#note-${node.dataset.ref}`;

			parentElement.insertBefore(footnoteCall, node);

			return footnoteCall;
		}
	}

	showBounds() {
		return true;
	}

	debugging() {
		return true;
	}

	mightLog(output) {
		if (this.debugging() && output) console.log(output);
	}

	outputBounds(bounds, description = '') {
		if (this.showBounds()) return `${description} ${bounds.left}-${bounds.right} / ${bounds.top}-${bounds.bottom}`;
	}

	outputBoundsOf(element, description) {
		return this.outputBounds(element.getBoundingClientRect(), description);
	}

	boundsComparisonDetail(parentElement, potentialChild) {
		return this.showBounds() ? `(${this.outputBoundsOf(parentElement)} vs ${this.outputBoundsOf(potentialChild)})` : '';
	}

	entirelyWithin(parentElement, potentialChild) {
		let parentBounds = parentElement.getBoundingClientRect();
		let potentialChildBounds = potentialChild.getBoundingClientRect();
		return (parentBounds.left <= potentialChildBounds.left &&
			parentBounds.right >= potentialChildBounds.right &&
			parentBounds.top <= potentialChildBounds.top &&
			parentBounds.bottom >= potentialChildBounds.bottom);
	}

	entirelyOutside(parentElement, potentialChild) {
		let parentBounds = parentElement.getBoundingClientRect();
		let potentialChildBounds = potentialChild.getBoundingClientRect();
		return (parentBounds.left >= potentialChildBounds.right ||
			parentBounds.right <= potentialChildBounds.left ||
			parentBounds.top >= potentialChildBounds.bottom ||
			parentBounds.bottom <= potentialChildBounds.top);
	}

	overlaps(parentBounds, potentialChildBounds) {
		return !this.entirelyWithin(parentBounds, potentialChildBounds) &&
			!this.entirelyOutside(parentBounds, potentialChildBounds);
	}

	overlapState(parentElement, potentialChild) {
		if (this.entirelyWithin(parentElement, potentialChild)) {
			return FOOTNOTES_CONTAINS;
		}
		else if(this.entirelyOutside(parentElement, potentialChild)) {
			return FOOTNOTES_NO_OVERLAP;
		}

		return FOOTNOTES_OVERLAPS_WITH;
	}

	overlapDescription(parentElement, potentialChild, parentDesc, childDesc) {
		let outcome = "overlaps with";

		if (this.entirelyWithin(parentElement, potentialChild)) {
			outcome = "entirely contains";
		}
		else if(this.entirelyOutside(parentElement, potentialChild)) {
			outcome = "has no overlap with";
		}

		return `${parentDesc} ${outcome} ${childDesc} ${this.boundsComparisonDetail(parentElement, potentialChild)}`;
	}

	getOverflow(rendered, bounds, source, layout) {
		let pageElement = rendered.closest(".pagedjs_page");
		let pageContent = rendered.closest(".pagedjs_page_content");
		let pageArea = pageElement.querySelector(".pagedjs_area");
		let noteArea = pageElement.querySelector(".pagedjs_footnote_area");
		let noteContent = noteArea.querySelector(".pagedjs_footnote_content");
		let noteInnerContent = noteArea.querySelector(".pagedjs_footnote_inner_content");

		let noteContentMargins = this.marginsHeight(noteContent);
		let noteContentPadding = this.paddingHeight(noteContent);
		let noteContentBorders = this.borderHeight(noteContent);

		// I know we're going to need to handle footnotes from a previous page.
		let origFootnotesOnPage;

		// Gather footnotes to potentially include on this page.
		// this.processFootnotes(rendered, this.footnotes, pageArea);
		let footnoteCalls = pageArea.children[0].querySelectorAll(`[data-footnote-call]`);
		this.moveDelayedFootnotesToPage(pageArea);
		this.moveFootnotesToPage(footnoteCalls, pageArea);
		if (footnoteCalls.length) {
			this.mightLog(`=== Start of getOverflow for page ${pageElement.id.substring(5)} ===`);
			this.mightLog(`${footnoteCalls.length} calls on the page.`);
			for (let numFootnotes=noteInnerContent.children.length; numFootnotes; numFootnotes--) {
				this.mightLog(`Number of footnotes: ${numFootnotes}`);
				if (numFootnotes < noteInnerContent.children.length) {
					if (!noteInnerContent.children[numFootnotes].getBoundingClientRect().height) {
						this.mightLog(`Footnote ${numFootnotes} has no height.`);
						continue;
					}

					noteInnerContent.children[numFootnotes].style.display = 'none';
				}

				this.mightLog(`>> ${numFootnotes} footnotes visible.`);

				noteContent.style.removeProperty("height");
				noteInnerContent.style.removeProperty("height");
				pageContent.style.removeProperty("height");

				let noteInnerContentBounds = noteInnerContent.getBoundingClientRect();
				let { height } = noteInnerContentBounds;

				let areaHeight = height + noteContentMargins + noteContentBorders + noteContentPadding;
				// Get the @footnote margins
				pageArea.style.setProperty("--pagedjs-footnotes-height", `${areaHeight}px`);

				let pageAreaHeight = pageArea.getBoundingClientRect().height;
				bounds.height = pageAreaHeight - areaHeight;
				pageContent.style.height = bounds.height + 'px';

				this.mightLog(`Page content height is page element height (${pageAreaHeight}) - footnote height (${areaHeight}) = ${pageAreaHeight - areaHeight}`);

				// Hide footnote content if empty
				if (noteInnerContent.childNodes.length === 0) {
					noteContent.classList.add("pagedjs_footnote_empty");
				}

				let noteContentBounds = noteContent.getBoundingClientRect();
				let { width } = noteContentBounds;

				noteInnerContent.style.columnWidth = Math.round(width) + "px";
				noteInnerContent.style.columnGap = "calc(var(--pagedjs-margin-right) + var(--pagedjs-margin-left))";

				this.mightLog(`Trying to display ${numFootnotes} footnotes.`);
				this.mightLog(this.outputBoundsOf(pageArea, `Bounding rectangle for page content:`));

				let contentArea = pageArea.children[0];
				this.mightLog(this.outputBoundsOf(contentArea, `Bounding rectangle for rendered content:`));

				let noteArea = pageArea.children[1];
				this.mightLog(this.outputBoundsOf(noteArea, `Bounding rectangle for footnote content:`));

				this.mightLog(this.overlapDescription(pageArea, contentArea, "Page area", "the main content"));
				this.mightLog(this.overlapDescription(contentArea, noteArea, "Main content", "the footnote area"));

				this.mightLog(`${footnoteCalls.length} footnote calls.`);

				let callsInPage = 0;

				Array.from(footnoteCalls).forEach((call, i) => {
					this.mightLog(this.overlapDescription(contentArea, call, `Page area bounds`, `call ${i}`));
					if (this.overlapState(contentArea, call) == FOOTNOTES_CONTAINS) {
						callsInPage++;
					}
				});

				this.mightLog(`Content area contains ${callsInPage} footnote calls.`);

				let footnotesOnPage = 0;

				Array.from(noteInnerContent.childNodes).forEach((note, i) => {
					let constrainingElement = rendered && rendered.parentNode; // this gets the element, instead of the wrapper for the width workaround
					if (constrainingElement.classList.contains("pagedjs_page_content")) {
						constrainingElement = rendered;
					}

					// Does this note overlap the content?
					let noteTextBounds = note.getBoundingClientRect();
					this.outputBounds(note.getBoundingClientRect(), `Bounding rectangle for call ${i} is:`);
					this.mightLog(this.overlapDescription(pageArea, note, "Page area", `footnote content ${i} (${note.dataset.id})`));

					if (this.overlapState(pageArea, note) == FOOTNOTES_CONTAINS) {
						footnotesOnPage++;
					}
				});

				this.mightLog(`Page contains ${footnotesOnPage} footnotes.`);
				if (origFootnotesOnPage == undefined) {
					origFootnotesOnPage = footnotesOnPage;
				}

				// Get overflow.
				// let layout = new Layout(noteArea, undefined, chunker.settings);
				// let overflowRanges = layout.findOverflow(noteInnerContent, noteContentBounds);
				this.mightLog(this.outputBounds(bounds, `Invoking layout.findOverflow for page with bounds`));
				let overflowRanges = layout.findOverflow(rendered, bounds, source, layout);

				if ((this.numDeferredFootnotes + callsInPage) < footnotesOnPage) {
					// Don't display footnotes for which the reference hasn't yet been seen.
					this.mightLog(`(${this.numDeferredFootnotes} deferred notes + ${callsInPage} calls on the page) < ${footnotesOnPage} footnotes on the page.`);
					continue;
				}

				this.callsDone += (footnotesOnPage - this.numDeferredFootnotes);
				this.mightLog(`*** Adding ${callsInPage} - ${footnotesOnPage} to deferred footnotes (previous value ${this.numDeferredFootnotes}).`);
				this.numDeferredFootnotes += callsInPage - footnotesOnPage;

				Array.from(noteInnerContent.childNodes).forEach((note, i) => {
					if (i < footnotesOnPage) {
						return;
					}

					let wrapperDiv = document.createElement("div");
					wrapperDiv.appendChild(note);
					this.needsLayout.push(wrapperDiv);
				});
				break;
			}
		}

		noteInnerContent.style.height = "auto";
		noteContent.style.removeProperty("height");
		noteInnerContent.style.removeProperty("height");
		pageContent.style.removeProperty("height");
	}

	handleAlignment(node) {
		let styles = window.getComputedStyle(node);
		let alignLast = styles["text-align-last"];
		node.dataset.lastSplitElement = "true";
		if (alignLast === "auto") {
			node.dataset.alignLastSplitElement = "justify";
		} else {
			node.dataset.alignLastSplitElement = alignLast;
		}
	}

	moveDelayedFootnotesToPage(pageArea) {
		if (1) {
			while (this.needsLayout.length) {
				let fragment = this.needsLayout.shift();

				Array.from(fragment.childNodes).forEach((node) => {
					node.style.removeProperty("display");
					this.moveFootnote(
						node,
						false,
						pageArea
					);
				});
			}
			this.numDeferredFootnotes = 0;
		}
	}

	moveFootnotesToPage(footnotes, pageArea) {
		if (0) {
			Array.from(footnotes).forEach((node) => {
				this.moveFootnote(
					node,
					true
				);
			});
		}
	}

	marginsHeight(element, total=true) {
		if (1) {
			let styles = window.getComputedStyle(element);
			let marginTop = parseInt(styles.marginTop);
			let marginBottom = parseInt(styles.marginBottom);
			let margin = 0;
			if (marginTop) {
				margin += marginTop;
			}
			if (marginBottom && total) {
				margin += marginBottom;
			}
			return margin;
		}
	}

	paddingHeight(element, total=true) {
		if (1) {
			let styles = window.getComputedStyle(element);
			let paddingTop = parseInt(styles.paddingTop);
			let paddingBottom = parseInt(styles.paddingBottom);
			let padding = 0;
			if (paddingTop) {
				padding += paddingTop;
			}
			if (paddingBottom && total) {
				padding += paddingBottom;
			}
			return padding;
		}
	}

	borderHeight(element, total=true) {
		if (1) {
			let styles = window.getComputedStyle(element);
			let borderTop = parseInt(styles.borderTop);
			let borderBottom = parseInt(styles.borderBottom);
			let borders = 0;
			if (borderTop) {
				borders += borderTop;
			}
			if (borderBottom && total) {
				borders += borderBottom;
			}
			return borders;
		}
	}
}

export default Footnotes;

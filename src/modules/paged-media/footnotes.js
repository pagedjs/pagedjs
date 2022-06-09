import Handler from "../handler.js";
import { isContainer, isElement } from "../../utils/dom.js";
import Layout from "../../chunker/layout.js";
import csstree from "css-tree";

class Footnotes extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.footnotes = {};
		this.needsLayout = [];
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

	afterParsed(parsed) {
		this.processFootnotes(parsed, this.footnotes);
	}

	processFootnotes(parsed, notes) {
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
			}
		}
	}

	processFootnoteContainer(node) {
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

	renderNode(node) {
		if (node.nodeType == 1) {
			// Get all notes
			let notes;

			// Ingnore html element nodes, like mathml
			if (!node.dataset) {
				return;
			}

			if (node.dataset.note === "footnote") {
				notes = [node];
			} else if (node.dataset.hasNotes || node.querySelectorAll("[data-note='footnote']")) {
				notes = node.querySelectorAll("[data-note='footnote']");
			}

			if (notes && notes.length) {
				this.findVisibleFootnotes(notes, node);
			}
		}
	}

	findVisibleFootnotes(notes, node) {
		let area, size, right;
		area = node.closest(".pagedjs_page_content");
		size = area.getBoundingClientRect();
		right = size.left + size.width;

		for (let i = 0; i < notes.length; ++i) {
			let currentNote = notes[i];
			let bounds = currentNote.getBoundingClientRect();
			let left = bounds.left;

			if (left < right) {
				// Add call for the note
				this.moveFootnote(currentNote, node.closest(".pagedjs_area"), true);
			}
		}
	}

	moveFootnote(node, pageArea, needsNoteCall) {
		// let pageArea = node.closest(".pagedjs_area");
		let noteArea = pageArea.querySelector(".pagedjs_footnote_area");
		let noteContent = noteArea.querySelector(".pagedjs_footnote_content");
		let noteInnerContent = noteContent.querySelector(".pagedjs_footnote_inner_content");

		if (!isElement(node)) {
			return;
		}

		// Add call for the note
		let noteCall;
		if (needsNoteCall) {
			noteCall = this.createFootnoteCall(node);
		}

		// Remove the break before attribute for future layout
		node.removeAttribute("data-break-before");

		// Check if note already exists for overflow
		let existing = noteInnerContent.querySelector(`[data-ref="${node.dataset.ref}"]`);
		if (existing) {
			// Remove the note from the flow but no need to render it again
			node.remove();
			return;
		}

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

	createFootnoteCall(node) {
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

	afterPageLayout(pageElement, page, breakToken, chunker) {
		let pageArea = pageElement.querySelector(".pagedjs_area");
		let noteArea = page.footnotesArea;
		let noteContent = noteArea.querySelector(".pagedjs_footnote_content");
		let noteInnerContent = noteArea.querySelector(".pagedjs_footnote_inner_content");

		let noteContentBounds = noteContent.getBoundingClientRect();
		let { width } = noteContentBounds;

		noteInnerContent.style.columnWidth = Math.round(width) + "px";
		noteInnerContent.style.columnGap = "calc(var(--pagedjs-margin-right) + var(--pagedjs-margin-left))";

		// Get overflow
		let layout = new Layout(noteArea, undefined, chunker.settings);
		let overflow = layout.findOverflow(noteInnerContent, noteContentBounds);

		if (overflow) {
			let { startContainer, startOffset } = overflow;
			let startIsNode;
			if (isElement(startContainer)) {
				let start = startContainer.childNodes[startOffset];
				startIsNode = isElement(start) && start.hasAttribute("data-footnote-marker");
			}

			let extracted = overflow.extractContents();

			if (!startIsNode) {
				let splitChild = extracted.firstElementChild;
				splitChild.dataset.splitFrom = splitChild.dataset.ref;

				this.handleAlignment(noteInnerContent.lastElementChild);
			}

			this.needsLayout.push(extracted);

			noteContent.style.removeProperty("height");
			noteInnerContent.style.removeProperty("height");

			let noteInnerContentBounds = noteInnerContent.getBoundingClientRect();
			let { height } = noteInnerContentBounds;

			// Get the @footnote margins
			let noteContentMargins = this.marginsHeight(noteContent);
			let noteContentPadding = this.paddingHeight(noteContent);
			let noteContentBorders = this.borderHeight(noteContent);
			pageArea.style.setProperty(
				"--pagedjs-footnotes-height",
				`${height + noteContentMargins + noteContentBorders + noteContentPadding}px`
			);

			// Hide footnote content if empty
			if (noteInnerContent.childNodes.length === 0) {
				noteContent.classList.add("pagedjs_footnote_empty");
			}

			if (!breakToken) {
				chunker.clonePage(page);
			} else {
				let breakBefore, previousBreakAfter;
				if (
					breakToken.node &&
					typeof breakToken.node.dataset !== "undefined" &&
					typeof breakToken.node.dataset.previousBreakAfter !== "undefined"
				) {
					previousBreakAfter = breakToken.node.dataset.previousBreakAfter;
				}

				if (
					breakToken.node &&
					typeof breakToken.node.dataset !== "undefined" &&
					typeof breakToken.node.dataset.breakBefore !== "undefined"
				) {
					breakBefore = breakToken.node.dataset.breakBefore;
				}

				if (breakBefore || previousBreakAfter) {
					chunker.clonePage(page);
				}
			}
		}
		noteInnerContent.style.height = "auto";
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

	beforePageLayout(page) {
		while (this.needsLayout.length) {
			let fragment = this.needsLayout.shift();

			Array.from(fragment.childNodes).forEach((node) => {
				this.moveFootnote(
					node,
					page.element.querySelector(".pagedjs_area"),
					false
				);
			});
		}
	}

	afterOverflowRemoved(removed, rendered) {
		// Find the page area
		let area = rendered.closest(".pagedjs_area");
		// Get any rendered footnotes
		let notes = area.querySelectorAll(".pagedjs_footnote_area [data-note='footnote']");
		for (let n = 0; n < notes.length; n++) {
			const note = notes[n];
			// Check if the call for that footnote has been removed with the overflow
			let call = removed.querySelector(`[data-footnote-call="${note.dataset.ref}"]`);
			if (call) {
				note.remove();
			}
		}
		// Hide footnote content if empty
		let noteInnerContent = area.querySelector(".pagedjs_footnote_inner_content");
		if (noteInnerContent && noteInnerContent.childNodes.length === 0) {
			noteInnerContent.parentElement.classList.add("pagedjs_footnote_empty");
		}
	}

	marginsHeight(element, total=true) {
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

	paddingHeight(element, total=true) {
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

	borderHeight(element, total=true) {
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

export default Footnotes;

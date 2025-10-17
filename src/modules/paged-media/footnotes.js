import Handler from "../handler.js";
import { isContainer, isElement, isText, walk } from "../../utils/dom.js";
import Layout from "../../chunker/layout.js";
import csstree from "css-tree";

/**
 * Handles the parsing, layout, and rendering of footnotes in paged content.
 *
 * Manages footnote policies, markers, calls, layout overflow, and alignment.
 * Extends the generic Handler class.
 */
class Footnotes extends Handler {
	/**
	 * Creates an instance of Footnotes.
	 * @param {object} chunker - The chunker instance handling content chunks.
	 * @param {object} polisher - The polisher instance handling polishing/layout.
	 * @param {object} caller - The caller instance managing handler orchestration.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/**
		 * Stores footnote selectors and their properties.
		 * @type {Object.<string, {selector: string, policy: string, display: string}>}
		 */
		this.footnotes = {};

		/**
		 * Array of DOM fragments that need layout recalculation.
		 * @type {Array<Node>}
		 */
		this.needsLayout = [];

		/**
		 * Array of footnote nodes that overflowed and are pending reinsertion.
		 * @type {Array<Element>}
		 */
		this.overflow = [];
	}

	/**
	 * Handles CSS declarations related to footnotes during parsing.
	 * Detects `float: footnote`, `footnote-policy`, and `footnote-display` properties.
	 *
	 * @param {object} declaration - The CSS declaration node.
	 * @param {object} dItem - Declaration item in the list.
	 * @param {object} dList - Declaration list.
	 * @param {object} rule - The CSS rule node.
	 */
	onDeclaration(declaration, dItem, dList, rule) {
		let property = declaration.property;
		if (property === "float") {
			let identifier =
				declaration.value.children && declaration.value.children.first();
			let location = identifier && identifier.name;
			if (location === "footnote") {
				let selector = csstree.generate(rule.ruleNode.prelude);
				this.footnotes[selector] = {
					selector: selector,
					policy: "auto",
					display: "block",
				};
				dList.remove(dItem);
			}
		}
		if (property === "footnote-policy") {
			let identifier =
				declaration.value.children && declaration.value.children.first();
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
			let identifier =
				declaration.value.children && declaration.value.children.first();
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

	/**
	 * Transforms pseudo selectors `::footnote-marker` and `::footnote-call`
	 * into attribute selectors with pseudo-elements to enable footnote rendering.
	 *
	 * @param {object} pseudoNode - The pseudo selector node.
	 * @param {object} pItem - The item in pseudo selector list.
	 * @param {object} pList - The pseudo selector list.
	 * @param {string} selector - The full selector string.
	 * @param {object} rule - The CSS rule node.
	 */
	onPseudoSelector(pseudoNode, pItem, pList, selector, rule) {
		let name = pseudoNode.name;
		if (name === "footnote-marker") {
			let prelude = rule.ruleNode.prelude;
			let newPrelude = new csstree.List();

			prelude.children.first().children.each((node) => {
				if (node.type !== "PseudoElementSelector") {
					newPrelude.appendData(node);
				}
			});

			newPrelude.appendData({
				type: "AttributeSelector",
				name: {
					type: "Identifier",
					name: "data-footnote-marker",
				},
				flags: null,
				loc: null,
				matcher: null,
				value: null,
			});

			newPrelude.appendData({
				type: "PseudoElementSelector",
				name: "marker",
				loc: null,
				children: null,
			});

			prelude.children.first().children = newPrelude;
		}

		if (name === "footnote-call") {
			let prelude = rule.ruleNode.prelude;
			let newPrelude = new csstree.List();

			prelude.children.first().children.each((node) => {
				if (node.type !== "PseudoElementSelector") {
					newPrelude.appendData(node);
				}
			});

			newPrelude.appendData({
				type: "AttributeSelector",
				name: {
					type: "Identifier",
					name: "data-footnote-call",
				},
				flags: null,
				loc: null,
				matcher: null,
				value: null,
			});

			newPrelude.appendData({
				type: "PseudoElementSelector",
				name: "after",
				loc: null,
				children: null,
			});

			prelude.children.first().children = newPrelude;
		}
	}

	/**
	 * After parsing, processes and applies footnote attributes to matching elements.
	 *
	 * @param {Document} parsed - The parsed DOM document or fragment.
	 */
	afterParsed(parsed) {
		this.processFootnotes(parsed, this.footnotes);
	}

	/**
	 * Finds elements matching footnote selectors and adds footnote attributes.
	 * Also marks their container parents with data attributes to indicate presence of notes.
	 *
	 * @param {Document|Element} parsed - The root parsed element.
	 * @param {Object} notes - The footnotes configuration object.
	 */
	processFootnotes(parsed, notes) {
		for (let n in notes) {
			let elements = parsed.querySelectorAll(n);
			let element;
			let note = notes[n];
			for (var i = 0; i < elements.length; i++) {
				element = elements[i];
				element.setAttribute("data-note", "footnote");
				element.setAttribute("data-break-before", "avoid");
				element.setAttribute("data-note-policy", note.policy || "auto");
				element.setAttribute("data-note-display", note.display || "block");
				this.processFootnoteContainer(element);
			}
		}
	}

	/**
	 * Walks up the DOM from a footnote element to find its container.
	 * Marks the closest container or last element with 'data-has-notes' attribute.
	 *
	 * @param {Element} node - The footnote element.
	 */
	processFootnoteContainer(node) {
		let element = node.parentElement;
		let prevElement = element;
		while (element) {
			if (isContainer(element)) {
				prevElement.setAttribute("data-has-notes", "true");
				break;
			}
			prevElement = element;
			element = element.parentElement;
			if (!element) {
				prevElement.setAttribute("data-has-notes", "true");
			}
		}
	}

	/**
	 * Processes a node during rendering to find and handle footnotes within it.
	 *
	 * @param {Node} node - The DOM node to render.
	 */
	renderNode(node) {
		if (node.nodeType == 1) {
			let notes;

			if (!node.dataset) {
				return;
			}

			if (node.dataset.note === "footnote") {
				notes = [node];
			} else if (
				node.dataset.hasNotes ||
				node.querySelectorAll("[data-note='footnote']")
			) {
				notes = node.querySelectorAll("[data-note='footnote']");
			}

			if (notes && notes.length) {
				this.findVisibleFootnotes(notes, node);
			}
		}
	}

	/**
	 * Finds visible footnotes within a node and moves them into the footnote area.
	 *
	 * @param {NodeListOf<Element>} notes - List of footnote elements.
	 * @param {Element} node - The container node to check visibility against.
	 */
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
				this.moveFootnote(currentNote, node.closest(".pagedjs_area"), true);
			}
		}
	}

	/**
	 * Recalculates the height of footnote content and adjusts page CSS variables
	 * to ensure proper layout according to footnote policy and overflow.
	 *
	 * @param {Element} node - The footnote node.
	 * @param {Element} noteContent - The container of footnote content.
	 * @param {Element} pageArea - The page area element.
	 * @param {Element|null} noteCall - The footnote call element.
	 * @param {boolean} needsNoteCall - Whether the footnote call should be rendered.
	 */

	recalcFootnotesHeight(node, noteContent, pageArea, noteCall, needsNoteCall) {
		// Remove empty class
		if (noteContent.classList.contains("pagedjs_footnote_empty")) {
			noteContent.classList.remove("pagedjs_footnote_empty");
		}

		// Get note content size
		let height = noteContent.scrollHeight;

		// Check the noteCall is still on screen
		let area = pageArea.querySelector(".pagedjs_page_content");
		let size = area.getBoundingClientRect();
		let right = size.left + size.width;

		// TODO: add a max height in CSS

		// Check element sizes
		let noteCallBounds = noteCall && noteCall.getBoundingClientRect();
		let noteArea = pageArea.querySelector(".pagedjs_footnote_area");
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
						parentParagraph.getBoundingClientRect().bottom,
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
		let notePolicyDelta = noteCallPosition
			? Math.floor(noteAreaBounds.top) - noteCallOffset
			: 0;
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
				`${height + total}px`,
			);
		} else if (noteCallPosition < noteAreaBounds.top - contentDelta) {
			// the current note content will fit without pushing the call to the next page
			pageArea.style.setProperty(
				"--pagedjs-footnotes-height",
				`${height + noteContentMargins + noteContentBorders}px`,
			);
		} else if (notePolicyDelta > 0) {
			// set height to just before note call
			pageArea.style.setProperty(
				"--pagedjs-footnotes-height",
				`${noteAreaBounds.height + notePolicyDelta}px`,
			);
			let noteInnerContent = noteContent.querySelector(
				".pagedjs_footnote_inner_content",
			);
			noteInnerContent.style.height =
				noteAreaBounds.height + notePolicyDelta - total + "px";
		}
	}

	/**
	 * Moves a footnote node to the footnote area of a given page.
	 * @param {Element} node - The footnote element to move.
	 * @param {Element} pageArea - The page container element containing footnotes.
	 * @param {boolean} needsNoteCall - Whether a footnote call link should be created.
	 * @returns {void}
	 */
	moveFootnote(node, pageArea, needsNoteCall) {
		// let pageArea = node.closest(".pagedjs_area");
		let noteArea = pageArea.querySelector(".pagedjs_footnote_area");
		let noteContent = noteArea.querySelector(".pagedjs_footnote_content");
		let noteInnerContent = noteContent.querySelector(
			".pagedjs_footnote_inner_content",
		);

		if (!isElement(node)) {
			return;
		}

		// Add call for the note but only if it's not overflow.
		// If it is overflow, the parentElement will be null.
		let noteCall;
		if (needsNoteCall) {
			if (node.parentElement) {
				noteCall = this.createFootnoteCall(node);
			} else {
				let ref = node.dataset["ref"];
				noteCall = pageArea.querySelector(`[data-ref="${ref}"]`);
			}
		}

		// Remove the break before attribute for future layout
		node.removeAttribute("data-break-before");

		// Check if note already exists for overflow
		let existing = noteInnerContent.querySelector(
			`[data-ref="${node.dataset.ref}"]`,
		);
		if (existing) {
			// Remove the note from the flow but no need to render it again
			node.remove();
			return;
		}

		// Add the note node
		noteInnerContent.appendChild(node);

		// Add marker
		node.dataset.footnoteMarker = node.dataset.ref;

		// Add Id
		node.id = `note-${node.dataset.ref}`;

		this.recalcFootnotesHeight(
			node,
			noteContent,
			pageArea,
			noteCall,
			needsNoteCall,
		);
	}

	/**
	 * Creates a footnote call (link) element that points to the footnote.
	 * @param {Element} node - The footnote element to create a call for.
	 * @returns {HTMLAnchorElement} The created footnote call anchor element.
	 */
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

	/**
	 * Called after the page layout is complete to handle footnote overflow and layout.
	 * @param {Element} pageElement - The page's root element in the DOM.
	 * @param {Object} page - The page object containing footnotes and layout info.
	 * @param {Object|null} breakToken - The token representing a page break, if any.
	 * @param {Object} chunker - The chunker instance managing page chunks.
	 * @returns {void}
	 */
	afterPageLayout(pageElement, page, breakToken, chunker) {
		let pageArea = pageElement.querySelector(".pagedjs_area");
		let noteArea = page.footnotesArea;
		let noteContent = noteArea.querySelector(".pagedjs_footnote_content");
		let noteInnerContent = noteArea.querySelector(
			".pagedjs_footnote_inner_content",
		);

		let noteContentBounds = noteContent.getBoundingClientRect();
		let { width } = noteContentBounds;

		noteInnerContent.style.columnWidth = Math.round(width) + "px";
		noteInnerContent.style.columnGap =
			"calc(var(--pagedjs-margin-right) + var(--pagedjs-margin-left))";

		// Get overflow
		let layout = new Layout(noteArea, undefined, chunker.settings);
		let overflow = layout.findOverflow(noteInnerContent, noteContentBounds);

		if (overflow) {
			let { startContainer, startOffset } = overflow;
			let extracted;
			let footnoteContainer = isText(startContainer)
				? startContainer.parentElement.closest("[data-footnote-marker]")
				: startContainer.closest("[data-footnote-marker]");
			let notEntireNote = !footnoteContainer || startOffset;
			if (!notEntireNote) {
				let pos = startContainer;
				while (pos && pos !== footnoteContainer) {
					pos = pos.previousSibling || pos.parentNode;
					if (isText(pos)) {
						notEntireNote = true;
						break;
					}
				}
			}

			if (notEntireNote) {
				// Assuming overflow is not multipart.
				extracted = overflow.extractContents();

				let splitChild = extracted.firstElementChild;

				// Add any DOM structure above this node, but remove any text
				// content from it.
				// Assumes the footnote content is not anything complicated enough
				// to need the more complicated handling that we do for the main
				// content.
				let parentRange = document.createRange();
				parentRange.selectNode(footnoteContainer);
				parentRange.setEndAfter(footnoteContainer);
				let cloned = parentRange.cloneContents();
				let walker = walk(cloned.firstChild, cloned);

				let toDelete = undefined;
				let next, pos, replacePos, done;
				while (!done) {
					if (isElement(pos)) {
						if (pos.dataset.ref == splitChild?.dataset.ref) {
							replacePos = pos;
						}

						if (pos.dataset.footnoteMarker) {
							// Make sure counter isn't incremented and no new marker id rendered.
							pos.dataset.splitFrom = true;
							delete pos.dataset.footnoteMarker;
						}
					}
					next = walker.next();
					pos = next.value;
					done = next.done;

					if (toDelete) {
						toDelete.remove();
						toDelete = undefined;
					}
					if (isText(pos)) {
						toDelete = pos;
						replacePos = pos.parentElement;
					}
				}

				if (splitChild) {
					splitChild.dataset.splitFrom = splitChild.dataset.ref;
					replacePos.parentNode.replaceChild(extracted, replacePos);
				} else {
					replacePos.appendChild(extracted);
				}

				extracted = cloned;

				this.handleAlignment(noteInnerContent.lastElementChild);
			} else {
				// Adjust the range to take the entire footnote.
				let range = document.createRange();
				range.selectNode(footnoteContainer);
				range.setEndAfter(footnoteContainer);
				extracted = range.extractContents();
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
				`${height + noteContentMargins + noteContentBorders + noteContentPadding}px`,
			);

			// Hide footnote content if empty
			if (noteInnerContent.childNodes.length === 0) {
				noteContent.classList.add("pagedjs_footnote_empty");
			}

			if (!breakToken) {
				chunker.clonePage(page);
			} else {
				let breakBefore, previousBreakAfter;
				let firstOverflowNode = breakToken.overflow?.node;
				if (
					firstOverflowNode &&
					typeof firstOverflowNode.dataset !== "undefined" &&
					typeof firstOverflowNode.dataset.previousBreakAfter !== "undefined"
				) {
					previousBreakAfter = firstOverflowNode.dataset.previousBreakAfter;
				}

				if (
					firstOverflowNode &&
					typeof firstOverflowNode.dataset !== "undefined" &&
					typeof firstOverflowNode.dataset.breakBefore !== "undefined"
				) {
					breakBefore = firstOverflowNode.dataset.breakBefore;
				}

				if (breakBefore || previousBreakAfter) {
					chunker.clonePage(page);
				}
			}
		}
		noteInnerContent.style.height = "auto";
	}

	/**
	 * Handles alignment properties for the last split footnote element.
	 * @param {Element} node - The footnote element to apply alignment on.
	 * @returns {void}
	 */

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

	/**
	 * Called before laying out a page, to process any pending footnotes that need moving.
	 * @param {Object} page - The page object containing DOM and layout data.
	 * @returns {void}
	 */
	beforePageLayout(page) {
		while (this.needsLayout.length) {
			let fragment = this.needsLayout.shift();

			Array.from(fragment.childNodes).forEach((node) => {
				this.moveFootnote(
					node,
					page.element.querySelector(".pagedjs_area"),
					false,
				);
			});
		}
	}

	/**
	 * Called after overflow content is removed; updates footnotes accordingly.
	 * @param {Element} removed - The DOM fragment containing removed overflow nodes.
	 * @param {Element} rendered - The DOM element where content is currently rendered.
	 * @returns {void}
	 */
	afterOverflowRemoved(removed, rendered) {
		// Find the page area
		let area = rendered.closest(".pagedjs_area");
		if (!area) {
			return;
		}

		// Get any rendered footnotes
		let notes = area.querySelectorAll(
			".pagedjs_footnote_area [data-note='footnote']",
		);
		for (let n = 0; n < notes.length; n++) {
			const note = notes[n];
			// Check if the call for that footnote has been removed with the overflow
			let call = removed.querySelector(
				`[data-footnote-call="${note.dataset.ref}"]`,
			);
			if (call) {
				note.remove();
				this.overflow.push(note);
			}
		}
		// Hide footnote content if empty
		let noteInnerContent = area.querySelector(
			".pagedjs_footnote_inner_content",
		);
		if (noteInnerContent && noteInnerContent.childNodes.length === 0) {
			noteInnerContent.parentElement.classList.add("pagedjs_footnote_empty");
		}
	}

	/**
	 * Called after overflow content is added; reattaches footnotes and recalculates heights.
	 * @param {Element} rendered - The DOM element where new content has been rendered.
	 * @returns {void}
	 */
	afterOverflowAdded(rendered) {
		let notes = rendered.querySelectorAll("[data-note='footnote']");
		if (notes && notes.length) {
			this.findVisibleFootnotes(notes, rendered);
		}

		let area = rendered.closest(".pagedjs_area");
		let noteContent = area.querySelector(".pagedjs_footnote_content");
		let notesInnerContent = area.querySelector(
			".pagedjs_footnote_inner_content",
		);

		if (this.overflow.length) {
			this.overflow.forEach((item) => {
				notesInnerContent.appendChild(item);
				let call = rendered.querySelector(
					`[data-ref="${item.dataset["ref"]}"]`,
				);
				this.recalcFootnotesHeight(item, noteContent, area, call, false);
			});

			this.overflow = [];
		}
	}

	/**
	 * Calculates the total vertical margin height of an element.
	 * @param {Element} element - The DOM element to calculate margin height for.
	 * @param {boolean} [total=true] - Whether to include bottom margin in the total.
	 * @returns {number} The sum of the top (and optionally bottom) margin in pixels.
	 */
	marginsHeight(element, total = true) {
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

	/**
	 * Calculates the total vertical padding height of an element.
	 * @param {Element} element - The DOM element to calculate padding height for.
	 * @param {boolean} [total=true] - Whether to include bottom padding in the total.
	 * @returns {number} The sum of the top (and optionally bottom) padding in pixels.
	 */
	paddingHeight(element, total = true) {
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

	/**
	 * Calculates the total vertical border height of an element.
	 * @param {Element} element - The DOM element to calculate border height for.
	 * @param {boolean} [total=true] - Whether to include bottom border in the total.
	 * @returns {number} The sum of the top (and optionally bottom) border width in pixels.
	 */
	borderHeight(element, total = true) {
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

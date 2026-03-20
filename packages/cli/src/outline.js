// Adapted from asciidoctor-web-pdf for HTML documents
// https://github.com/Mogztter/asciidoctor-web-pdf/blob/0a27de7423f12fe1f8b5ff7bcb720b786fb63e5b/lib/outline.js
import { PDFDict, PDFName, PDFNumber, PDFHexString } from "pdf-lib";
import { decode as htmlEntitiesDecode } from "html-entities";

const SanitizeXMLRx = /<[^>]+>/g;

function sanitize (string) {
	if (string.includes("<")) {
		string = string.replace(SanitizeXMLRx, "");
	}
	return htmlEntitiesDecode(string);
}

async function parseOutline(page, tags, enableWarnings) {
	return await page.evaluate((tags) => {
		const tagsToProcess = [];
		for (const node of document.querySelectorAll(tags.join(","))) {
			tagsToProcess.push(node);
		}
		tagsToProcess.reverse();

		const root = {children: [], depth: -1};
		let currentOutlineNode = root;

		const linkHolder = document.createElement("div");
		const body = document.querySelector("body");
		linkHolder.style.display = "none";
		body.insertBefore(linkHolder, body.firstChild);

		while (tagsToProcess.length > 0) {
			const tag = tagsToProcess.pop();
			const orderDepth = tags.indexOf(tag.tagName.toLowerCase());
			const dest = encodeURIComponent(tag.id).replace(/%/g, "#25");

			// Add to link holder to register a destination
			const hiddenLink = document.createElement("a");
			hiddenLink.href = "#"+dest;
			linkHolder.appendChild(hiddenLink);

			if (orderDepth < currentOutlineNode.depth) {
				currentOutlineNode = currentOutlineNode.parent;
				tagsToProcess.push(tag);
			} else {
				const newNode = {
					title: tag.innerText.trim(),
					// encode section ID until https://bugs.chromium.org/p/chromium/issues/detail?id=985254 is fixed
					destination: dest,
					children: [],
					depth: orderDepth,
				};
				if (orderDepth == currentOutlineNode.depth) {
					if (currentOutlineNode.parent) {
						newNode.parent = currentOutlineNode.parent;
						currentOutlineNode.parent.children.push(newNode);
					} else {
						newNode.parent = currentOutlineNode;
						currentOutlineNode.children.push(newNode);
					}
					currentOutlineNode = newNode;
				} else if (orderDepth > currentOutlineNode.depth) {
					newNode.parent = currentOutlineNode;
					currentOutlineNode.children.push(newNode);
					currentOutlineNode = newNode;
				}
			}
		}

		const stripParentProperty = (node) => {
			node.parent = undefined;
			for (const child of node.children) {
				stripParentProperty(child);
			}
		};
		stripParentProperty(root);
		return root.children;
	}, tags);
}

function setRefsForOutlineItems (layer, context, parentRef) {
	for (const item of layer) {
		item.ref = context.nextRef();
		item.parentRef = parentRef;
		setRefsForOutlineItems(item.children, context, item.ref);
	}
}

function countChildrenOfOutline (layer) {
	let count = 0;
	for (const item of layer) {
		++count;
		count += countChildrenOfOutline(item.children);
	}
	return count;
}

function buildPdfObjectsForOutline (layer, context) {
	for (const [i, item] of layer.entries()) {
		const prev = layer[i - 1];
		const next = layer[i + 1];

		const pdfObject = new Map([
			[PDFName.of("Title"), PDFHexString.fromText(sanitize(item.title))],
			[PDFName.of("Dest"), PDFName.of(item.destination)],
			[PDFName.of("Parent"), item.parentRef]
		]);
		if (prev) {
			pdfObject.set(PDFName.of("Prev"), prev.ref);
		}
		if (next) {
			pdfObject.set(PDFName.of("Next"), next.ref);
		}
		if (item.children.length > 0) {
			pdfObject.set(PDFName.of("First"), item.children[0].ref);
			pdfObject.set(PDFName.of("Last"), item.children[item.children.length - 1].ref);
			pdfObject.set(PDFName.of("Count"), PDFNumber.of(countChildrenOfOutline(item.children)));
		}

		context.assign(item.ref, PDFDict.fromMapWithContext(pdfObject, context));

		buildPdfObjectsForOutline(item.children, context);
	}
}

function generateWarningsAboutMissingDestinations (layer, pdfDoc) {
	const dests = pdfDoc.context.lookup(pdfDoc.catalog.get(PDFName.of("Dests")));
	// Dests can be undefined if the PDF wasn't successfully generated (for instance if Paged.js threw an exception)
	if (dests) {
		const validDestinationTargets = dests.entries().map(([key, _]) => key.value());
		for (const item of layer) {
			if (item.destination && !validDestinationTargets.includes("/" + item.destination)) {
				console.warn(`Unable to find destination "${item.destination}" while generating PDF outline.`);
			}
			generateWarningsAboutMissingDestinations(item.children, pdfDoc);
		}
	}
}

async function setOutline (pdfDoc, outline, enableWarnings=false) {
	const context = pdfDoc.context;
	const outlineRef = context.nextRef();

	if (outline.length === 0) {
		return pdfDoc;
	}

	if (enableWarnings) {
		generateWarningsAboutMissingDestinations(outline, pdfDoc);
	}

	setRefsForOutlineItems(outline, context, outlineRef);
	buildPdfObjectsForOutline(outline, context);

	const outlineObject = PDFDict.fromMapWithContext(new Map([
		[PDFName.of("First"), outline[0].ref],
		[PDFName.of("Last"), outline[outline.length - 1].ref],
		[PDFName.of("Count"), PDFNumber.of(countChildrenOfOutline(outline))]
	]), context);
	context.assign(outlineRef, outlineObject);

	pdfDoc.catalog.set(PDFName.of("Outlines"), outlineRef);
	return pdfDoc;
}

export {
	parseOutline,
	setOutline
};
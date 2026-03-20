export function setTrimBoxes(pdfDoc, pages) {
	const pdfPages = pdfDoc.getPages();

	pdfPages.forEach((pdfPage, index) => {
		const page = pages[index];

		if (!page) {
			return; // page was not rendered
		}

		let { boxes } = page;

		if (Object.is(boxes.media, boxes.crop)) {
			return; // No bleed set
		}

		pdfPage.setTrimBox(boxes.crop.x,
			boxes.crop.y, 
			boxes.crop.width + boxes.crop.x,
			boxes.crop.height + boxes.crop.y);
	});
}

export function setMetadata(pdfDoc, meta) {
	if (meta.keywords && typeof meta.keywords === "string") {
		meta.keywords = meta.keywords.split(",");
	}

	if (!meta.keywords) {
		meta.keywords = [];
	}

	// Overwrite Dates
	if (!(meta.creationDate instanceof Date)) {
		meta.creationDate = new Date();
	}
	meta.modDate = new Date();
	meta.metadataDate = new Date();

	// Get the existing Info
	if (!meta.creator) {
		let creator = pdfDoc.getCreator();
		meta.creator = creator + " + Paged.js";
	}

	if (!meta.producer) {
		let producer = pdfDoc.getProducer();
		meta.producer = producer;
	}

	if (meta.title) {
		pdfDoc.setTitle(meta.title);
	}

	if (meta.subject) {
		pdfDoc.setSubject(meta.subject);
	}

	if (meta.keywords && meta.keywords.length) {
		pdfDoc.setKeywords(meta.keywords);
	}

	if (meta.author) {
		pdfDoc.setAuthor(meta.author);
	}

	if (meta.creationDate) {
		pdfDoc.setCreationDate(meta.creationDate);
	}

	if (meta.modDate) {
		pdfDoc.setModificationDate(meta.modDate);
	}

	if (meta.creator) {
		pdfDoc.setCreator(meta.creator);
	}

	if (meta.producer) {
		pdfDoc.setProducer(meta.producer);
	}
}
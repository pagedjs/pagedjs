import { toMatchImageSnapshot } from "jest-image-snapshot";
import { pdf } from "pdf-to-img";

async function toMatchPDFSnapshot(received, page = 1) {
	const doc = await pdf(received, { scale: 2 });

	let pageIndex = 0;
	let pdfImage;
	for await (const image of doc) {
		pageIndex++;
		if (pageIndex === page) {
			pdfImage = image;
			break;
		}
	}

	if (!pdfImage) {
		return {
			pass: false,
			message: () => `PDF does not have page ${page}`,
		};
	}

	return toMatchImageSnapshot.apply(this, [pdfImage, {}]);
}

export default toMatchPDFSnapshot;

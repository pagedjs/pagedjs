import { pdf } from "pdf-to-img";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import path from "path";

function platformToOS(platform) {
	switch (platform) {
		case "darwin":
			return "mac";
		case "win32":
			return "windows";
		default:
			return "linux";
	}
}

export async function toMatchPDFSnapshot(received, page = 1) {
	const doc = await pdf(received, { scale: 2 });
	const pdfImage = await doc.getPage(page);

	const dirname = path.dirname(this.testPath);
	const config = {
		customSnapshotsDir: path.join(dirname, `__image_snapshots_${platformToOS(process.platform)}__`),
	};

	return toMatchImageSnapshot.call(this, pdfImage, config);
}

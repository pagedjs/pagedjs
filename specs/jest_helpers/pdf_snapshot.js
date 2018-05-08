const { toMatchImageSnapshot } = require('jest-image-snapshot');
const path = require('path');
const gs = require('ghostscript4js')
const fs = require('fs');
const rimraf = require('rimraf');
const { DEBUG } = require('./constants');

function toMatchPDFSnapshot(received, page=1) {
	let pdfImage;
	let dirname = path.dirname(this.testPath);
	let pdfPath = path.join(dirname, './output.pdf');
	let imagePath = path.join(dirname, './output.png');

	fs.writeFileSync(pdfPath, received);

	try {
		// create image
		gs.executeSync(`-dFirstPage=${page} -dLastPage=${page} -sDEVICE=pngalpha -o ${imagePath} -sDEVICE=pngalpha -r144 ${pdfPath}`)
		// load image
		pdfImage = fs.readFileSync(imagePath);
		// remove output
		if (!DEBUG) {
			rimraf.sync(imagePath);
			rimraf.sync(pdfPath);
		}
	} catch (err) {
		throw err
	}

	return toMatchImageSnapshot.apply(this, [pdfImage])
}

module.exports = toMatchPDFSnapshot;

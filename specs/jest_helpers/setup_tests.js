const { toMatchImageSnapshot } = require('jest-image-snapshot');
const toMatchPDFSnapshot = require('./pdf_snapshot.js');

expect.extend({ toMatchImageSnapshot, toMatchPDFSnapshot });

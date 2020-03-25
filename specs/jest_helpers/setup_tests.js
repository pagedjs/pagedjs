const { toMatchImageSnapshot } = require('jest-image-snapshot');
const toMatchPDFSnapshot = require('./pdf_snapshot.js');
const expect = require('expect');

expect.extend({ toMatchImageSnapshot, toMatchPDFSnapshot });

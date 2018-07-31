export default `
:root {
  --width: 8.5in;
  --height: 11in;
  --margin-top: 1in;
  --margin-right: 1in;
  --margin-bottom: 1in;
  --margin-left: 1in;
  --page-count: 0;
}

@page {
  size: letter;
  margin: 0;
}

.pagedjs_page {
  box-sizing: border-box;
  width: var(--width);
  height: var(--height);
  overflow: hidden;
  position: relative;
  display: grid;
  grid-template-columns: [left] var(--margin-left) [center] calc(var(--width) - var(--margin-left) - var(--margin-right)) [right] var(--margin-right);
  grid-template-rows: [header] var(--margin-top) [page] calc(var(--height) - var(--margin-top) - var(--margin-bottom)) [footer] var(--margin-bottom);
}

.pagedjs_page * {
  box-sizing: border-box;
}

.pagedjs_margin-top {
  width: calc(var(--width) - var(--margin-left) - var(--margin-right));
  height: var(--margin-top);
  display: flex;
  grid-column: center;
  grid-row: header;
  flex-wrap: nowrap;
}

.pagedjs_margin-top-left-corner-holder {
  width: var(--margin-left);
  height: var(--margin-top);
  display: flex;
  grid-column: left;
  grid-row: header;
}

.pagedjs_margin-top-right-corner-holder {
  width: var(--margin-right);
  height: var(--margin-top);
  display: flex;
  grid-column: right;
  grid-row: header;
}

.pagedjs_margin-top-left-corner {
  width: var(--margin-left);
}

.pagedjs_margin-top-right-corner {
  width: var(--margin-right);
}

.pagedjs_margin-top > div {
  flex-grow: 1;
  position: relative;
}

.pagedjs_margin-right {
  height: calc(var(--height) - var(--margin-top) - var(--margin-bottom));
  width: var(--margin-right);
  display: flex;
  flex-direction: column;
  right: 0;
  grid-column: right;
  grid-row: page;
}

.pagedjs_margin-right > div {
  flex-grow: 1;
  position: relative;
}

.pagedjs_margin-bottom {
  width: calc(var(--width) - var(--margin-left) - var(--margin-right));
  height: var(--margin-bottom);
  display: flex;
  grid-column: center;
  grid-row: footer;
  flex-wrap: nowrap;
}

.pagedjs_margin-bottom-left-corner-holder {
  width: var(--margin-left);
  height: var(--margin-bottom);
  display: flex;
  grid-column: left;
  grid-row: footer;
}

.pagedjs_margin-bottom-right-corner-holder {
  width: var(--margin-right);
  height: var(--margin-bottom);
  display: flex;
  grid-column: right;
  grid-row: footer;
}

.pagedjs_margin-bottom-left-corner {
  width: var(--margin-left);
}

.pagedjs_margin-bottom-right-corner {
  width: var(--margin-right);
}

.pagedjs_margin-bottom > div {
  flex-grow: 1;
  position: relative;
}

.pagedjs_margin-left {
  height: calc(var(--height) - var(--margin-top) - var(--margin-bottom));
  width: var(--margin-left);
  display: flex;
  flex-direction: column;
  grid-column: left;
  grid-row: page;
}

.pagedjs_margin-left > div {
  flex-grow: 1;
  position: relative;
}

.pagedjs_page .pagedjs_margin.hasContent {
  display: flex;
}

.pagedjs_page .pagedjs_margin.emptyBalance {
  display: flex;
  visibility: hidden;
}

.pagedjs_page > .pagedjs_area {
  grid-column: center;
  grid-row: page;
  width: 100%;
  height: 100%;
}

.pagedjs_page > .pagedjs_area > .pagedjs_page_content {
  width: 100%;
  height: 100%;
  position: relative;
  column-fill: auto;
}

.pagedjs_page {
  counter-increment: page;
}

.pagedjs_pages {
  counter-reset: pages var(--page-count);
}

.pagedjs_page .pagedjs_margin-top-left,
.pagedjs_page .pagedjs_margin-top-right,
.pagedjs_page .pagedjs_margin-bottom-left,
.pagedjs_page .pagedjs_margin-bottom-right {
  height: 100%;
  display: none;
  align-items: center;
  flex: 2 1 0;
}

.pagedjs_page .pagedjs_margin-top-center,
.pagedjs_page .pagedjs_margin-bottom-center {
  height: 100%;
  display: none;
  align-items: center;
  flex: 1 0 auto;
  margin: 0 auto;
}

.pagedjs_page .pagedjs_margin-top-left-corner,
.pagedjs_page .pagedjs_margin-top-right-corner,
.pagedjs_page .pagedjs_margin-bottom-right-corner,
.pagedjs_page .pagedjs_margin-bottom-left-corner {
  display: none;
  align-items: center;
}

.pagedjs_page .pagedjs_margin-left-top,
.pagedjs_page .pagedjs_margin-right-top {
  display: none;
  align-items: flex-start;
}

.pagedjs_page .pagedjs_margin-right-middle,
.pagedjs_page .pagedjs_margin-left-middle {
  display: none;
  align-items: center;
}

.pagedjs_page .pagedjs_margin-left-bottom,
.pagedjs_page .pagedjs_margin-right-bottom {
  display: none;
  align-items: flex-end;
}

.pagedjs_page .pagedjs_margin-top-left,
.pagedjs_page .pagedjs_margin-top-right-corner,
.pagedjs_page .pagedjs_margin-bottom-left,
.pagedjs_page .pagedjs_margin-bottom-right-corner { text-align: left; }

.pagedjs_page .pagedjs_margin-top-left-corner,
.pagedjs_page .pagedjs_margin-top-right,
.pagedjs_page .pagedjs_margin-bottom-left-corner,
.pagedjs_page .pagedjs_margin-bottom-right { text-align: right; }

.pagedjs_page .pagedjs_margin-top-center,
.pagedjs_page .pagedjs_margin-bottom-center,
.pagedjs_page .pagedjs_margin-left-top,
.pagedjs_page .pagedjs_margin-left-middle,
.pagedjs_page .pagedjs_margin-left-bottom,
.pagedjs_page .pagedjs_margin-right-top,
.pagedjs_page .pagedjs_margin-right-middle,
.pagedjs_page .pagedjs_margin-right-bottom { text-align: center; }

.pagedjs_pages .pagedjs_margin .pagedjs_margin-content {
  width: 100%;
}

.pagedjs_pages .pagedjs_margin-left .pagedjs_margin-content::after,
.pagedjs_pages .pagedjs_margin-top .pagedjs_margin-content::after,
.pagedjs_pages .pagedjs_margin-right .pagedjs_margin-content::after,
.pagedjs_pages .pagedjs_margin-bottom .pagedjs_margin-content::after {
  display: block;
}

.pagedjs_pages > .pagedjs_page > .pagedjs_area > div [data-split-from] {
  text-indent: unset;
  margin-top: unset;
  padding-top: unset;
  initial-letter: unset;
}

.pagedjs_pages > .pagedjs_page > .pagedjs_area > div [data-split-from] > *::first-letter,
.pagedjs_pages > .pagedjs_page > .pagedjs_area > div [data-split-from]::first-letter {
  color: unset;
  font-size: unset;
  font-weight: unset;
  font-family: unset;
  color: unset;
  line-height: unset;
  float: unset;
  padding: unset;
  margin: unset;
}

/*
[data-page]:not([data-split-from]),
[data-break-before="page"]:not([data-split-from]),
[data-break-before="always"]:not([data-split-from]),
[data-break-before="left"]:not([data-split-from]),
[data-break-before="right"]:not([data-split-from]),
[data-break-before="recto"]:not([data-split-from]),
[data-break-before="verso"]:not([data-split-from])
{
  break-before: column;
}

[data-page]:not([data-split-to]),
[data-break-after="page"]:not([data-split-to]),
[data-break-after="always"]:not([data-split-to]),
[data-break-after="left"]:not([data-split-to]),
[data-break-after="right"]:not([data-split-to]),
[data-break-after="recto"]:not([data-split-to]),
[data-break-after="verso"]:not([data-split-to])
{
  break-after: column;
}
*/

.pagedjs_clear-after::after {
  content: none !important;
}

@media print {
  html {
    width: 100%;
    height: 100%;
  }
  body {
    margin: 0;
    padding: 0;
    width: 100% !important;
    height: 100% !important;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
  }
  .pagedjs_pages {
    width: var(--width);
    display: block !important;
    transform: none !important;
    height: 100% !important;
    min-height: 100%;
    max-height: 100%;
    overflow: visible;
  }
  .pagedjs_page {
    margin: 0;
    padding: 0;
    max-height: 100%;
    min-height: 100%;
    height: 100% !important;
    page-break-after: always;
    break-after: page;
  }
}
`;

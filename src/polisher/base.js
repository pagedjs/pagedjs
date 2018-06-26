export default `
:root {
  --width: 8.5in;
  --height: 11in;
  --margin-top: 1in;
  --margin-right: 1in;
  --margin-bottom: 1in;
  --margin-left: 1in;
}

@page {
  size: letter;
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
  width: var(--width);
  height: var(--margin-top);
  display: flex;
  grid-column: left / right;
  grid-row: header;
}

.pagedjs_margin-top .pagedjs_margin-top-left-corner {
  width: var(--margin-left);
  height: var(--margin-top);
  flex: none;
}

.pagedjs_margin-top .pagedjs_margin-top-right-corner {
  width: var(--margin-right);
  height: var(--margin-top);
  flex: none;
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
  width: var(--width);
  height: var(--margin-bottom);
  display: flex;
  grid-column: left / right;
  grid-row: footer;
}

.pagedjs_margin-bottom .pagedjs_margin-bottom-left-corner {
  width: var(--margin-left);
  height: var(--margin-bottom);
  flex: none;
}

.pagedjs_margin-bottom .pagedjs_margin-bottom-right-corner {
  width: var(--margin-right);
  height: var(--margin-bottom);
  flex: none;
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

.pagedjs_page > .pagedjs_area {
  grid-column: center;
  grid-row: page;
  width: 100%;
  height: 100%;
}

.pagedjs_page {
  counter-increment: page;
}


.pagedjs_page .pagedjs_margin-top > div,
.pagedjs_page .pagedjs_margin-bottom > div {
  height: 100%;
  display: flex;
  align-items: center;
}

.pagedjs_page .pagedjs_margin-left > div,
.pagedjs_page .pagedjs_margin-right > div {
  width: 100%;
  display: flex;
  align-items: center;
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
  font-wieght: unset;
  font-family: unset;
  color: unset;
  line-height: unset;
  float: unset;
  padding: unset;
  margin: unset;
}

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

@media print {
  body {
    width: unset;
    height: unset;
    margin: 0;
    padding: 0;
  }
  .pagedjs_pages {
    width: var(--width);
    display: block;
    transform: none !important;
  }
  .pagedjs_page {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    break-before: page;
    break-after: page;
  }
}
`;

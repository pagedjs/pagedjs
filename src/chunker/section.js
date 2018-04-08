import Page from "./page";
import Parser from "./parser";
import EventEmitter from "event-emitter";

const MAX_PAGES = 10000000000;

/**
 * Render a page
 * @class
 */
class Section {
  constructor(pagesArea, pageTemplate, total, preview=true) {
    this.pagesArea = pagesArea;
    this.pageTemplate = pageTemplate;
    this.preview = preview;

    this.pages = [];
    this.startPage = total || 0;
    this.total = total || 0;
  }

  create(section, startPage) {
    let element = document.createElement("div");

    let id = `section-${section || 0}`;

    element.id = id;
    element.classList.add("section");

    this.id = id;

    this.pagesArea.appendChild(element);

    this.element = element;

    this.startPage = startPage;

    return element;
  }

  async render(parsed, cb) {
    let renderer = this.layout(parsed);

    // this.parser = new Parser(parsed);

    let done = false;
    let result;

    this.name = parsed.dataset.page;
    this.breaks = {
      before: parsed.dataset.breakBefore,
      after: parsed.dataset.breakAfter
    }

    if (this.breaks.before === "right" && this.startPage % 2 > 0) {
      this.addPage(true);
    }

    if (this.breaks.before === "left" && this.startPage % 2 === 0) {
      this.addPage(true);
    }

    while (!done) {
      if (this.preview) {
        result = await this.renderOnIdle(renderer);
        done = result.done;
      } else {
        result = renderer.next();
        done = result.done;
      }
    }

    cb && cb(this);

    return this;
  }

  renderOnIdle(renderer) {
    return new Promise(resolve => {
      requestIdleCallback(() => {
        let result = renderer.next();
        resolve(result);
      });
    });
  }

  *layout(content) {
    let breakToken = false;

    while (breakToken !== undefined && this.total < MAX_PAGES) {
      let page = this.addPage();

      // Layout content in the page, starting from the breakToken
      breakToken = page.layout(content, breakToken);

      yield breakToken;

      // Stop if we get undefined, showing we have reached the end of the content
    }

  }

  addPage(blank) {
    // Create a new page from the template
    let page = new Page(this.pagesArea, this.pageTemplate, this.name, blank);
    let total = this.pages.push(page);

    // Create the pages
    page.create(this.total, this.id);

    // Listen for page overflow
    page.onOverflow((overflow) => {
      if (total < this.pages.length) {
        requestIdleCallback(() => {
          this.pages[total].prepend(overflow)
        })
      } else {
        let newPage = this.addPage();
        newPage.prepend(overflow);
      }
    });

    page.onUnderflow(() => {
      // console.log("underflow on", page.id);
    });

    this.emit("page", page);

    this.total += 1;

    return page;
  }

  destroy() {

  }
}

EventEmitter(Section.prototype);

export default Section;

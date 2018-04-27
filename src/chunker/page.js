import Layout from "./layout";
import Renderer from "./renderer";
import EventEmitter from "event-emitter";

/**
 * Render a page
 * @class
 */
class Page {
  constructor(pagesArea, pageTemplate, name, blank) {
    this.pagesArea = pagesArea;
    this.pageTemplate = pageTemplate;
    this.name = name;
    this.blank = blank;

    // this.mapper = new Mapping(undefined, undefined, undefined, true);

    this.width = undefined;
    this.height = undefined;

    // this.element = this.create(this.pageTemplate);
  }

  create(pgnum, section, template, after) {
    //let documentFragment = document.createRange().createContextualFragment( TEMPLATE );
    //let page = documentFragment.children[0];
    let clone = document.importNode(this.pageTemplate.content, true);

    let id = `section-${section || 0}-page-${pgnum}`;

    this.id = id;

    let page;
    if (after) {
      this.pagesArea.insertBefore(clone, after.nextSibling);
      let index = Array.prototype.indexOf.call(this.pagesArea.children, after.nextSibling);
      page = this.pagesArea.children[index];
    } else {
      this.pagesArea.appendChild(clone);
      page = this.pagesArea.lastChild;
    }

    let area = page.querySelector(".area");

    page.id = id;

    if (this.name) {
      page.classList.add(this.name + "_page");
    }

    if (this.blank) {
      page.classList.add("blank_page");
    }

    if (pgnum === 0) {
      page.classList.add("first_page");
    }

    if (pgnum % 2 !== 1) {
      page.classList.add("right_page");
    } else {
      page.classList.add("left_page");
    }

    let size = area.getBoundingClientRect();


    area.style.columnWidth = Math.round(size.width) + "px";
    area.style.columnGap = "10px";
    area.style.columnFill = "auto";
    area.style.overflow = "hidden";
    // area.style.overflow = "scroll";
    area.style.position = "relative";

    this.width = Math.round(size.width);
    this.height = Math.round(size.height);

    this.element = page;
    this.area = area;

    let wrapper = document.createElement("div");

    // wrapper.style.outline = "none";
    // wrapper.setAttribute("contenteditable", true);

    this.area.appendChild(wrapper);

    this.wrapper = wrapper;

    // this.render = new Renderer(area);

    return page;
  }

  /*
  size(width, height) {
    if (width === this.width && height === this.height) {
      return;
    }
    this.width = width;
    this.height = height;

    this.element.style.width = Math.round(width) + "px";
    this.element.style.height = Math.round(height) + "px";
    this.element.style.columnWidth = Math.round(width) + "px";
  }
  */

  layout(contents, breakToken, parser) {
    // console.log("layout page", this.id);
    let size = this.area.getBoundingClientRect();
    this.l = new Layout(this.area, this.wrapper, parser);

    this.l.onOverflow((overflow) => {
      this._onOverflow && this._onOverflow(overflow);
    });

    this.l.onUnderflow((overflow) => {
      this._onUnderflow && this._onUnderflow(overflow);
    });

    breakToken = this.l.layout(size, contents, {}, {}, breakToken);

    return breakToken;
  }


  getByParent(ref, entries) {
    let e;
    for (var i = 0; i < entries.length; i++) {
      e = entries[i];
      if(e.ref === ref) {
        return e;
        break;
      }
    }
  }

  onOverflow(func) {
    this._onOverflow = func;
  }

  onUnderflow(func) {
    this._onUnderflow = func;
  }

  prepend(fragment) {
    if (!this.l) {
      this.l = new Layout(this.area, this.wrapper);

      this.l.onOverflow((overflow) => {
        this._onOverflow && this._onOverflow(overflow);
      });

      this.l.onUnderflow((overflow) => {
        this._onUnderflow && this._onUnderflow(overflow);
      });
    }

    this.l.prepend(fragment);
  }

  append() {

  }


  destroy() {

  }
}

EventEmitter(Page.prototype);


export default Page;

import { getBoundingClientRect } from "../utils/utils";
import { walk, after, stackChildren, rebuildAncestors } from "../utils/dom";
import EventEmitter from "event-emitter";

/**
 * Layout
 * @class
 */
class Layout {

  constructor(element, wrapper, parser) {
    this.element = element;
    this.wrapper = wrapper;

    let space = this.element.getBoundingClientRect();
    this.width = Math.round(space.width);

  }

  getStart(content, breakToken) {
    let start = content;
    let node = breakToken.node;
    let index, ref, parent;

    if (node.nodeType === 1) {
      start = content.querySelector("[ref='"+ node.getAttribute("ref") +"']");
    } else {
      index = Array.prototype.indexOf.call(node.parentNode.childNodes, node);
      ref = node.parentNode.getAttribute("ref");
      parent = content.querySelector("[ref='" + ref + "']");
      start = parent.childNodes[index];
    }

    return start;
  }

  layout(space, content, styleMap, edges, breakToken) {
    let start = content;
    if (breakToken.node) {
      start = this.getStart(content, breakToken);
    }

    let walker = walk(start, content);

    let node;
    let done;
    let next;
    let hasOverflow = false;
    let newBreakToken;

    let check = 0;

    let dest = document.createDocumentFragment();

    let rendered;
    let shallow = true;

    while (!done && !hasOverflow) {
      next = walker.next();
      node = next.value;
      done = next.done;

      if (node) {

        if (node.tagName === "P" || node.tagName === "HEADER") {
          shallow = false;
        } else {
          shallow = true;
        }

        rendered = this.render(node, this.wrapper, breakToken, shallow);

        if (!shallow) {
          next = after(node, content);
          if (next) {
            walker = walk(next, content);
          }
        }

      } else {
        check = 1000; // Force check
      }

      // Only check every 4 elements
      if (check >= 4) {
        check = 0;
        hasOverflow = this.hasOverflow();
      }

      if (hasOverflow) {

        let overflow = this.overflow(this.element);

        if (overflow) {

          newBreakToken = this.findBreakToken(overflow);

          if (newBreakToken && newBreakToken.node) {
            this.removeOverflow(overflow);
          }

          break;

        } else {
          // Underflow
          hasOverflow = false;
        }

      }
      check += 1;
    }

    this.listened = this.listeners();

    return newBreakToken;

  }

  hasOverflow() {
    let width = Math.floor(this.wrapper.getBoundingClientRect().width); // or this.element.scrollWidth
    return this.width < width;
  }

  render(node, dest, breakToken, shallow=true, rebuild=true) {

    let clone = this.createDOMNode(node, !shallow);

    if (node.parentNode && node.parentNode.nodeType === 1) {
      let parent = dest.querySelector("[ref='" + node.parentNode.getAttribute("ref") + "']");

      // Rebuild chain
      if (parent) {
        parent.appendChild(clone);
      } else if (rebuild) {
        let fragment = rebuildAncestors(node);
        parent = fragment.querySelector("[ref='" + node.parentNode.getAttribute("ref") + "']");
        if (breakToken && breakToken.node.nodeType === 3 && breakToken.offset > 0) {
          clone.textContent = clone.textContent.substring(breakToken.offset);
          parent.appendChild(clone);
        } else {
          parent.appendChild(clone);
        }

        dest.appendChild(fragment);
      } else {
        dest.appendChild(clone);
      }


    } else {
      dest.appendChild(clone);
    }

    // if (!shallow && node.childNodes) {
    //   for (let child of node.childNodes) {
    //     this.render(child, dest, breakToken, shallow, rebuild);
    //   }
    // }

    return clone;
  }

  createDOMNode(n, deep=false) {
    let node = n.cloneNode(deep);

    return node;
  }

  // rebuildAncestors(node) {
  //   let parent;
  //   let ancestors = [];
  //   let added = [];
  //
  //   let fragment = document.createDocumentFragment();
  //
  //   // Gather all ancestors
  //   let element = node;
  //   while(element.parentNode && element.parentNode.nodeType === 1) {
  //     ancestors.unshift(element.parentNode);
  //     element = element.parentNode;
  //   }
  //
  //   for (var i = 0; i < ancestors.length; i++) {
  //     // parent = this.createDOMNode(ancestors[i]);
  //     parent = ancestors[i].cloneNode(false);
  //
  //     parent.setAttribute("data-split-from", parent.getAttribute("ref"));
  //
  //     if (parent.hasAttribute("id")) {
  //       let dataID = parent.getAttribute("id");
  //       parent.setAttribute("data-id", dataID);
  //       parent.removeAttribute("id");
  //     }
  //
  //     if (added.length) {
  //       // let container = this.wrapper.querySelector("[ref='" + ancestors[i].parent.attribs.ref + "']");
  //       let container = added[added.length-1];
  //       container.appendChild(parent);
  //     } else {
  //       fragment.appendChild(parent);
  //     }
  //     added.push(parent);
  //   }
  //
  //   added = undefined;
  //   return fragment;
  // }

  findBreakToken(overflow) {
    let offset = overflow.startOffset;
    let node, ref, parent, index, temp;

    if (overflow.startContainer.nodeType === 1) {
      // node = children.querySelector("[ref='" + overflow.startContainer.childNodes[offset].getAttribute("ref") + "']");
      temp = overflow.startContainer.childNodes[offset];

      if (temp.nodeType === 1) {
        ref = temp.getAttribute("ref");
        // node = this.parser.find(ref);
        node = this.wrapper.querySelector("[ref='" + ref + "']");
        offset = 0;
      } else {
        index = Array.prototype.indexOf.call(overflow.startContainer.childNodes, temp);
        ref = overflow.startContainer.getAttribute("ref");
        parent = this.wrapper.querySelector("[ref='" + ref + "']");
        node = parent.childNodes[index];
        offset = 0;
      }
    } else {
      index = Array.prototype.indexOf.call(overflow.startContainer.parentNode.childNodes, overflow.startContainer);
      // let parent = children.querySelector("[ref='" + overflow.startContainer.parentNode.getAttribute("ref") + "']");
      ref = overflow.startContainer.parentNode.getAttribute("ref");
      parent = this.wrapper.querySelector("[ref='" + ref + "']");
      node = parent.childNodes[index];
    }

    if (!node) {
      return;
    }

    return {
      node,
      offset
    };

  }

  removeOverflow(overflow) {

    overflow.extractContents();

    // requestIdleCallback(() => this.removeEmpty());
  }

  removeEmpty() {
    // Clean Empty Nodes
    let stack = stackChildren(this.wrapper);

    stack.forEach((currentNode) => {

      if (!currentNode) {
        return;
      }

      if (currentNode.childNodes.length === 0) {
        // Check in original
        let original = currentNode.getAttribute("data-children");
        if (original != 0) {
          currentNode.remove();
        }
      } else if (currentNode.textContent.trim().length === 0) {
        let original = currentNode.getAttribute("data-text");
        if (original != 0) {
          currentNode.remove();
        }
      }
    });

    stack = undefined;
    requestIdleCallback(() => this.floats());

  }

  floats(area) {
    let bounds = getBoundingClientRect(this.element);

    let start = Math.round(bounds.left);
    let end = Math.round(bounds.right);

    let range;

    let walker = walk(this.wrapper.firstChild, this.wrapper);

    // Find Start
    let startContainer, startOffset;
    let next, done, node, offset;
    while (!done) {
      next = walker.next();
      done = next.done;
      node = next.value;

      if (node) {
        let pos = getBoundingClientRect(node);
        let left = Math.floor(pos.left);
        let right = Math.floor(pos.right);

        if (left >= end) {
          range = document.createRange();
          range.selectNode(node);
          let extracted = range.extractContents();
          this._onOverflow && this._onOverflow(extracted);
        }

      }
    }

  }

  onOverflow(func) {
    this._onOverflow = func;
  }

  onUnderflow(func) {
    this._onUnderflow = func;
  }

  overflow(area) {
    let bounds = getBoundingClientRect(this.element);

    let start = Math.round(bounds.left);
    let end =  Math.round(bounds.right);

    let range;

    let walker = walk(this.wrapper.firstChild, this.wrapper);

    // Find Start
    let startContainer, startOffset;
    let next, done, node, offset;
    while (!done) {
      next = walker.next();
      done = next.done;
      node = next.value;

      if (node) {
        let pos = getBoundingClientRect(node);
        let left = Math.floor(pos.left);
        let right = Math.floor(pos.right);

        if (!range && left >= end) {
          // Check if it is a float
          let isFloat = false;
          if (node.nodeType === 1) {
            let styles = window.getComputedStyle(node);
            isFloat = styles.getPropertyValue("float") !== "none";
          }

          if (!isFloat && node.nodeType === 1) {
            range = document.createRange();
            range.setStartBefore(node);
            break;
          }

          if (node.nodeType === 3 && node.textContent.trim().length) {
            range = document.createRange();
            range.setStartBefore(node);
            break;
          }

        }

        if (!range && node.nodeType === 3 && right > end && node.textContent.trim().length) {
          range = document.createRange();
          offset = this.textBreak(node, start, end);
          if (!offset) {
            offset = 0;
          }
          range.setStart(node, offset);
          break;
        }

        // Skip children
        if (right < end) {

          next = after(node, this.wrapper);
          if (next) {
            walker = walk(next, this.wrapper);
          }

        }

      }
    }
    if (range) {
      range.setEndAfter(this.wrapper.lastChild);
      return range;
    }

  }

  textBreak(node, start, end) {
    let wordwalker = this.words(node);
    let left = 0;
    let word, next, done, pos;
    while (!done) {
      next = wordwalker.next();
      word = next.value;
      done = next.done;

      if (!word) {
        break;
      }

      pos = getBoundingClientRect(word);

      left = Math.floor(pos.left);
      if (left >= end) {
        break;
      }
    }
    return word && word.startOffset;
  }

  *words(node) {
    let currentText = node.nodeValue;
    let max = currentText.length;
    let currentOffset = 0;
    let currentLetter;

    let range;

    while(currentOffset < max) {
        currentLetter = currentText[currentOffset];

       if (/^\w$/.test(currentLetter)) {
         if (!range) {
           range = document.createRange();
           range.setStart(node, currentOffset);
         }
       } else {
         if (range) {
           range.setEnd(node, currentOffset);
           yield range;
           range = undefined;
         }
       }

       currentOffset += 1;
    }
  }

  prepend(fragment, rebuild=true) {
    // this.element.insertBefore(fragment, this.element.firstChild);
    let walker = walk(fragment.firstChild, this.wrapper);
    let next, node, done;
    let parent;
    while (!done) {
      next = walker.next();
      node = next.value;
      done = next.done;

      if (!node) {
        break;
      }

      let exists = false;

      if (node.nodeType === 1) {
        exists = this.wrapper.querySelector("[ref='" + node.getAttribute("ref") + "']");
      }

      if (exists) {
        parent = exists;
      } else {
        if(parent) {
          parent.insertBefore(node, parent.firstChild);
          break;
        } else {
          this.wrapper.insertBefore(node, this.wrapper.firstChild);
        }
      }
    }

    let hasOverflow = this.hasOverflow();

    if (hasOverflow) {

      let overflow = this.overflow(this.element);

      if (overflow) {
        let extracted = overflow.extractContents();
        this._onOverflow && this._onOverflow(extracted);
      }
    }

    if (!this.listened) {
      this.listened = this.listeners();
    }
  }

  getOverflow() {
    let overflow = this.overflow(this.element);

    if (overflow) {
      let extracted = overflow.extractContents();
      this._onOverflow && this._onOverflow(extracted);
    }
  }

  getUnderflow() {
    this._onUnderflow && this._onUnderflow();
  }

  listeners() {
    if (typeof ResizeObserver !== "undefined") {
      this.addResizeObserver();
    } else {
      this.element.addEventListener("overflow", this.getOverflow.bind(this), false);
      this.element.addEventListener("underflow", this.getUnderflow.bind(this), false);
    }
    // TODO: fall back to mutation observer?


    // Key scroll width from changing
    this.element.addEventListener("scroll", () => {
      this.element.scrollLeft = 0;
    });

    return true;
  }

  addResizeObserver() {
    let wrapper = this.wrapper;
    let prevHeight = wrapper.getBoundingClientRect().height;
    this.ro = new ResizeObserver( entries => {
      for (let entry of entries) {
        const cr = entry.contentRect;

        if (cr.height > prevHeight) {
          let hasOverflow = this.hasOverflow();

          if (hasOverflow) {

            let overflow = this.overflow(this.element);

            if (overflow) {
              let extracted = overflow.extractContents();
              this._onOverflow && this._onOverflow(extracted);
              prevHeight = wrapper.getBoundingClientRect().height;
            }
          } else {
            prevHeight = cr.height;
          }

        } else if (cr.height < prevHeight ) { // TODO: calc line height && (prevHeight - cr.height) >= 22
          this._onUnderflow && this._onUnderflow();
          prevHeight = cr.height;
        }
      }
    });

    this.ro.observe(wrapper);
  }

  destroy() {
    this.element.removeEventListener("overflow", this.getOverflow.bind(this), false);
    this.element.removeEventListener("underflow", this.getUnderflow.bind(this), false);

    this.ro.disconnect();

    this.element = element;
    this.wrapper = wrapper;
  }

}

EventEmitter(Layout.prototype);

export default Layout;

import { getBoundingClientRect, getClientRects } from "../utils/utils";
import {
  walk,
  nodeAfter,
  nodeBefore,
  stackChildren,
  rebuildAncestors,
  needsBreakBefore,
  needsBreakAfter,
  needsPreviousBreakAfter,
  needsPageBreak,
  isElement,
  isText,
  indexOf,
  cloneNode,
  findElement,
  findRef,
  child,
  isVisible,
  isContainer,
  hasContent,
  hasTextContent,
  validNode,
  prevValidNode,
  nextValidNode,
  words,
  letters
} from "../utils/dom";
import EventEmitter from "event-emitter";
import Hook from "../utils/hook";
const _requestIdleCallback = 'requestIdleCallback' in window ? requestIdleCallback : requestAnimationFrame;

const PER_PAGE_CHECK = 4;

/**
 * Layout
 * @class
 */
class Layout {

  constructor(element, hooks) {
    this.element = element;

    this.bounds = this.element.getBoundingClientRect();

    if (hooks) {
      this.hooks = hooks;
    } else {
      this.hooks = {};
      this.hooks.layout = new Hook();
      this.hooks.renderNode = new Hook();
      this.hooks.layoutNode = new Hook();
      this.hooks.overflow = new Hook();
    }

  }

  async renderTo(wrapper, source, breakToken, bounds=this.bounds) {
    let start = this.getStart(source, breakToken);
    let walker = walk(start, source);

    let node;
    let done;
    let next;

    let hasRenderedContent = false;
    let newBreakToken;

    let check = 0;

    while (!done && !newBreakToken) {
      next = walker.next();
      node = next.value;
      done = next.done;

      if (!node) {
        newBreakToken = this.findBreakToken(wrapper, source, bounds);
        return newBreakToken;
      }

      this.hooks && this.hooks.layoutNode.trigger(node);

      // Check if the rendered element has a break set
      if (hasRenderedContent && this.shouldBreak(node)) {

        this.hooks && this.hooks.layout.trigger(wrapper, this);

        let imgs = wrapper.querySelectorAll("img");
        if (imgs.length) {
          await this.waitForImages(imgs);
        }

        newBreakToken = this.findBreakToken(wrapper, source, bounds);

        if (!newBreakToken) {
          newBreakToken = this.breakAt(node);
        }

        break;
      }

      // Should the Node be a shallow or deep clone
      let shallow = isContainer(node);

      let rendered = this.append(node, wrapper, breakToken, shallow);

      // Check if layout has content yet
      if (!hasRenderedContent) {
        hasRenderedContent = hasContent(node);
      }

      // Skip to the next node if a deep clone was rendered
      if (!shallow) {
        walker = walk(nodeAfter(node, source), source);
      }

      // Only check every few elements
      if (check >= PER_PAGE_CHECK) {
        check = 0;

        this.hooks && this.hooks.layout.trigger(wrapper, this);

        let imgs = wrapper.querySelectorAll("img");
        if (imgs.length) {
          await this.waitForImages(imgs);
        }

        newBreakToken = this.findBreakToken(wrapper, source, bounds);
      }

      check += 1;
    }

    return newBreakToken;
  }

  breakAt(node, offset=0) {
    return {
      node,
      offset
    }
  }

  shouldBreak(node) {
    let previousSibling = node.previousSibling;
    let parentNode = node.parentNode;
    let parentBreakBefore = needsBreakBefore(node) && parentNode && !previousSibling && needsBreakBefore(parentNode);
    let doubleBreakBefore;

    if (parentBreakBefore) {
      doubleBreakBefore = node.dataset.breakBefore === parentNode.dataset.breakBefore;
    }

    return !doubleBreakBefore && needsBreakBefore(node) || needsPreviousBreakAfter(node) || needsPageBreak(node);
  }

  getStart(source, breakToken) {
    let start;
    let node = breakToken && breakToken.node;

    if (node) {
      start = node;
    } else {
      start = source.firstChild;
    }

    return start;
  }

  append(node, dest, breakToken, shallow=true, rebuild=true) {

    let clone = cloneNode(node, !shallow);

    if (node.parentNode && isElement(node.parentNode)) {
      let parent = findElement(node.parentNode, dest);
      // Rebuild chain
      if (parent) {
        parent.appendChild(clone);
      } else if (rebuild) {
        let fragment = rebuildAncestors(node);
        parent = findElement(node.parentNode, fragment);
        if (!parent) {
          dest.appendChild(clone);
        } else if (breakToken && isText(breakToken.node) && breakToken.offset > 0) {
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

    this.hooks && this.hooks.renderNode.trigger(clone);

    return clone;
  }

  async waitForImages(imgs) {
    let results = Array.from(imgs).map(async (img) => {
      return this.awaitImageLoaded(img);
    });
    await Promise.all(results);
  }

  async awaitImageLoaded(image) {
    return new Promise(resolve => {
      if (image.complete !== true) {
        image.onload = function() {
          let { width, height } = window.getComputedStyle(image);
          resolve(width, height);
        };
        image.onerror = function(e) {
          let { width, height } = window.getComputedStyle(image);
          resolve(width, height, e);
        };
      } else {
        let { width, height } = window.getComputedStyle(image);
        resolve(width, height);
      }
    });
  }

  avoidBreakInside(node, limiter) {
    let breakNode;

    if (node === limiter) {
      return;
    }

    while (node.parentNode) {
      node = node.parentNode;

      if (node === limiter) {
        break;
      }

      if(window.getComputedStyle(node)["break-inside"] === "avoid") {
        breakNode = node;
        break;
      }

    }
    return breakNode;
  }

  createBreakToken(overflow, rendered, source) {
    let container = overflow.startContainer;
    let offset = overflow.startOffset;
    let node, renderedNode, ref, parent, index, temp, startOffset;

    if (isElement(container)) {
      temp = child(container, offset);

      if (isElement(temp)) {
        renderedNode = findElement(temp, rendered);

        if (!renderedNode) {
          // Find closest element with data-ref
          renderedNode = findElement(prevValidNode(temp), rendered);
          return;
        }

        node = findElement(renderedNode, source);
        offset = 0;
      } else {
        renderedNode = findElement(container, rendered);

        if (!renderedNode) {
          renderedNode = findElement(prevValidNode(container), rendered);
        }

        parent = findElement(renderedNode, source);
        index = indexOf(temp);
        node = child(parent, index);
        offset = 0;
      }
    } else {
      renderedNode = findElement(container.parentNode, rendered);

      if (!renderedNode) {
        renderedNode = findElement(prevValidNode(container.parentNode), rendered);
      }

      parent = findElement(renderedNode, source);
      index = indexOf(container);
      node = child(parent, index);
    }

    if (!node) {
      return;
    }

    return {
      node,
      offset
    };

  }

  findBreakToken(rendered, source, bounds=this.bounds, extract=true) {
    let overflow = this.findOverflow(rendered, bounds);
    let breakToken;

    if (overflow) {
      breakToken = this.createBreakToken(overflow, rendered, source);

      if (breakToken && breakToken.node && extract) {
        this.removeOverflow(overflow);
      }

    }
    return breakToken;
  }

  hasOverflow(element, bounds=this.bounds) {
    let constrainingElement = element && element.parentNode; // this gets the element, instead of the wrapper for the width workaround
    let { width } = element.getBoundingClientRect();
    let scrollWidth = constrainingElement ? constrainingElement.scrollWidth : 0;
    return Math.max(Math.floor(width), scrollWidth) > Math.round(bounds.width);
  }

  findOverflow(rendered, bounds=this.bounds) {
    if (!this.hasOverflow(rendered, bounds)) return;

    let start = Math.round(bounds.left);
    let end =  Math.round(bounds.right);
    let range;

    let walker = walk(rendered.firstChild, rendered);

    // Find Start
    let startContainer, startOffset;
    let next, done, node, offset, skip, breakAvoid, prev, br;
    while (!done) {
      next = walker.next();
      done = next.done;
      node = next.value;
      skip = false;
      breakAvoid = false;
      prev = undefined;
      br = undefined;

      if (node) {
        let pos = getBoundingClientRect(node);
        let left = Math.floor(pos.left);
        let right = Math.floor(pos.right);

        if (!range && left >= end) {
          // Check if it is a float
          let isFloat = false;

          if (isElement(node) ) {
            let styles = window.getComputedStyle(node);
            isFloat = styles.getPropertyValue("float") !== "none";
            skip = styles.getPropertyValue("break-inside") === "avoid";
            breakAvoid = node.dataset.breakBefore === "avoid" || node.dataset.previousBreakAfter === "avoid";
            prev = breakAvoid && nodeBefore(node, rendered);
            br = node.tagName === "BR" || node.tagName === "WBR";
          }

          if (prev) {
            range = document.createRange();
            range.setStartBefore(prev);
            break;
          }

          if (!br && !isFloat && isElement(node)) {
            range = document.createRange();
            range.setStartBefore(node);
            break;
          }

          if (isText(node) && node.textContent.trim().length) {
            range = document.createRange();
            range.setStartBefore(node);
            break;
          }

        }

        if (!range && isText(node) &&
            node.textContent.trim().length &&
            window.getComputedStyle(node.parentNode)["break-inside"] !== "avoid") {

          let rects = getClientRects(node);
          let rect;
          left = 0;
          for (var i = 0; i != rects.length; i++) {
            rect = rects[i];
            if (!left || rect.left > left) {
              left = rect.left;
            }
          }

          if(left >= end) {
            range = document.createRange();
            offset = this.textBreak(node, start, end);
            if (!offset) {
              range = undefined;
            } else {
              range.setStart(node, offset);
            }
            break;
          }
        }

        // Skip children
        if (skip || right < end) {
          next = nodeAfter(node, rendered);
          if (next) {
            walker = walk(next, rendered);
          }

        }

      }
    }

    // Find End
    if (range) {
      range.setEndAfter(rendered.lastChild);
      return range;
    }

  }

  findEndToken(rendered, source, bounds=this.bounds) {
    if (rendered.childNodes.length === 0) {
      return;
    }

    let lastChild = rendered.lastChild;

    let lastNodeIndex;
    while (lastChild && lastChild.lastChild) {
      if (!validNode(lastChild)) {
        // Only get elements with refs
        lastChild = lastChild.previousSibling;
      } else if(!validNode(lastChild.lastChild)) {
        // Deal with invalid dom items
        lastChild = prevValidNode(lastChild.lastChild);
        break;
      } else {
        lastChild = lastChild.lastChild;
      }
    }

    if (isText(lastChild)) {

      if (lastChild.parentNode.dataset.ref) {
        lastNodeIndex = indexOf(lastChild);
        lastChild = lastChild.parentNode;
      } else {
        lastChild = lastChild.previousSibling;
      }
    }

    let original = findElement(lastChild, source);

    if (lastNodeIndex) {
      original = original.childNodes[lastNodeIndex];
    }

    let after = nodeAfter(original);

    return this.breakAt(after);
  }

  textBreak(node, start, end) {
    let wordwalker = words(node);
    let left = 0;
    let right = 0;
    let word, next, done, pos;
    let offset;
    while (!done) {
      next = wordwalker.next();
      word = next.value;
      done = next.done;

      if (!word) {
        break;
      }

      pos = getBoundingClientRect(word);

      left = Math.floor(pos.left);
      right = Math.floor(pos.right);

      if (left >= end) {
        offset = word.startOffset;
        break;
      }

      if (right > end) {
        let letterwalker = letters(word);
        let letter, nextLetter, doneLetter, posLetter;

        while (!doneLetter) {
          nextLetter = letterwalker.next();
          letter = nextLetter.value;
          doneLetter = nextLetter.done;

          if (!letter) {
            break;
          }

          pos = getBoundingClientRect(letter);
          left = Math.floor(pos.left);

          if (left >= end) {
            offset = letter.startOffset;
            done = true;

            break;
          }
        }
      }

    }

    return offset;
  }

  removeOverflow(overflow) {
    this.hyphenateAtBreak(overflow);

    return overflow.extractContents();
  }

  hyphenateAtBreak(overflow) {
    if (isText(overflow.startContainer) && overflow.startOffset > 0) {
      let startText = overflow.startContainer.textContent;
      let startOffset = overflow.startOffset;
      let prevLetter = startText[startOffset-1];

      // Add a hyphen if previous character is a letter or soft hyphen
      if (/^\w|\u00AD$/.test(prevLetter)) {
        overflow.startContainer.textContent = startText.slice(0, startOffset) + "\u2010";
        overflow.setStart(overflow.startContainer, startOffset + 1);
      }
    }
  }
}

EventEmitter(Layout.prototype);

export default Layout;

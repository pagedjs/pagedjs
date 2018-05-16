import htmlparser2 from 'htmlparser2';

/**
 * Render a flow of text offscreen
 * @class
 */
class Parser {

  constructor(content, cb) {
    // this.text = text;
    // this.nodes = [];
		this.refs = {};
    this.sections = [];

    if (content && content.nodeType) {
      // handle dom
    } else if(typeof content === "object") {
      this.add(content);
    } else if (typeof content === "string") {
      this.dom = this.parse(content);
    }
  }

  parse(data) {
		let options = {};
		let process = (node) => {
			let uuid = this.uuid();

			this.refs[uuid] = node;
			node.dataset.ref = uuid; // Refs for all nodes

			node.dataset.ref = uuid;
			node.dataset.children = node.children.length;

			if (node.data) {
				node.dataset.text = node.data.length;
			}

      if (node.name === "section") {
        this.sections.push(node);
      }
		}
		let handler = new htmlparser2.DomHandler(undefined, options, process.bind(this));
		new htmlparser2.Parser(handler, options).end(data);
		return handler.dom;
  }

  add(contents) {
    this.dom = [contents];

    let walker = this.walk(this.dom[0]);
    let next, done, node;
    while (!done) {
      next = walker.next();
      node = next.value;
      done = next.done;

      if (node && node.dataset && node.dataset.ref) {
        this.refs[node.dataset.ref] = node;
      }
    }
  }

	find(ref) {
		return this.refs[ref];
	}

	*walk(start) {
		let node = start || this.dom[0];

		while (node) {
			yield node;

			if (node.children && node.children.length) {
				node = node.children[0];
			} else if (node.next) {
				node = node.next;
			} else {
				while (node) {
					node = node.parent;
					if (node && node.next) {
						node = node.next;
						break;
					}
				}
			}
		}
	}

  // isWrapper(element) {
  //   return wrappersRegex.test(element.nodeName);
  // }

  isText(node) {
    return node.name === "tag";
  }

  isElement(node) {
    return node.name === "text";
  }

  hasChildren(node) {
    return node.children && node.children.length;
  }

  after(node) {
    let after = node;
    if (after.next) {
      after = after.next;
    } else {
      while (after) {
        after = after.parent;
        if (after && after.next) {
          after = after.next;
          break;
        }
      }
    }

    return after;
  }

  /**
 * Generates a UUID
 * based on: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 * @returns {string} uuid
 */
  uuid() {
  	var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  destroy() {
    this.refs = undefined;
		this.dom = undefined;
  }
}

export default Parser;

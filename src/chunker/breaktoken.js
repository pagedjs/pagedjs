import {
	isElement
} from "../utils/dom.js";

/**
 * BreakToken
 * @class
 */
class BreakToken {

	constructor(node, offset) {
		this.node = node;
		this.offset = offset;
	}

	equals(otherBreakToken) {
		if (!otherBreakToken) {
			return false;
		}
		if (this["node"] && otherBreakToken["node"] &&
			this["node"] !== otherBreakToken["node"]) {
			return false;
		}
		if (this["offset"] && otherBreakToken["offset"] &&
			this["offset"] !== otherBreakToken["offset"]) {
			return false;
		}
		return true;
	}

	toJSON(hash) {
		let node;
		let index = 0;
		if (!this.node) {
			return {};
		}
		if (isElement(this.node) && this.node.dataset.ref) {
			node = this.node.dataset.ref;
		} else if (hash) {
			node = this.node.parentElement.dataset.ref;
		}

		if (this.node.parentElement) {
			const children = Array.from(this.node.parentElement.childNodes);
			index = children.indexOf(this.node);
		}

		return JSON.stringify({
			"node": node,
			"index" : index,
			"offset": this.offset
		});
	}

}

export default BreakToken;
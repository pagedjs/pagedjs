import {
	isElement
} from "../utils/dom.js";

import Overflow from './overflow.js';

/**
 * BreakToken
 * @class
 */
class BreakToken {

	constructor(node, overflowArray) {
		this.node = node;
		this.overflow = overflowArray || [];
		this.finished = false;
	}

	equals(otherBreakToken) {
		if (this.node !== otherBreakToken.node) {
			return false;
		}

		if (otherBreakToken.overflow.length !== this.overflow.length) {
			return false;
		}

		for (const index in this.overflow) {
			if (!this.overflow[index].equals(otherBreakToken.overflow[index])) {
				return false;
			}
		}
		return true;
	}

	setFinished() {
		this.finished = true;
	}

	isFinished() {
		return this.finished;
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
			"offset": this.offset,
			"overflow": this.overflow,
		});

	}
}

export default BreakToken;
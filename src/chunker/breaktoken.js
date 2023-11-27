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

}

export default BreakToken;

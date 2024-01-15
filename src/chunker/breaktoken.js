/**
 * BreakToken
 * @class
 */
class BreakToken {

	constructor(node, overflowArray) {
		this.node = node;
		this.overflow = overflowArray || [];
		this.finished = false;
		this.breakNeededAt = [];
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

		let otherQueue = otherBreakToken.getForcedBreakQueue();
		for (const index in this.breakNeededAt) {
			if (!this.breakNeededAt[index].isEqualNode(otherQueue[index])) {
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

	addNeedsBreak(needsBreak) {
		this.breakNeededAt.push(needsBreak);
	}

	getNextNeedsBreak() {
		return this.breakNeededAt.shift();
	}

	getForcedBreakQueue() {
		return this.breakNeededAt;
	}

	setForcedBreakQueue(queue) {
		return this.breakNeededAt = queue;
	}
}

export default BreakToken;

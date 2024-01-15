/**
 * BreakToken
 * @class
 */
class BreakToken {

	constructor(node, overflowArray) {
		this.node = node;
		this.overflow = overflowArray || [];
		this.finished = false;
		this.breakNeededAt = undefined;
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

	setNeedsBreak(needsBreak) {
		this.breakNeededAt = needsBreak;
	}

	needsBreak() {
		return this.breakNeededAt;
	}

}

export default BreakToken;

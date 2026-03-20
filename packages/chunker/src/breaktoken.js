/**
 * Layout
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

}

export default BreakToken;
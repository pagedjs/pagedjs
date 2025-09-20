/**
 * Overflow
 * @class
 */
class Overflow {

	constructor(node, offset, overflowHeight, range, topLevel) {
		this.node = node;
		this.offset = offset;
		this.overflowHeight = overflowHeight;
		this.range = range;
		this.topLevel = topLevel;
	}

	equals(otherOffset) {
		if (!otherOffset) {
			return false;
		}
		if (this["node"] && otherOffset["node"] &&
			this["node"] !== otherOffset["node"]) {
			return false;
		}
		if (typeof this["offset"] === "number" && typeof otherOffset["offset"] === "number" &&
			this["offset"] !== otherOffset["offset"]) {
			return false;
		}
		return true;
	}

}

export default Overflow;

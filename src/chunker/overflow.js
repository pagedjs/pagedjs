/**
 * Overflow
 * @class
 */
class Overflow {

	constructor(node, offset, overflowHeight, range) {
		this.node = node;
		this.offset = offset;
		this.overflowHeight = overflowHeight;
		this.range = range;
	}

	equals(otherOffset) {
		if (!otherOffset) {
			return false;
		}
		if (this["node"] && otherOffset["node"] &&
			this["node"] !== otherOffset["node"]) {
			return false;
		}
		if (this["offset"] && otherOffset["offset"] &&
			this["offset"] !== otherOffset["offset"]) {
			return false;
		}
		return true;
	}

}

export default Overflow;
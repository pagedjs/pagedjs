/**
 * Represents an overflow area in a document or visual element.
 * Used to track positions and dimensions when content exceeds bounds.
 *
 * @class
 */
class Overflow {
	/**
	 * Creates an instance of Overflow.
	 *
	 * @param {Node} node - The DOM node associated with the overflow.
	 * @param {number} offset - The offset within the node where overflow begins.
	 * @param {number} overflowHeight - The height of the overflow content.
	 * @param {Range} range - The range object representing the overflow area.
	 * @param {boolean} topLevel - Indicates if this overflow is at the top level.
	 */
	constructor(node, offset, overflowHeight, range, topLevel) {
		this.node = node;
		this.offset = offset;
		this.overflowHeight = overflowHeight;
		this.range = range;
		this.topLevel = topLevel;
	}

	/**
	 * Checks if this overflow object is equal to another based on node and offset.
	 *
	 * @param {Object} otherOffset - Another object with `node` and `offset` properties to compare against.
	 * @param {Node} otherOffset.node - The node to compare.
	 * @param {number} otherOffset.offset - The offset to compare.
	 * @returns {boolean} True if both node and offset match, false otherwise.
	 */
	equals(otherOffset) {
		if (!otherOffset) {
			return false;
		}
		if (
			this["node"] &&
			otherOffset["node"] &&
			this["node"] !== otherOffset["node"]
		) {
			return false;
		}
		if (
			this["offset"] &&
			otherOffset["offset"] &&
			this["offset"] !== otherOffset["offset"]
		) {
			return false;
		}
		return true;
	}
}

export default Overflow;


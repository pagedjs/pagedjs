/**
 * Represents the result of a rendering operation.
 *
 * @class
 */
class RenderResult {
	/**
	 * Create a RenderResult.
	 *
	 * @param {Object} breakToken - A token indicating where rendering stopped due to overflow.
	 * @param {Error} [error] - Optional error encountered during rendering.
	 */
	constructor(breakToken, error) {
		/**
		 * The token where rendering ended or needs to continue.
		 * @type {Object}
		 */
		this.breakToken = breakToken;

		/**
		 * An optional error that occurred during rendering.
		 * @type {Error|undefined}
		 */
		this.error = error;
	}
}

/**
 * An error thrown when content cannot fit within the available layout space.
 *
 * @class
 * @extends {Error}
 */
export class OverflowContentError extends Error {
	/**
	 * Create an OverflowContentError.
	 *
	 * @param {string} message - The error message.
	 * @param {any[]} items - The content items that could not be rendered due to overflow.
	 */
	constructor(message, items) {
		super(message);

		/**
		 * The overflowing items that triggered this error.
		 * @type {any[]}
		 */
		this.items = items;
	}
}

export default RenderResult;

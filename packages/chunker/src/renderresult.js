/**
 * Render result.
 * @class
 */
class RenderResult {

	constructor(breakToken, error) {
		this.breakToken = breakToken;
		this.error = error;
	}
}

export class OverflowContentError extends Error {
	constructor(message, items) {
		super(message);
		this.items = items;
	}
}

export default RenderResult;

import EventEmitter from "event-emitter";

/**
 * Handler class that automatically registers methods as hook callbacks
 * based on hooks provided by chunker, polisher, and caller objects.
 *
 * It also extends its prototype with event-emitter capabilities,
 * allowing instances to emit and listen to events.
 *
 * @class Handler
 *
 * @param {Object} [chunker] - Optional object containing a `hooks` map.
 * @param {Object} [polisher] - Optional object containing a `hooks` map.
 * @param {Object} [caller] - Optional object containing a `hooks` map.
 *
 * @property {Object} chunker - Reference to the provided chunker object.
 * @property {Object} polisher - Reference to the provided polisher object.
 * @property {Object} caller - Reference to the provided caller object.
 */

class Handler {
	constructor(chunker, polisher, caller) {
		// Merge all hook maps from chunker, polisher, and caller into one object.
		// Only include hooks if the corresponding object exists.
		let hooks = Object.assign(
			{},
			chunker && chunker.hooks,
			polisher && polisher.hooks,
			caller && caller.hooks,
		);

		// Store references to the provided components
		this.chunker = chunker;
		this.polisher = polisher;
		this.caller = caller;

		// Loop through all hook names
		for (let name in hooks) {
			// Only register a hook if the Handler instance has a method with the same name
			if (name in this) {
				let hook = hooks[name];

				// Register the Handler's method as a callback for the hook
				// Bind ensures "this" refers to the Handler instance
				hook.register(this[name].bind(this));
			}
		}
	}
}

// Mix event emitter methods (on, off, emit, etc.) into Handler.prototype
EventEmitter(Handler.prototype);

export default Handler;

import pagedMediaHandlers from "../modules/paged-media/index.js";
import generatedContentHandlers from "../modules/generated-content/index.js";
import filters from "../modules/filters/index.js";
import EventEmitter from "event-emitter";
import pipe from "event-emitter/pipe.js";

/**
 * Array of all registered handler classes, composed from different modules.
 * @type {Array<Function>}
 */
export let registeredHandlers = [
	...pagedMediaHandlers,
	...generatedContentHandlers,
	...filters,
];

/**
 * Class responsible for instantiating and managing handler instances.
 * Emits events from all handlers through itself.
 */
export class Handlers {
	/**
	 * Creates a new Handlers manager.
	 * @param {Object} chunker - The chunker object used by handlers.
	 * @param {Object} polisher - The polisher object used by handlers.
	 * @param {Object} caller - The caller object used by handlers.
	 */
	constructor(chunker, polisher, caller) {
		/** @private @type {Array<Object>} */
		this.handlers = [];

		registeredHandlers.forEach((Handler) => {
			const handler = new Handler(chunker, polisher, caller);
			this.handlers.push(handler);
			pipe(handler, this);
		});
	}
}

// Mix event-emitter methods into Handlers prototype
EventEmitter(Handlers.prototype);

/**
 * Adds new handler classes to the list of registered handlers.
 * @param {...Function} handlers - One or more handler classes to register.
 */
export function registerHandlers(...handlers) {
	registeredHandlers.push(...handlers);
}

/**
 * Creates and initializes a new Handlers instance.
 * @param {Object} chunker - The chunker object to pass to handlers.
 * @param {Object} polisher - The polisher object to pass to handlers.
 * @param {Object} caller - The caller object to pass to handlers.
 * @returns {Handlers} The initialized Handlers instance.
 */
export function initializeHandlers(chunker, polisher, caller) {
	return new Handlers(chunker, polisher, caller);
}

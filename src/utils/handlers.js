import pagedMediaHandlers from "../modules/paged-media/index";
import generatedContentHandlers from "../modules/generated-content/index";
import filters from "../modules/filters/index";
import EventEmitter from "event-emitter";
import pipe from "event-emitter/pipe";

export let registeredHandlers = [...pagedMediaHandlers, ...generatedContentHandlers, ...filters];

export class Handlers {
	constructor(chunker, polisher, caller) {
		let handlers = [];

		registeredHandlers.forEach((Handler) => {
			let handler = new Handler(chunker, polisher, caller);
			handlers.push(handler);
			pipe(handler, this);
		});
	}
}

EventEmitter(Handlers.prototype);

export function registerHandlers() {
	for (var i = 0; i < arguments.length; i++) {
		registeredHandlers.push(arguments[i]);
	}
}

export function initializeHandlers(chunker, polisher, caller) {
	let handlers = new Handlers(chunker, polisher, caller);
	return handlers;
}

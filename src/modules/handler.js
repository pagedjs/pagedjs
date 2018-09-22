import EventEmitter from "event-emitter";

class Handler {
	constructor(chunker, polisher, caller) {
		let hooks = Object.assign({}, chunker && chunker.hooks, polisher && polisher.hooks, caller && caller.hooks);
		this.chunker = chunker;
		this.polisher = polisher;
		this.caller = caller;

		for (let name in hooks) {
			if (name in this) {
				let hook = hooks[name];
				hook.register(this[name].bind(this));
			}
		}
	}
}

EventEmitter(Handler.prototype);

export default Handler;

/**
 * EventEmitter mixin built on top of EventTarget.
 * Provides .on(), .off(), and .emit() convenience methods
 * compatible with the old event-emitter API.
 */
class EventEmitter extends EventTarget {
	on(type, fn) {
		let wrapper = (e) => fn(...e.detail);
		if (!this._listeners) this._listeners = new Map();
		if (!this._listeners.has(type)) this._listeners.set(type, new Map());
		this._listeners.get(type).set(fn, wrapper);
		this.addEventListener(type, wrapper);
		return this;
	}

	once(type, fn) {
		let wrapper = (e) => fn(...e.detail);
		if (!this._listeners) this._listeners = new Map();
		if (!this._listeners.has(type)) this._listeners.set(type, new Map());
		this._listeners.get(type).set(fn, wrapper);
		this.addEventListener(type, wrapper, { once: true });
		return this;
	}

	off(type, fn) {
		if (!this._listeners) return this;
		let typeMap = this._listeners.get(type);
		if (!typeMap) return this;
		let wrapper = typeMap.get(fn);
		if (wrapper) {
			this.removeEventListener(type, wrapper);
			typeMap.delete(fn);
		}
		return this;
	}

	emit(type, ...args) {
		this.dispatchEvent(new CustomEvent(type, { detail: args }));
		return this;
	}
}

/**
 * Pipe all events from source to dest.
 * Intercepts emit on the source so that every event is also emitted on dest.
 */
export function pipe(source, dest) {
	const originalEmit = source.emit.bind(source);
	source.emit = function (type, ...args) {
		originalEmit(type, ...args);
		dest.emit(type, ...args);
		return source;
	};
}

export default EventEmitter;

import Handler from "../handler.js";

class ScriptsFilter extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	filter(content) {
		content.querySelectorAll("script").forEach( script => { script.remove(); });
	}

}

export default ScriptsFilter;

import Handler from "../handler";

class ScriptsFilter extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	filter(content) {
		content.querySelectorAll("script").forEach( script => { script.remove(); });
	}

}

export default ScriptsFilter;

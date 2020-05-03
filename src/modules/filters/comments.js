import Handler from "../handler";
import {filterTree} from "../../utils/dom";

class CommentsFilter extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	filter(content) {
		filterTree(content, null, NodeFilter.SHOW_COMMENT);
	}

}

export default CommentsFilter;

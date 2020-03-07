import Handler from "../handler";
import csstree from "css-tree";

class removeNode extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
    }

    beforeParsed(content) {
        // remove all script elements
        content.querySelectorAll("script").forEach( script => { script.remove(); })
    }
    layoutNode(node) {
        if(node.tagName === "script") {
            node.remove();
        }

    }

}
export default removeNode;

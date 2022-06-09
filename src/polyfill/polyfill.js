import Previewer from "./previewer.js";
import * as Paged from "../index.js";

window.Paged = Paged;

let ready = new Promise(function(resolve, reject){
	if (document.readyState === "interactive" || document.readyState === "complete") {
		resolve(document.readyState);
		return;
	}

	document.onreadystatechange = function ($) {
		if (document.readyState === "interactive") {
			resolve(document.readyState);
		}
	};
});

let config = window.PagedConfig || {
	auto: true,
	before: undefined,
	after: undefined,
	content: undefined,
	stylesheets: undefined,
	renderTo: undefined,
	settings: undefined
};

let previewer = new Previewer(config.settings);

ready.then(async function () {
	let done;
	if (config.before) {
		await config.before();
	}

	if(config.auto !== false) {
		done = await previewer.preview(config.content, config.stylesheets, config.renderTo);
	}


	if (config.after) {
		await config.after(done);
	}
});

export default previewer;

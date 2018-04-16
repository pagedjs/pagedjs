import Chunker from '../chunker/chunker';
import Styler from '../styles/styler';

// let ready = new Promise(function($){document.addEventListener('DOMContentLoaded',$,{once:true})});

let ready = new Promise(function(resolve, reject){
	if (document.readyState === "interactive" || document.readyState === "complete") {
		resolve(document.readyState);
		return;
	}

	document.onreadystatechange = function ($) {
		if (document.readyState === "interactive") {
			resolve(document.readyState);
		}
	}
});

ready.then(async function () {
	let preview = true;
	let url = new URL(window.location);
	let params = new URLSearchParams(url.search);
	for(var pair of params.entries()) {
		if(pair[0] === "preview") {
			preview = (pair[1] === "true");
		}
	}

	// Wrap body in template tag
	let body = document.querySelector("body");

	// Check if a template exists
	let template;
	template = body.querySelector(":scope > template");

	if (!template) {
		// Otherwise create one
		template = document.createElement("template");
		template.innerHTML = body.innerHTML;
		body.innerHTML = '';
		body.appendChild(template);
	}

	// Get all stylesheets
	let stylesheets = Array.from(document.querySelectorAll("link[rel='stylesheet']"));
	let hrefs = stylesheets.map((sheet) => {
		sheet.remove();
		return sheet.href;
	});

	// TODO: add inline styles

	// Process styles
	let styles = new Styler();
	let styleText = await styles.add(...hrefs);


	// Chunk contents
	let chunker = new Chunker(undefined, body, styles, preview);

	let counter = 0;
	chunker.on("page", () => {
		counter += 1;
		if (typeof window.PuppeteerLogger !== "undefined") {
			window.PuppeteerLogger("page");
		}
	})

	let startTime = performance.now();

	// Render flow
	let flow = await chunker.flow(template.content, styles);

	let endTime = performance.now();
	let msg = "Rendering " + flow.total + " pages took " + (endTime - startTime) + " milliseconds.";

	if (typeof window.onPagesRendered !== "undefined") {
		window.onPagesRendered(msg, styles.width.value + styles.width.unit, styles.height.value + styles.height.unit, styles.orientation);
	}

});

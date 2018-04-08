import Chunker from '../chunker/chunker';
import Styler from '../styles/styler';

// let ready = new Promise(function($){document.addEventListener('DOMContentLoaded',$,{once:true})});

let ready = new Promise(function(resolve, reject){
	document.onreadystatechange = function ($) {
		if (document.readyState === "interactive") {
			resolve($);
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

	let startTime = performance.now();

	// Render flow
	let flow = await chunker.flow(template.content, styles);

	let endTime = performance.now();
	console.log("Rendering " + flow.total + " pages took " + (endTime - startTime) + " milliseconds.");

});

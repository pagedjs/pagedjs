import Previewer from './previewer';

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

let paged = new Previewer();

window.PagedPolyfill = paged;

ready.then(async function () {
	await paged.preview();
});

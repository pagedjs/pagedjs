import Previewer from './previewer';
import * as Paged from '../index';

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

let previewer = new Previewer();

window.PagedPolyfill = previewer;
window.Paged = Paged;

ready.then(async function () {
	await previewer.preview();
});

export function getBoundingClientRect(element) {
	if (!element) {
		return;
	}
	let rect;
	if (element.getBoundingClientRect) {
		rect = element.getBoundingClientRect();
	} else {
		let range = document.createRange();
		range.selectNode(element);
		rect = range.getBoundingClientRect();
	}
	return rect;
}

/**
 * Generates a UUID
 * based on: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 * @returns {string} uuid
 */
export function UUID() {
	var d = new Date().getTime();
	if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
			d += performance.now(); //use high-precision timer if available
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
}

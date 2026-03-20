import ePub from "epubjs";
// import JSZip from "jszip";

// window.JSZip = JSZip;

class Epub {
	constructor(bookData) {
		// this.epub = ePub({
		//   worker: false,
		//   replacements: true
		// });
	}

	open(bookData){
		return ePub(bookData, {replacements: true} ).then((book) => {
			this.book = book;
			return this.sections(this.book.spine);
		});
	}

	async sections(spine) {
		let text = "";
		let pattern = /<body[^>]*>((.|[\n\r])*)<\/body>/im;

		for (let section of spine) {
			let href = section.href;
			let html = await fetch(href)
				.then((response) => {
					return response.text();
				}).then((t) => {
					let matches = pattern.exec(t);
					return matches && matches.length && matches[1];
				});
			text += html;
			// let body = html.querySelector("body");
			// text += body.innerHTML;
		}
		return text;
	}

}

export default Epub;

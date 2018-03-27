import Sheet from './sheet.js';

class Styler {
  constructor() {
		this.sheets = [];
  }

	async add(href) {
		let sheet;
	 	return await fetch(href)
			.then((response) => {
				return response.text();
			}).then((text) => {
				sheet = new Sheet(text);
			});
	}

}

export default Styler;

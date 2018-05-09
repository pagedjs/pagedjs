import { Chunker } from '../../src/index.js';

describe('Chunker', async () => {

		it('should create a page area', async () => {
			let chunker = new Chunker();
			expect(chunker.pagesArea.classList).toContain('pages');
		})

})

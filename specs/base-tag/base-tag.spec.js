const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("base-tag", () => {
	let pageTag;
	let pageNoTag;
	let pageNoTagWithImage;
	beforeAll(async () => {
		pageTag = await loadPage("base-tag/base-tag.html");
		pageNoTag = await loadPage("base-tag/base-tag-no-tag.html");
		pageNoTagWithImage = await loadPage("base-tag/base-tag-no-tag-with-image.html");
		return Promise.all([pageTag.rendered, pageNoTag.rendered, pageNoTagWithImage.rendered]);
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await pageTag.close();
			await pageNoTag.close();
			await pageNoTagWithImage.close();
		}
	});

	if (!DEBUG) {
		it("should have image without no tag", async () => {
			let pdf = await pageNoTagWithImage.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});

		it("should have image", async () => {
			let pdf = await pageTag.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});

		it("should not have image", async () => {
			let pdf = await pageNoTag.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
}
);

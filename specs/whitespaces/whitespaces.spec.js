const TIMEOUT = 10000; // Some book might take longer than this to renderer



describe("whitespaces", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("whitespaces/whitespaces.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should properly ignore white space characters", async () => {
		async function getCharCodes(page, selector) {
			return await page.$eval(selector, (el) => el.textContent.split("").map(l => l.charCodeAt(0)));
		}

		const singleNbspCharCodes = await getCharCodes(page, ".whitespaces-a");
		expect(singleNbspCharCodes).toEqual([160]);

		const twoNbspCharCodes = await getCharCodes(page, ".whitespaces-b");
		expect(twoNbspCharCodes).toEqual([160, 160]);

		const twoNbspAndLetterCCharCodes = await getCharCodes(page, ".whitespaces-c");
		expect(twoNbspAndLetterCCharCodes).toEqual([160, 160, 99]);

		const threeNbspCharCodes = await getCharCodes(page, ".whitespaces-d");
		expect(threeNbspCharCodes).toEqual([160, 160, 160]);

		const emptyCharCodes = await getCharCodes(page, ".whitespaces-e");
		expect(emptyCharCodes).toEqual([]);

		const oneSpaceCharCodes = await getCharCodes(page, ".whitespaces-f");
		expect(oneSpaceCharCodes).toEqual([]);

		const twoSpacesCharCodes = await getCharCodes(page, ".whitespaces-g");
		expect(twoSpacesCharCodes).toEqual([]);

		const twoThinSpacesCharCodes = await getCharCodes(page, ".whitespaces-h");
		expect(twoThinSpacesCharCodes).toEqual([8201, 8201]);

		const twoTabsCharCodes = await getCharCodes(page, ".whitespaces-i");
		expect(twoTabsCharCodes).toEqual([]);

		const twoTabsAndNewLineCharCodes = await getCharCodes(page, ".whitespaces-j");
		expect(twoTabsAndNewLineCharCodes).toEqual([]);

		const spacesTabAndNewLineCharCodes = await getCharCodes(page, ".whitespaces-k");
		expect(spacesTabAndNewLineCharCodes).toEqual([]);

		const NonBreakingSpaceAndSpacesCharCodes = await getCharCodes(page, ".whitespaces-l");
		expect(NonBreakingSpaceAndSpacesCharCodes).toEqual([160, 32, 32, 32, 32]);

		const spacesAndNonBreakingSpaceCharCodes = await getCharCodes(page, ".whitespaces-m");
		expect(spacesAndNonBreakingSpaceCharCodes).toEqual([32, 32, 32, 160]);
	});
}
);

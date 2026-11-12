import Queue, { nextTick, TICK_FALLBACK_DELAY } from "./queue.js";

describe("Queue", () => {
	let frames;

	beforeEach(() => {
		jest.useFakeTimers();
		frames = [];
		jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
			frames.push(callback);
			return frames.length;
		});
		jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	/**
	 * Test: runs queued tasks when no animation frame comes
	 *
	 * Background tabs and headless printing render no frames, so the queue
	 * must move on after the fallback delay instead of waiting forever.
	 */
	it("runs queued tasks when no animation frame comes", async () => {
		let queue = new Queue();
		let task = jest.fn();

		let done = queue.enqueue(task);
		// The frame was requested but never comes; only the fallback timer can run the task.
		expect(frames).toHaveLength(1);
		expect(task).not.toHaveBeenCalled();

		jest.advanceTimersByTime(TICK_FALLBACK_DELAY);
		await done;

		expect(task).toHaveBeenCalledTimes(1);
	});

	/**
	 * Test: runs the callback once when the frame comes first
	 *
	 * In a rendering page the animation frame wins, and the fallback timer
	 * must not run the callback a second time.
	 */
	it("runs the callback once when the frame comes first", () => {
		let callback = jest.fn();

		nextTick(callback);
		frames.forEach((frame) => frame(0));
		jest.advanceTimersByTime(TICK_FALLBACK_DELAY);

		expect(callback).toHaveBeenCalledTimes(1);
	});

	/**
	 * Test: runs the callback once when a frame comes after the fallback
	 *
	 * Headless printing still renders a few late frames; a frame that arrives
	 * after the fallback timer must not run the callback a second time.
	 */
	it("runs the callback once when a frame comes after the fallback", () => {
		let callback = jest.fn();

		nextTick(callback);
		jest.advanceTimersByTime(TICK_FALLBACK_DELAY);
		frames.forEach((frame) => frame(0));

		expect(callback).toHaveBeenCalledTimes(1);
	});

	/**
	 * Test: cancels the frame request when the fallback runs first
	 *
	 * A page that renders no frames keeps every frame request until it is
	 * cancelled, so each tick must drop its request once the timer has run.
	 */
	it("cancels the frame request when the fallback runs first", () => {
		nextTick(jest.fn());
		expect(window.cancelAnimationFrame).not.toHaveBeenCalled();

		jest.advanceTimersByTime(TICK_FALLBACK_DELAY);

		expect(window.cancelAnimationFrame).toHaveBeenCalledTimes(1);
		expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
	});

	/**
	 * Test: clears the fallback timer when the frame comes first
	 *
	 * In a rendering page the frame wins every tick, and its timer must not
	 * stay armed.
	 */
	it("clears the fallback timer when the frame comes first", () => {
		nextTick(jest.fn());
		expect(jest.getTimerCount()).toBe(1);

		frames.forEach((frame) => frame(0));

		expect(jest.getTimerCount()).toBe(0);
	});
});

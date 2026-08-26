const rootSuite = createSuite(null);
let activeSuite = rootSuite;
let cases = [];

function createSuite(parent) {
	return {
		parent,
		beforeAll: [],
		beforeEach: [],
		afterEach: [],
		afterAll: [],
	};
}

export function resetSuite() {
	rootSuite.beforeAll.length = 0;
	rootSuite.beforeEach.length = 0;
	rootSuite.afterEach.length = 0;
	rootSuite.afterAll.length = 0;
	activeSuite = rootSuite;
	cases = [];
}

export function describe(_name, register) {
	const parent = activeSuite;
	activeSuite = createSuite(parent);
	try {
		register();
	} finally {
		activeSuite = parent;
	}
}

export function it(name, run) {
	cases.push({ name, run, suite: activeSuite });
}

export function beforeAll(run) {
	activeSuite.beforeAll.push(run);
}

export function beforeEach(run) {
	activeSuite.beforeEach.push(run);
}

export function afterEach(run) {
	activeSuite.afterEach.push(run);
}

export function afterAll(run) {
	activeSuite.afterAll.push(run);
}

function suiteChain(suite) {
	const chain = [];
	for (let current = suite; current; current = current.parent) {
		chain.unshift(current);
	}
	return chain;
}

export async function runCase(name) {
	const matches = cases.filter((entry) => entry.name === name);
	if (matches.length !== 1) {
		throw new Error(`Expected one browser test named "${name}", found ${matches.length}.`);
	}

	const entry = matches[0];
	const chain = suiteChain(entry.suite);
	for (const suite of chain) {
		for (const hook of suite.beforeAll) await hook();
		for (const hook of suite.beforeEach) await hook();
	}

	try {
		await entry.run();
	} finally {
		for (const suite of [...chain].reverse()) {
			for (const hook of suite.afterEach) await hook();
			for (const hook of suite.afterAll) await hook();
		}
	}
}

function deepEqual(actual, expected, seen = new WeakMap()) {
	if (Object.is(actual, expected)) return true;
	if (
		typeof actual !== "object"
		|| actual === null
		|| typeof expected !== "object"
		|| expected === null
	) {
		return false;
	}
	if (Object.getPrototypeOf(actual) !== Object.getPrototypeOf(expected)) return false;
	if (seen.get(actual) === expected) return true;
	seen.set(actual, expected);

	if (actual instanceof Date) return actual.getTime() === expected.getTime();
	if (actual instanceof RegExp) return actual.toString() === expected.toString();
	if (actual instanceof Set) {
		return actual.size === expected.size
			&& [...actual].every((value) => expected.has(value));
	}
	if (actual instanceof Map) {
		return actual.size === expected.size
			&& [...actual].every(
				([key, value]) => expected.has(key) && deepEqual(value, expected.get(key), seen),
			);
	}

	const actualKeys = Reflect.ownKeys(actual).filter((key) =>
		Object.prototype.propertyIsEnumerable.call(actual, key),
	);
	const expectedKeys = Reflect.ownKeys(expected).filter((key) =>
		Object.prototype.propertyIsEnumerable.call(expected, key),
	);
	return actualKeys.length === expectedKeys.length
		&& actualKeys.every(
			(key, index) => key === expectedKeys[index]
				&& deepEqual(actual[key], expected[key], seen),
		);
}

function display(value) {
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "function") return value.toString();
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function createExpectation(actual, label, negated = false) {
	const check = (pass, message) => {
		if (negated ? pass : !pass) {
			throw new Error(label ? `${label}: ${message}` : message);
		}
	};
	const expectation = {
		toBe(expected) {
			check(Object.is(actual, expected), `Expected ${display(actual)} to be ${display(expected)}.`);
		},
		toEqual(expected) {
			check(deepEqual(actual, expected), `Expected ${display(actual)} to equal ${display(expected)}.`);
		},
		toContain(expected) {
			check(actual?.includes(expected), `Expected ${display(actual)} to contain ${display(expected)}.`);
		},
		toHaveLength(expected) {
			check(actual?.length === expected, `Expected length ${expected}, received ${actual?.length}.`);
		},
		toHaveProperty(property) {
			check(
				actual != null && property in Object(actual),
				`Expected ${display(actual)} to have property ${display(property)}.`,
			);
		},
		toBeDefined() {
			check(actual !== undefined, "Expected value to be defined.");
		},
		toBeUndefined() {
			check(actual === undefined, `Expected ${display(actual)} to be undefined.`);
		},
		toBeNull() {
			check(actual === null, `Expected ${display(actual)} to be null.`);
		},
		toMatch(expected) {
			const pass = expected instanceof RegExp
				? expected.test(actual)
				: String(actual).includes(String(expected));
			check(pass, `Expected ${display(actual)} to match ${display(expected)}.`);
		},
		toThrow(expected) {
			let thrown;
			try {
				actual();
			} catch (error) {
				thrown = error;
			}
			let pass = thrown !== undefined;
			if (pass && expected instanceof RegExp) pass = expected.test(String(thrown?.message ?? thrown));
			if (pass && typeof expected === "string") {
				pass = String(thrown?.message ?? thrown).includes(expected);
			}
			check(pass, `Expected function ${expected ? `to throw ${expected}` : "to throw"}.`);
		},
		toHaveBeenCalledTimes(expected) {
			const received = actual?.mock?.calls?.length;
			check(received === expected, `Expected ${expected} calls, received ${received}.`);
		},
	};
	Object.defineProperty(expectation, "not", {
		get: () => createExpectation(actual, label, !negated),
	});
	return expectation;
}

export function expect(actual, label) {
	return createExpectation(actual, label);
}

export const vi = {
	spyOn(target, property) {
		const original = target[property];
		let implementation = (...args) => original.apply(target, args);
		const spy = function spy(...args) {
			spy.mock.calls.push(args);
			return implementation.apply(this, args);
		};
		spy.mock = { calls: [] };
		spy.mockImplementation = (replacement) => {
			implementation = replacement;
			return spy;
		};
		spy.mockRestore = () => {
			target[property] = original;
		};
		target[property] = spy;
		return spy;
	},
};

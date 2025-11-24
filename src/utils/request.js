/**
 * Performs an HTTP request using XMLHttpRequest and returns a Promise resolving to a Response.
 *
 * @param {string} url - The URL to request.
 * @param {Object} [options={}] - Optional settings for the request.
 * @param {string} [options.method="get"] - HTTP method to use (e.g., "GET", "POST").
 * @param {Object.<string, string>} [options.headers] - Headers to set on the request.
 * @param {string} [options.credentials] - Whether to send cookies with the request ("include" to send).
 * @param {Document | BodyInit | null} [options.body] - The body of the request, for methods like POST.
 * @returns {Promise<Response>} Promise resolving to a Response object containing the response text and status.
 */
export default async function request(url, options = {}) {
	return new Promise(function (resolve, reject) {
		let request = new XMLHttpRequest();

		request.open(options.method || "get", url, true);

		for (let i in options.headers) {
			request.setRequestHeader(i, options.headers[i]);
		}

		request.withCredentials = options.credentials === "include";

		request.onload = () => {
			// Chrome returns a status code of 0 for local files
			const status =
				request.status === 0 && url.startsWith("file://")
					? 200
					: request.status;
			resolve(new Response(request.responseText, { status }));
		};

		request.onerror = reject;

		request.send(options.body || null);
	});
}

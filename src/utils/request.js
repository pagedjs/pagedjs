export default async function request(url, options={}) {
	return new Promise(function(resolve, reject) {
		let request = new XMLHttpRequest();

		request.open(options.method || "get", url, true);

		for (let i in options.headers) {
			request.setRequestHeader(i, options.headers[i]);
		}

		request.withCredentials = options.credentials === "include";

		request.onload = () => {
			// Chrome returns a status code of 0 for local files
			const status = request.status === 0 && url.startsWith("file://") ? 200 : request.status;
			resolve(new Response(request.responseText, {status}));
		};

		request.onerror = reject;

		request.send(options.body || null);
	});
}

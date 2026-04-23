import { defineConfig } from "vite";
import { resolve } from "path";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const banner = `/*! @license Paged.js v${pkg.version} | MIT | https://github.com/pagedjs/pagedjs */`;

function bannerPlugin() {
	return {
		name: "banner",
		enforce: "post",
		generateBundle(options, bundle) {
			for (const chunk of Object.values(bundle)) {
				if (chunk.type === "chunk") {
					chunk.code = banner + "\n" + chunk.code;
				}
			}
		},
	};
}

export default defineConfig(({ mode }) => {
	if (mode === "polyfill") {
		return {
			build: {
				lib: {
					entry: resolve(__dirname, "src/polyfill/polyfill.js"),
					name: "PagedPolyfill",
					formats: ["iife"],
					fileName: () => "paged.polyfill.js",
				},
				sourcemap: true,
				minify: false,
				emptyOutDir: false,
			},
			plugins: [bannerPlugin()],
		};
	}

	return {
		build: {
			lib: {
				entry: resolve(__dirname, "src/index.js"),
				formats: ["es"],
				fileName: () => "paged.js",
			},
			sourcemap: true,
			minify: false,
		},
		plugins: [bannerPlugin()],
		server: {
			port: 9090,
			cors: true,
			headers: {
				"Service-Worker-Allowed": "/",
			},
		},
		test: {
			include: ["src/**/*.test.js"],
			globals: true,
			environment: "jsdom",
		},
	};
});

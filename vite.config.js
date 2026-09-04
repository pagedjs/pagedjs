import { defineConfig } from "vite";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

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

function transformerNoticesPlugin() {
	return {
		name: "transformer-notices",
		generateBundle() {
			const entry = fileURLToPath(import.meta.resolve("@pagedjs/css-transformer"));
			this.emitFile({
				type: "asset",
				fileName: "THIRD-PARTY-NOTICES.txt",
				source: readFileSync(resolve(dirname(entry), "THIRD-PARTY-NOTICES.txt"), "utf8"),
			});
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
			plugins: [bannerPlugin(), transformerNoticesPlugin()],
		};
	}

	return {
		build: {
			lib: {
				entry: resolve(__dirname, "src/index.js"),
				formats: ["es"],
				fileName: () => "paged.js",
			},
			rollupOptions: {
				// The library build leaves the engine external so an app importing
				// both pagedjs and fragmentainers gets one copy: two copies mean two
				// sets of module singletons and custom element classes, and
				// `instanceof` against the losing copy is false for every element.
				external: [/^fragmentainers(\/.*)?$/, "@pagedjs/css-transformer"],
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
	};
});

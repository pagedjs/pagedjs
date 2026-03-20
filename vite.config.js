import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	root: ".",
	server: {
		port: 9090,
		open: "/examples/",
		cors: true,
	},
	build: {
		lib: {
			entry: resolve(__dirname, "src/polyfill.js"),
			name: "PagedPolyfill",
			formats: ["umd"],
			fileName: () => "paged.polyfill.js",
		},
		outDir: "dist",
		emptyOutDir: false,
	},
});

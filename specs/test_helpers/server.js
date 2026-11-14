import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static(path.join(__dirname, "../../")));
const port = Number(process.env.PAGED_SPEC_PORT ?? 9999);
app.listen(port, () => {
	console.log(`Test server listening on http://localhost:${port}`);
});

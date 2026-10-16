import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static(path.join(__dirname, "../../")));
app.listen(9999, () => {
	console.log("Test server listening on http://localhost:9999");
});

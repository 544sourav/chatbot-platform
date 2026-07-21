import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import { companiesRouter } from "./routes/companies.routes.js";
import { botsRounter } from "./routes/bots.routes.js";
import { documentRouter } from "./routes/document.routes.js";
import { chatRouter } from "./routes/chat.routes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// build the widget with open CORS for now, lock down allowed domains later once the feature actually works 
//We'd add an allowedDomains field to the Bot model (e.g., a list like ["acmecorp.com", "app.acmecorp.com"]) — something the company configures in their dashboard
app.use(cors());
app.use(express.json());


app.use(express.static(join(__dirname, "../public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/companies", companiesRouter);
app.use("/bots",botsRounter);
app.use("/document", documentRouter);
app.use("/bots", chatRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

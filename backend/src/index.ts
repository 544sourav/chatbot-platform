import "dotenv/config";
import express from "express";
import cors from "cors";
import { companiesRouter } from "./routes/companies.routes.js";
import { botsRounter } from "./routes/bots.routes.js";
import { documentRouter } from "./routes/document.routes.js";
import { chatRouter } from "./routes/chat.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

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

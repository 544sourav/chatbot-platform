import { Router } from "express";
import { requireCompanyAuth } from "../middleware/requireCompanyAuth.js";
import { createBot, getPublicConfig, listBots } from "../controllers/bots.controller.js";

export const botsRounter = Router();


botsRounter.post("/",requireCompanyAuth,createBot);
botsRounter.get("/",requireCompanyAuth,listBots);
botsRounter.get("/:botId/public-config", getPublicConfig);
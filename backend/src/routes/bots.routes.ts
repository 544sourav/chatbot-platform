import { Router } from "express";
import { requireCompanyAuth } from "../middleware/requireCompanyAuth.js";
import { createBot, listBots } from "../controllers/bots.controller.js";

export const botsRounter = Router();


botsRounter.post("/",requireCompanyAuth,createBot);
botsRounter.get("/",requireCompanyAuth,listBots);
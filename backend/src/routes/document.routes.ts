import { Router } from "express";
import { uploadDocuments } from "../controllers/documents.controller.js";
import { requireCompanyAuth } from "../middleware/requireCompanyAuth.js";
import { upload } from "../lib/upload.js";

export const documentRouter = Router();

documentRouter.post("/:botId/upload",requireCompanyAuth, upload.array("files", 10), uploadDocuments );
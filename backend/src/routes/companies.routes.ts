import { Router } from "express";
import { createCompany, getCompanyById } from "../controllers/companies.controller.js";


export const companiesRouter = Router();

companiesRouter.post("/", createCompany);
companiesRouter.get("/:id", getCompanyById);
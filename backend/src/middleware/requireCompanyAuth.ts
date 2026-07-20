import type { Request, Response, NextFunction } from "express";

import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      company?: { id: string; name: string };
    }
  }
}
export async function requireCompanyAuth(   req:Request ,res:Response,next: NextFunction){
    try{
        const apiKey  = req.header("x-api-key");
        if(!apiKey){
            return res.status(401).json({
              success: false,
              message: "Missing x-api-key header",
            });
        }
        const company  = await prisma.company.findUnique({where:{apiKey}});
        if(!company){
            return res.status(401).json({
                success:false,
                message:"Invalid API key"
            })
        }
        req.company = {id:company.id, name:company.name};
        next();
    }
    catch(err){
        console.error(err);

        if (err instanceof Error) {
          return res.status(500).json({
            success: false,
            message: err.message,
          });
        }

        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
    }
}
import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import fs from "fs"
import { ingestionQueue } from "../lib/queues.js";



export async function uploadDocuments(req:Request,res:Response){
    try{
        const {botId} = req.params;
        const files = req.files as Express.Multer.File[]
        // console.log(!files)
        if (typeof botId !== "string") {
          return res.status(400).json({
            success: false,
            message: "Invalid botId",
          });
        }
        if (!req.company){
            return res.status(401).json({
            success: false,
            message: "unathorized",
            });
        }
          if (!files || files.length === 0) {
            return res.status(400).json({
              success: false,
              message: "no pdf file uploaded",
            });
          }
        const bot = await prisma.bot.findFirst({
            where: {id:botId, companyID :req.company?.id},
        })
        
        if(!bot){
            files.forEach((file)=>fs.unlinkSync(file.path))
            return res.status(400).json({
                success:false,
                message:"bot not found"
            })
        }

        const createdDocument =[];

        for(const file of files){
            const document = await prisma.document.create({
              data: {
                botID: bot.id,
                sourceType: "PDF",
                sourceRef: file.path,
                status: "PENDING",
              },
            });

            await ingestionQueue.add("process-Document", {
              documentId: document.id,
              botId: bot.id,
              sourceType: "PDF",
              sourceRef: file.path,
            });
            createdDocument.push(document);
        }
        return res.status(201).json({
            success:true,
            message:"document uploaded",
            data:createdDocument
        })
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
          message: "Something went Wrong! please try again later",
        });
    }
}
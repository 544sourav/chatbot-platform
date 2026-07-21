import type { Request, Response } from "express";
import { success, z } from "zod";
import { prisma } from "../lib/prisma.js";

const createBotSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function createBot(req: Request, res: Response) {
  try {
    const parsed = createBotSchema.safeParse(req.body);
    if (req.company?.id === undefined) {
      throw new Error("invalid companyid");
    }
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.flatten(),
      });
    }

    const bot = await prisma.bot.create({
      data: {
        name: parsed.data.name,
        companyID: req.company.id,
      },
    });
    return res.status(201).json({
        success:true,
        message:"bot created successfully",
        data:bot
    })
  } catch (err) {
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

export async function listBots(req:Request,res:Response){
    try{
        const bots = await prisma.bot.findMany({
            where:{companyID: req.company!.id},
            orderBy :{createdAt: "desc"}
        })
        return res.status(200).json({
            success:true,
            message:"bots fetched successfully",
            data:bots
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
          message: "Internal Server Error",
        });
    }
}

export async function getPublicConfig(req:Request,res:Response){
  try{
    const {botId} = req.params;
    if(!botId || typeof botId !=="string"){
      return res.status(400).json({
        success:false,
        message:"BotID is missing or in invalid format"
      })
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: {
        id: true,
        name: true,
        greetingMessage: true,
        theme: true,
      },
    });

    if(!bot){
      return res.status(400).json({
        success:false,
        message:"bot is missing"
      })
    }
    return res.status(200).json({
      success:true,
      message:"bot details fetched",
      data:bot
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
      message: "Internal Server Error",
    });
  }
}
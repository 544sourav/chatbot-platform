import type { Request, Response } from "express";
import { parse } from "node:path";
import z,{ success }  from "zod";
import { prisma } from "../lib/prisma.js";
import { generateChatResponse } from "../services/chat.service.js";


const chatSchema = z.object({
  question: z.string().min(1).max(1000),
  conversationId: z.string().uuid().optional(),
  visitorId: z.string().min(1),
});

export async function chat (req:Request ,res:Response){
    try{
        const botId = req.params.botId;

        if (!botId || Array.isArray(botId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid bot id",
        });
        }

        const parsed = chatSchema.safeParse(req.body);

        if (!parsed.success) {
          return res
            .status(400)
            .json({ success: false, error: parsed.error.flatten() });
        }

        const { question, visitorId } = parsed.data;

        let { conversationId } = parsed.data;

        console.log("conversationid", conversationId);

        if (!conversationId) {
          const conversation = await prisma.conversation.create({
            data: {
              botID: botId,
              visitorID: visitorId,
            },
          });

          conversationId = conversation.id;
        }

        const previousMessage  = await prisma.message.findMany({
          where:{conversationID:conversationId},
          orderBy:{createdAt:"asc"},
          take:20,
        })

        console.log(previousMessage);
        const history = previousMessage.map((m)=>({
          role:m.role as "USER" | "ASSISTANT",
          content:m.content
        }))
        await prisma.message.create({
          data:{conversationID:conversationId,role:"USER",content:question}
        })
        const {answer,isFallback } =await  generateChatResponse(botId,question,history);

        await prisma.message.create({
            data:{conversationID:conversationId, role:"ASSISTANT",content:answer ,isFallback}
        })

        return res.status(200).json({
            success:true,
            data:{
                answer,
                conversationId,
                isFallback
            }
        })
    }
    catch(err){
        console.error(err);
        res
          .status(500)
          .json({
            success: false,
            error: "Something went wrong. Please try again.",
          });
    }
}
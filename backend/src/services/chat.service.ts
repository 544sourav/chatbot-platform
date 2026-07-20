import { GoogleGenAI } from "@google/genai";
import "dotenv/config"
import { prisma } from "../lib/prisma.js";
import { retrieveChunks } from "./retrieval.service.js";



interface HistoryMessage {
  role: "USER" | "ASSISTANT";
  content: string;
}


const genAI = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY!})

export async function generateChatResponse(
  botID: string,
  question: string,
  history: HistoryMessage[],
) {
  try {
    const bot = await prisma.bot.findUnique({
      where: { id: botID },
    });

    if (!bot) {
      throw new Error("No Bot Found");
    }

    const lastExchange = history
      .slice(-2)
      .map(
        (m) =>
          `${m.role === "USER" ? "Previous question" : "Previous answer"}: ${m.content}`,
      )
      .join("\n");

    const searchQuery = lastExchange
      ? `${lastExchange}\nCurrent question: ${question}`
      : question;


    const { chunks, isConfident } = await retrieveChunks(botID, searchQuery);
    
    // console.log(isConfident);
    // console.log(chunks);

    if (!isConfident) {
      return {
        answer: bot.fallbackMessage,
        isFallback: false,
      };
    }

    const historyText = history
      .slice(-10)
      .map((m) => `${m.role === "USER" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");
    
    
    const contextText = chunks.map((c) => c.content).join("\n\n---\n\n");
    const prompt = `You are ${bot.name}, a customer support assistant. Respond in a ${bot.persona} tone.

                    Answer the user's question using ONLY the information in the context below. Do not use any outside knowledge, and do not make assumptions beyond what is explicitly stated.

                    If the context does not contain enough information to answer the question, respond exactly with: "${bot.fallbackMessage}"

                    Context:
                    ${contextText}

                    ${historyText ? `Conversation so far:\n${historyText}\n` : ""}
                    Current question: ${question}`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    // console.log("response",response);
    const answer = response.text ?? bot.fallbackMessage;

    return {
      answer,
      isFallback: false,
    };
  } catch (err) {
    console.error("Error generating chat response:", err);

    return {
      answer:
        "Sorry, I am unable to process your request right now. Please try again later.",
      isFallback: true,
    };
  }
}
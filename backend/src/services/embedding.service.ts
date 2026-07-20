import { GoogleGenAI } from "@google/genai";

 const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts,
    config: {
      outputDimensionality: 768,
    },
  });

  const embeddings = response.embeddings;

  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error("Embedding generation failed or returned mismatched count");
  }

  return embeddings.map((e) => {
    if (!e.values) throw new Error("Missing embedding values in response");
    return e.values;
  });
}

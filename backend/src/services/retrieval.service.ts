import { boolean } from "zod";
import { prisma } from "../lib/prisma.js";
import { generateEmbeddings } from "./embedding.service.js";

interface RetrievedChunk {
  id: string;
  content: string;
  distance: number;
}
const CONFIDENCE_THRESHOLD = 0.6;
export async function retrieveChunks(
  botID: string,
  queryText: string,
  topK: number = 5,
): Promise<{chunks:RetrievedChunk[],isConfident:boolean}> {
  try {

    if (!botID?.trim()) {
      console.warn("retrieveChunks: Missing botID");
      return {chunks:[], isConfident:false};
    }

    if (!queryText?.trim()) {
      console.warn("retrieveChunks: Empty queryText");
      return { chunks: [], isConfident: false };
    }


    if (topK <= 0) {
      return { chunks: [], isConfident: false };
    }

  
    topK = Math.min(topK, 20);

    const embeddings = await generateEmbeddings([queryText]);

    if (
      !embeddings ||
      embeddings.length === 0 ||
      !embeddings[0] ||
      embeddings[0].length === 0
    ) {
      console.error("Failed to generate embedding.");
      return { chunks: [], isConfident: false };
    }

    const questionEmbedding = embeddings[0];

    const vectorString = `[${questionEmbedding.join(",")}]`;

    const results = await prisma.$queryRaw<RetrievedChunk[]>`
      SELECT
        id,
        content,
        embedding <-> ${vectorString}::vector AS distance
      FROM "Chunk"
      WHERE "botID" = ${botID}
      ORDER BY embedding <-> ${vectorString}::vector
      LIMIT ${topK};
    `;
    const firstResult = results[0];

    const isConfident = firstResult !== undefined && firstResult.distance < CONFIDENCE_THRESHOLD;
    return { chunks: results, isConfident };
  } catch (error) {
    console.error("retrieveChunks failed:", error);

    
    return { chunks: [], isConfident: false };
  }
}

import { Worker,Job } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import type { IngestionJobData } from "../lib/queues.js";
import {prisma} from "../lib/prisma.js"
import * as pdfParse from "pdf-parse";
import fs from "fs";
import { chunkText } from "../services/chunking.service.js";
import { generateEmbeddings } from "../services/embedding.service.js";

const worker = new Worker<IngestionJobData>(
    "document-ingestion", async(job:Job<IngestionJobData>)=>{
        // console.log(
        //   `Processing job ${job.id} for document ${job.data.documentId}`,
        // );
        const {documentId ,sourceRef} = job.data;
        await prisma.document.update({
          where: { id: documentId },
          data: { status: "PROCESSING" },
        });

        const fileBuffer = fs.readFileSync(sourceRef);
        const parser = new pdfParse.PDFParse({
          data: fileBuffer,
        });

        try {
          const parsed = await parser.getText();
          const rawText = parsed.text;
          
          const textChunks = chunkText(rawText);
          console.log(`Split into ${textChunks.length} chunks`);

          const embeddings = await generateEmbeddings(textChunks);
          console.log(`Generated ${embeddings.length} embeddings`);

          await prisma.chunk.deleteMany({ where: { documentID:documentId } });
          
          for(let i=0;i<textChunks.length;i++){
            const content = textChunks[i];
            const embedding = embeddings[i];
            const vectorString = `[${embedding?.join(",")}]`;
            
            await prisma.$executeRaw`
                  INSERT INTO "Chunk" (id, "documentID", "botID", content, embedding, "createdAt")
                  VALUES (gen_random_uuid(), ${documentId}, ${job.data.botId}, ${content}, ${vectorString}::vector, now());
            `;
          }
          await prisma.document.update({
            where: { id: documentId },
            data: { status: "READY" },
          });

          console.log(
            `Document ${documentId} marked READY with ${textChunks.length} chunks saved`,
          );
        } finally {
          await parser.destroy();
        }
    },
    {
        connection:redisConnection,
        concurrency:3,
    }
);
worker.on("completed",(job)=>{
    console.log(`Job ${job.id} completed successfully`);
})

worker.on("failed",async(job,err)=>{
    console.error(`Job ${job?.id} failed:`, err.message);
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await prisma.document.update({
        where: { id: job.data.documentId },
        data: {
          status: "FAILED",
          errorMessage: err.message,
        },
      });
      console.log(
        `Document ${job.data.documentId} marked FAILED after all retries exhausted`,
      );
    }
})
console.log("Ingestion worker started, waiting for jobs...");
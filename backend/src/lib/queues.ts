import { redisConnection } from "./redis.js";
import {Queue} from "bullmq"

export interface IngestionJobData {
    documentId :string,
    botId :string,
    sourceType : "PDF" | "URL" | "DOC",
    sourceRef : string
} 

export const ingestionQueue = new Queue<IngestionJobData>("document-ingestion", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
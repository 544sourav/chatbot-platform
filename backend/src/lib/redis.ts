import {Redis} from "ioredis";
import "dotenv/config";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined in environment variables");
}

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

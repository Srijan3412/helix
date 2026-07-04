import { Redis } from "ioredis";
import { config } from "./core/config/index.js";

async function main() {
  const redisUrl = config.REDIS_URL;
  console.log("Connecting to Redis:", redisUrl);

  const redis = new Redis(redisUrl);

  try {
    const keys = await redis.keys("job:*");
    console.log(`Found ${keys.length} job keys:`, keys);

    for (const key of keys) {
      const value = await redis.get(key);
      console.log(`${key} => ${value}`);
    }
  } catch (err) {
    console.error("Error connecting or querying Redis:", err);
  } finally {
    redis.disconnect();
  }
}

main().catch(console.error);

import { Redis } from "ioredis";
import { config } from "../config/index.js";
import { logger } from "../logger/index.js";

const memStore = new Map<string, string>();

class InMemoryRedis {
  async get(key: string) { return memStore.get(key) ?? null; }
  async set(key: string, value: string) { memStore.set(key, value); return "OK" as const; }
  async del(...keys: string[]) {
    let count = 0;
    for (const k of keys) {
      if (memStore.delete(k)) count++;
    }
    return count;
  }
  async keys(pattern: string) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return Array.from(memStore.keys()).filter(k => regex.test(k));
  }
  async ping() { return "PONG" as const; }
  async quit() { return "OK" as const; }
  on() { return this; }
}

let _conn: Redis | null = null;

async function initRedis(): Promise<Redis> {
  if (config.IN_MEMORY) {
    logger.info("⚠️ IN_MEMORY mode explicitly enabled. Using in-memory Redis.");
    return new InMemoryRedis() as unknown as Redis;
  }

  const client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    logger.error({ err }, "⚠️ Redis connection error occurred");
  });

  try {
    await client.connect();
    await client.ping();
    logger.info({ url: config.REDIS_URL }, "✅ Redis connected successfully");
    return client;
  } catch (err: any) {
    logger.warn("⚠️ Redis not reachable – using in-memory store (dev mode).");
    return new InMemoryRedis() as unknown as Redis;
  }
}

let _ready: Promise<Redis> | null = null;

function getReady(): Promise<Redis> {
  if (!_ready) {
    _ready = initRedis().then((c) => {
      _conn = c;
      return c;
    });
  }
  return _ready;
}

export const redis = new Proxy({} as Redis, {
  get(_t, prop: string) {
    if (!_conn) {
      getReady();
      return (..._args: unknown[]) => Promise.resolve(null);
    }
    const v = (_conn as any)[prop];
    return typeof v === "function" ? v.bind(_conn) : v;
  },
});

export { getReady as connectionReady };

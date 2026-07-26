import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env if present
dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default("4000"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  STORAGE_DIR: z.string().default("./storage"),
  GEMINI_API_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables configuration:", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

if (parsed.data.NODE_ENV === "production" && !parsed.data.GEMINI_API_KEY) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in production. AI features will run in fallback/mock mode.");
}

export const config = parsed.data;
export type Config = z.infer<typeof envSchema>;

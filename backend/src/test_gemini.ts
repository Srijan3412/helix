import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./core/config/index.js";

async function main() {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key configured");
    return;
  }
  console.log("Testing with API Key:", apiKey.substring(0, 8) + "...");
  const genAI = new GoogleGenerativeAI(apiKey);

  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-2.5-pro"];
  for (const modelName of models) {
    try {
      console.log(`\n--- Testing model: ${modelName} ---`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent("Say hello");
      console.log(`Success with ${modelName}:`, response.response.text().trim());
    } catch (err: any) {
      console.error(`Failed with ${modelName}:`, err.message);
    }
  }
}

main().catch(console.error);

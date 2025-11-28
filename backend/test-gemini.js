import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("ERROR: GEMINI_API_KEY not found in .env");
  process.exit(1);
}

console.log("Testing Gemini API with key:", API_KEY.substring(0, 10) + "...");

const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
  try {
    // List available models first
    console.log("Listing available models...");
    const models = await genAI.listModels();
    console.log("Available models:");
    models.forEach(model => {
      console.log(`- ${model.name} (${model.displayName || 'N/A'})`);
    });
    
    // Try to find a working model
    const modelNames = models.map(m => m.name.split('/').pop());
    console.log("\nTrying models:", modelNames);
    
    // Try gemini-1.5-pro-latest or gemini-pro-latest
    let workingModel = null;
    for (const modelName of ['gemini-1.5-pro-latest', 'gemini-pro-latest', 'gemini-1.5-flash-latest', 'gemini-pro']) {
      try {
        console.log(`\nTrying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello in one sentence");
        const response = await result.response;
        const text = response.text();
        console.log("SUCCESS! Response:", text);
        workingModel = modelName;
        break;
      } catch (e) {
        console.log(`Failed: ${e.message}`);
      }
    }
    
    if (!workingModel) {
      throw new Error("No working model found");
    }
    
    console.log(`\nWorking model: ${workingModel}`);
  } catch (error) {
    console.error("ERROR:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

test();


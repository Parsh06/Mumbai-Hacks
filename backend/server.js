import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not set in .env file");
  process.exit(1);
}

console.log("Gemini API Key loaded:", GEMINI_API_KEY ? "Yes" : "No");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.post("/api/investment-analysis", async (req, res) => {
  try {
    const { companyA, companyB, comparisonData, chartData } = req.body;

    if (!companyA || !companyB) {
      return res.status(400).json({ error: "Both companies are required" });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    console.log("Generating analysis for:", companyA.company_code, "vs", companyB.company_code);
    console.log("API Key length:", GEMINI_API_KEY?.length || 0);

    // Try different model names - the correct one depends on API version
    const modelNames = [
      "gemini-1.5-pro",
      "gemini-pro",
      "gemini-1.5-flash",
      "models/gemini-pro",
      "models/gemini-1.5-pro"
    ];
    
    let model = null;
    let lastError = null;
    
    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });
        // Test with a small prompt first
        const testResult = await model.generateContent("test");
        await testResult.response;
        console.log(`Successfully using model: ${modelName}`);
        break;
      } catch (e) {
        console.log(`Model ${modelName} failed: ${e.message}`);
        lastError = e;
        continue;
      }
    }
    
    if (!model) {
      throw new Error(`No working model found. Last error: ${lastError?.message || "Unknown"}`);
    }

    const prompt = `You are a financial analyst providing investment recommendations. Analyze the following two companies and determine which is the better investment opportunity.

COMPANY A DATA:
${JSON.stringify(companyA, null, 2)}

COMPANY B DATA:
${JSON.stringify(companyB, null, 2)}

COMPARISON METRICS:
${JSON.stringify(comparisonData, null, 2)}

CHART DATA:
${JSON.stringify(chartData, null, 2)}

Based on the provided data, analyze:
1. Key financial ratios (P/E, ROE, ROCE, Dividend Yield, Book Value, Market Cap)
2. Quarterly sales and profit trends
3. Profitability metrics comparison
4. Valuation ratios
5. Pros and cons of each company
6. Financial tables data (Quarterly Results, Profit and Loss, Cash Flow, Balance Sheet, Ratios)

Provide a comprehensive investment analysis that:
- Clearly states which company is the better investment
- Explains the reasoning based on the financial metrics provided
- Highlights key strengths and weaknesses
- Considers growth trends, profitability, and valuation
- Provides a balanced assessment

IMPORTANT FORMATTING REQUIREMENTS:
- Use plain text only, no markdown symbols
- No asterisks (*), no dashes (-), no hash symbols (#)
- No bullet points
- Use paragraphs with clear spacing
- Write in a professional, readable format
- Keep the analysis concise but comprehensive

Return only the analysis text, no additional formatting or labels.`;

    console.log("Sending request to Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Gemini API");
    }

    // Clean up any markdown that might have been added
    text = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/^-\s/gm, "")
      .replace(/^\d+\.\s/gm, "")
      .trim();

    console.log("Analysis generated successfully");
    res.json({ verdict: text });
  } catch (error) {
    console.error("Error generating investment analysis:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
    
    let errorMessage = "Failed to generate investment analysis";
    let errorDetails = error.message || "Unknown error occurred";
    
    // Handle specific error types
    if (error.message?.includes("fetch failed") || error.message?.includes("ECONNREFUSED")) {
      errorMessage = "Unable to connect to Gemini API. Please check your internet connection and API key.";
      errorDetails = "Network error: " + error.message;
    } else if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("401")) {
      errorMessage = "Invalid Gemini API key. Please check your API key configuration.";
      errorDetails = "Authentication error: " + error.message;
    } else if (error.message?.includes("429")) {
      errorMessage = "API rate limit exceeded. Please try again later.";
      errorDetails = "Rate limit error: " + error.message;
    }
    
    res.status(500).json({
      error: errorMessage,
      details: errorDetails,
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});


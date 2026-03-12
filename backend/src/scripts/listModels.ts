import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
  try {
    // In some versions of the SDK, listModels is not directly on genAI but requires a different approach
    // However, for the current @google/generative-ai, we might need to check how to list models.
    // Let's try to just hit the endpoint or use a known good model.
    console.log("Attempting to list models...");
    // @ts-ignore
    const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels();
    console.log(result);
  } catch (error) {
    console.error("Error listing models:", error);
    console.log("Trying alternative approach...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("Models from REST API:", JSON.stringify(data, null, 2));
    } catch (restError) {
        console.error("REST API failed:", restError);
    }
  }
}

listModels();

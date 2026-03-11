const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function test() {
  console.log("Using API Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // 1. Test Generation (Confirm Key is Valid)
  try {
    console.log("Testing generation with gemini-1.5-flash...");
    const genModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const genResult = await genModel.generateContent("Hi");
    console.log("✅ Generation works!", genResult.response.text());
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
  }

  // 2. Test Embeddings with v1 and v1beta
  const versions = ["v1beta", "v1"];
  const models = ["text-embedding-004", "embedding-001"];
  
  for (const ver of versions) {
    for (const mod of models) {
      try {
        console.log(`Testing embedding: ${mod} with version ${ver}...`);
        const embedModel = genAI.getGenerativeModel({ model: mod }, { apiVersion: ver });
        const embedResult = await embedModel.embedContent("Hello world");
        console.log(`✅ ${mod} (${ver}) works!`);
      } catch (error) {
        console.error(`❌ ${mod} (${ver}) failed:`, error.message);
      }
    }
  }
}

test().catch(console.error);

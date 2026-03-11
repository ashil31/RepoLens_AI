const http = require("https");
require("dotenv").config();

const options = {
  hostname: "generativelanguage.googleapis.com",
  path: `/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
  method: "GET",
};

console.log("Fetching models...");
const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        console.log("Embedding Models Available:");
        parsed.models.forEach((m) => {
          const supportsEmbed = m.supportedGenerationMethods.some(method => method.includes("embed") || method.includes("Embed"));
          if (supportsEmbed) {
            console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(", ")})`);
          }
        });
        
        // Also log if gemini-2.5-flash specifically supports it
        const flash25 = parsed.models.find(m => m.name.includes("gemini-2.5-flash"));
        if (flash25) {
            console.log(`\nGemini 2.5 Flash Info: ${flash25.name} (Methods: ${flash25.supportedGenerationMethods.join(", ")})`);
        }
      } else {
        console.log("No models found or error:", parsed);
      }
    } catch (e) {
      console.error("Parse error:", e.message);
    }
  });
});

req.on("error", (e) => {
  console.error("Request error:", e.message);
});
req.end();

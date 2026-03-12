import { GoogleGenerativeAI } from "@google/generative-ai"
import { REPOSITORY_OVERVIEW_PROMPT, ARCHITECTURE_ANALYSIS_PROMPT } from "../utils/prompts"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export interface AnalysisContext {
    symbols: any[]
    dependencies: any[]
    fileSummaries?: string[]
}

/**
 * Service to handle AI-powered repository analysis and documentation using Google Gemini.
 */
export class AIService {
    /**
     * Generates a high-level overview of the repository based on structured context.
     */
    static async generateRepositoryOverview(context: AnalysisContext): Promise<string> {
        const prompt = REPOSITORY_OVERVIEW_PROMPT
            .replace("{{symbols}}", JSON.stringify(context.symbols.slice(0, 150)))
            .replace("{{dependencies}}", JSON.stringify(context.dependencies.slice(0, 100)))
            .replace("{{fileSummaries}}", context.fileSummaries?.join("\n") || "No file summaries provided.")

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
        const result = await model.generateContent(prompt)
        const response = result.response
        return response.text() || "Failed to generate overview."
    }

    /**
     * Generates an architecture explanation based on symbols and dependencies.
     */
    static async generateArchitectureAnalysis(context: AnalysisContext): Promise<string> {
        const prompt = ARCHITECTURE_ANALYSIS_PROMPT
            .replace("{{symbols}}", JSON.stringify(context.symbols.slice(0, 150)))
            .replace("{{dependencies}}", JSON.stringify(context.dependencies.slice(0, 100)))

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
        const result = await model.generateContent(prompt)
        const response = result.response
        return response.text() || "Failed to generate architecture analysis."
    }
}

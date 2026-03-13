import { REPOSITORY_OVERVIEW_PROMPT, ARCHITECTURE_ANALYSIS_PROMPT } from "../utils/prompts"

const INFERENCE_URL = "https://inference.do-ai.run/v1/chat/completions"
const DEFAULT_MODEL = "openai-gpt-oss-120b"
const MAX_TOKENS = 2048

export interface AnalysisContext {
    symbols: any[]
    dependencies: any[]
    fileSummaries?: string[]
}

async function chatCompletion(prompt: string): Promise<string> {
    const modelAccessKey = process.env.MODEL_ACCESS_KEY || process.env.GRADIENT_MODEL_ACCESS_KEY
    if (!modelAccessKey) {
        throw new Error("MODEL_ACCESS_KEY or GRADIENT_MODEL_ACCESS_KEY is required for AI analysis")
    }

    const res = await fetch(INFERENCE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${modelAccessKey}`,
        },
        body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_MODEL,
            max_tokens: MAX_TOKENS,
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Gradient inference failed (${res.status}): ${err}`)
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content
    return content?.trim() || "Failed to generate response."
}

/**
 * Service to handle AI-powered repository analysis and documentation using DigitalOcean Gradient™ AI.
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

        return chatCompletion(prompt)
    }

    /**
     * Generates an architecture explanation based on symbols and dependencies.
     */
    static async generateArchitectureAnalysis(context: AnalysisContext): Promise<string> {
        const prompt = ARCHITECTURE_ANALYSIS_PROMPT
            .replace("{{symbols}}", JSON.stringify(context.symbols.slice(0, 150)))
            .replace("{{dependencies}}", JSON.stringify(context.dependencies.slice(0, 100)))

        return chatCompletion(prompt)
    }
}

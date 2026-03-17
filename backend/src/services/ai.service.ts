import { REPOSITORY_OVERVIEW_PROMPT, ARCHITECTURE_ANALYSIS_PROMPT } from "../utils/prompts"

const INFERENCE_URL = "https://inference.do-ai.run/v1/chat/completions"
const DEFAULT_MODEL = "minimax-m2.5"
const MAX_TOKENS = 2000

export interface AnalysisContext {
    symbols: any[]
    dependencies: any[]
    fileSummaries?: string[]
}

export interface ChatMessage {
    role: "user" | "assistant" | "system"
    content: string
}

export interface RetrievalContext {
    content: string
    filePath: string
    startLine: number
    endLine: number
    matchType: "SYMBOL" | "SEMANTIC"
    symbolName?: string
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

    /**
     * Generates a streaming chat response based on retrieved code context and history.
     */
    static async generateChatResponseStream(
        query: string,
        context: RetrievalContext[],
        history: ChatMessage[] = []
    ): Promise<ReadableStream> {
        const modelAccessKey = process.env.MODEL_ACCESS_KEY || process.env.GRADIENT_MODEL_ACCESS_KEY
        if (!modelAccessKey) {
            throw new Error("MODEL_ACCESS_KEY or GRADIENT_MODEL_ACCESS_KEY is required for chat")
        }

        if (context.length === 0) {
            return new ReadableStream({
                start(controller) {
                    controller.enqueue("The repository context does not contain enough information to answer this question accurately. Please try a different query or provide more specific symbols.")
                    controller.close()
                }
            })
        }

        const formattedContext = this.formatContext(context)
        const systemPrompt = `You are RepoLens AI, a friendly and expert developer assistant. 
Your goal is to have a helpful conversation about the code repository.

STYLE GUIDELINES:
1. **Be Conversational**: Type like a person explaining things to a colleague. Use "I" and "you".
2. **Standard Formatting**: Use bolding, bullet points, and code blocks just like ChatGPT or Gemini.
3. **No Document Headers**: Do NOT start with titles like "# Introduction" or act like you are writing an ".md" file. Just answer the question directly.
4. **Be Concise**: Get straight to the point. If a snippet is relevant, show it.
5. **Context First**: Use the provided code chunks to anchor your technical accuracy.

CONTEXT:
${formattedContext}

Cite file names and line numbers naturally within your sentences.`

        const messages: ChatMessage[] = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: query }
        ]

        const res = await fetch(INFERENCE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${modelAccessKey}`,
            },
            body: JSON.stringify({
                messages,
                model: DEFAULT_MODEL,
                max_tokens: MAX_TOKENS,
                stream: true,
            }),
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Gradient inference failed (${res.status}): ${err}`)
        }

        return res.body!
    }

    private static formatContext(context: RetrievalContext[]): string {
        const symbolMatches = context.filter(c => c.matchType === "SYMBOL")
        const semanticMatches = context.filter(c => c.matchType === "SEMANTIC")

        let block = ""

        if (symbolMatches.length > 0) {
            block += "SYMBOL MATCHES (Direct references found):\n"
            symbolMatches.forEach(c => {
                block += `\nFile: ${c.filePath}\nLines: ${c.startLine}-${c.endLine}\nSymbol: ${c.symbolName || "N/A"}\nCode:\n${c.content}\n`
            })
            block += "\n---\n"
        }

        if (semanticMatches.length > 0) {
            block += "RELATED CODE (Semantic matches found):\n"
            semanticMatches.forEach(c => {
                block += `\nFile: ${c.filePath}\nLines: ${c.startLine}-${c.endLine}\nCode:\n${c.content}\n`
            })
        }

        return block
    }
}

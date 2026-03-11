import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "") // The SDK might require a specific version if v1beta fails

/**
 * Generates vector embeddings for a list of text chunks using Google Gemini.
 * @param chunks - List of text strings to embed
 * @returns A flat array of embeddings (number[][])
 */
export async function generateBatchedEmbeddings(chunks: string[]): Promise<number[][]> {
    // Filter out empty or whitespace-only chunks
    const sanitizedChunks = chunks
        .map(c => c.trim())
        .filter(c => c.length > 0)

    if (!sanitizedChunks.length) return []

    const BATCH_SIZE = 100
    const allEmbeddings: number[][] = []

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-2-preview" })
        
        for (let i = 0; i < sanitizedChunks.length; i += BATCH_SIZE) {
            const batch = sanitizedChunks.slice(i, i + BATCH_SIZE)
            const result = await model.batchEmbedContents({
                requests: batch.map((t) => ({
                    content: { role: "user", parts: [{ text: t }] }
                }))
            })
            allEmbeddings.push(...result.embeddings.map((e) => e.values))
        }

        return allEmbeddings
    } catch (error) {
        console.error("Error generating Gemini embeddings:", error)
        throw error
    }
}

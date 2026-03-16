import axios from "axios"
import http from "http"
import https from "https"

const axiosClient = axios.create({
    baseURL: "https://repolens.ashilpatel.site",
    timeout: 900000,   
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true })
})

const SUB_BATCH_SIZE = 32
const CONCURRENCY_LIMIT = 3

function normalizeEmbeddingResponse(raw: unknown): number[][] {
    if (!Array.isArray(raw)) return []
    const first = raw[0]
    return Array.isArray(first) ? (raw as number[][]) : [raw as number[]]
}

async function embedWithRetry(chunks: string[], retries = 3): Promise<number[][]> {
    try {
        return await generateBatchedEmbeddingsInternal(chunks)
    } catch (err) {
        if (retries === 0) throw err
        await new Promise((r) => setTimeout(r, 2000))
        return embedWithRetry(chunks, retries - 1)
    }
}

/**
 * Generates vector embeddings for a list of text chunks using local embedding service.
 * @param chunks - List of text strings to embed
 * @returns A flat array of embeddings (number[][])
 */
export async function generateBatchedEmbeddings(chunks: string[]): Promise<number[][]> {
    if (!chunks.length) return []
    return embedWithRetry(chunks)
}

async function generateBatchedEmbeddingsInternal(chunks: string[]): Promise<number[][]> {
    const totalBatches = Math.ceil(chunks.length / SUB_BATCH_SIZE)
    console.log(`[EmbeddingService] Processing ${chunks.length} chunks in ${totalBatches} sub-batches (${SUB_BATCH_SIZE} size, concurrency ${CONCURRENCY_LIMIT})...`)

    const results: number[][] = new Array(chunks.length)
    const batches: string[][] = []

    for (let i = 0; i < chunks.length; i += SUB_BATCH_SIZE) {
        batches.push(chunks.slice(i, i + SUB_BATCH_SIZE))
    }

    for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
        const currentBatchSet = batches.slice(i, i + CONCURRENCY_LIMIT)

        await Promise.all(currentBatchSet.map(async (batch, index) => {
            const batchIndex = i + index
            const startIndex = batchIndex * SUB_BATCH_SIZE

            const response = await axiosClient.post("/embed", { text: batch })

            const batchEmbeddings = normalizeEmbeddingResponse(response.data?.embedding)
            if (batchEmbeddings.length !== batch.length) {
                throw new Error(
                    `[EmbeddingService] Batch ${batchIndex} mismatch: expected ${batch.length}, got ${batchEmbeddings.length}`
                )
            }
            for (let j = 0; j < batchEmbeddings.length; j++) {
                results[startIndex + j] = batchEmbeddings[j]
            }
        }))
    }

    console.log(`[EmbeddingService] Successfully generated ${results.length} embeddings.`)
    return results
}

/**
 * Generates a single embedding for a query string.
 * @param query - The text query to embed
 * @returns A single vector embedding (number[])
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
    const results = await generateBatchedEmbeddings([query])
    if (!results.length) {
        throw new Error("[EmbeddingService] Failed to generate query embedding.")
    }
    return results[0]
}

import axios from "axios"

const LOCAL_EMBEDDING_URL = "http://localhost:8001/embed"

/**
 * Generates vector embeddings for a list of text chunks using local embedding service.
 * @param chunks - List of text strings to embed
 * @returns A flat array of embeddings (number[][])
 */
export async function generateBatchedEmbeddings(chunks: string[]): Promise<number[][]> {
    if (!chunks.length) return []

    const SUB_BATCH_SIZE = 100
    const CONCURRENCY_LIMIT = 6
    const totalBatches = Math.ceil(chunks.length / SUB_BATCH_SIZE)

    console.log(`[EmbeddingService] Processing ${chunks.length} chunks in ${totalBatches} sub-batches with concurrency ${CONCURRENCY_LIMIT}...`)

    const results: number[][] = new Array(chunks.length)
    const batches: string[][] = []

    for (let i = 0; i < chunks.length; i += SUB_BATCH_SIZE) {
        batches.push(chunks.slice(i, i + SUB_BATCH_SIZE))
    }

    // Process in parallel with limit
    for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
        const currentBatchSet = batches.slice(i, i + CONCURRENCY_LIMIT)

        await Promise.all(currentBatchSet.map(async (batch, index) => {
            const batchIndex = i + index
            const startIndex = batchIndex * SUB_BATCH_SIZE

            try {
                const response = await axios.post(LOCAL_EMBEDDING_URL, {
                    text: batch
                }, {
                    timeout: 600000 // 1 minute per sub-batch
                })

                const batchEmbeddings = response.data.embedding
                for (let j = 0; j < batchEmbeddings.length; j++) {
                    results[startIndex + j] = batchEmbeddings[j]
                }
            } catch (error: any) {
                console.error(`[EmbeddingService] Batch ${batchIndex} failed:`, error.message)
                throw error
            }
        }))
    }

    console.log(`[EmbeddingService] Successfully generated ${results.length} embeddings across all batches.`)
    return results
}

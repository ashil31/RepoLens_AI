import { AIService, ChatMessage } from "./ai.service";
import { generateQueryEmbedding } from "./embedding.service";
import { RetrievalService, RetrievalResult } from "./retrieval.service";

export interface ChatResponse {
    stream: ReadableStream;
    sources: {
        file: string;
        startLine: number;
        endLine: number;
        symbolName?: string;
    }[];
}

export class ChatService {
    /**
     * Orchestrates the RAG Chat pipeline.
     */
    static async processChat(
        repoId: string,
        query: string,
        history: ChatMessage[] = []
    ): Promise<ChatResponse> {
        console.log(`[ChatService] Processing query: "${query}" for repo: ${repoId}`);

        // 1. Generate Query Embedding
        const queryVector = await generateQueryEmbedding(query);

        // 2. Hybrid Retrieval (Symbol + Semantic)
        const relevantChunks = await RetrievalService.hybridSearch(repoId, query, queryVector);

        // 3. Map Sources for Frontend
        const sources = relevantChunks.map(chunk => ({
            file: chunk.filePath,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            symbolName: chunk.symbolName
        }));

        // 4. Generate Streaming AI Response
        const stream = await AIService.generateChatResponseStream(query, relevantChunks, history);

        return {
            stream,
            sources
        };
    }
}

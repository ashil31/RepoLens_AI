import { AIService, ChatMessage } from "./ai.service";
import { generateQueryEmbedding } from "./embedding.service";
import { RetrievalService, RetrievalResult } from "./retrieval.service";

export type StepName = "embedding" | "searching" | "retrieving" | "reasoning" | "generating";

export interface ChatSource {
    file: string;
    startLine: number;
    endLine: number;
    symbolName?: string;
    contentSnippet?: string;
}

export interface ChatResponse {
    stream: ReadableStream;
    sources: ChatSource[];
}

export type EmitEvent = (event: object) => void;

export class ChatService {
    /**
     * Orchestrates the RAG Chat pipeline with step events and optional duration.
     */
    static async processChat(
        repoId: string,
        query: string,
        history: ChatMessage[] = [],
        messageId: string,
        emit: EmitEvent
    ): Promise<ChatResponse> {
        console.log(`[ChatService] Processing query: "${query}" for repo: ${repoId}`);

        const emitStep = (step: StepName, status: "active" | "done", duration?: number) => {
            emit({ id: messageId, type: "step", step, status, ...(duration !== undefined && { duration }) });
        };

        // 1. Embedding
        emitStep("embedding", "active");
        const t0 = Date.now();
        const queryVector = await generateQueryEmbedding(query);
        emitStep("embedding", "done", Date.now() - t0);

        // 2. Searching (symbol + semantic)
        emitStep("searching", "active");
        const t1 = Date.now();
        const relevantChunks = await RetrievalService.hybridSearch(repoId, query, queryVector);
        emitStep("searching", "done", Date.now() - t1);

        // 3. Retrieving (rerank + limit) - already done in hybridSearch, emit as "retrieving"
        emitStep("retrieving", "active");
        emitStep("retrieving", "done", 0);

        // Metrics
        const filesExplored = new Set(relevantChunks.map(c => c.filePath)).size;
        const searches = 2; // symbol + semantic
        const chunksRetrieved = relevantChunks.length;
        emit({ id: messageId, type: "metrics", filesExplored, searches, chunksRetrieved });

        // 4. Map Sources with contentSnippet
        const sources: ChatSource[] = relevantChunks.map(chunk => ({
            file: chunk.filePath,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            symbolName: chunk.symbolName,
            contentSnippet: getContentSnippet(chunk)
        }));

        emit({ id: messageId, type: "sources", data: sources });

        // 5. Reasoning (context prep)
        emitStep("reasoning", "active");
        emitStep("reasoning", "done", 0);

        // 6. Generating
        emitStep("generating", "active");
        const stream = await AIService.generateChatResponseStream(query, relevantChunks, history);

        return {
            stream,
            sources
        };
    }
}

function getContentSnippet(chunk: RetrievalResult): string {
    if (chunk.symbolName) return `${chunk.symbolName}(...)`;
    const firstLine = chunk.content.split("\n")[0]?.trim();
    if (firstLine && firstLine.length <= 80) return firstLine;
    return firstLine ? firstLine.slice(0, 77) + "..." : "";
}

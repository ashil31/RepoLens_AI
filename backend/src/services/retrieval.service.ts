import { prisma } from "../database/prisma";

export interface RetrievalResult {
    content: string;
    filePath: string;
    startLine: number;
    endLine: number;
    symbolName?: string;
    similarity: number;
    matchType: "SYMBOL" | "SEMANTIC";
    score: number;
}

export class RetrievalService {
    private static MAX_CHUNKS = 8;
    private static MAX_TOKENS = 6000; // Rough estimate: 4 chars per token

    /**
     * Main hybrid search entry point.
     */
    static async hybridSearch(repoId: string, query: string, queryVector: number[]): Promise<RetrievalResult[]> {
        console.log(`[RetrievalService] Starting hybrid search for repo: ${repoId}`);

        // 1. Parallel Retrieval
        const [symbolMatches, semanticMatches] = await Promise.all([
            this.findSymbolMatches(repoId, query),
            this.findSemanticChunks(repoId, queryVector)
        ]);

        console.log(`[RetrievalService] Symbol matches: ${symbolMatches.length}, Semantic matches: ${semanticMatches.length}`);

        // 2. Merge and Deduplicate
        let merged = [...symbolMatches, ...semanticMatches];
        merged = this.deduplicate(merged);

        // 3. Rerank
        const reranked = this.rerank(merged, query);

        // 4. Limit Context
        const finalResults = this.limitContext(reranked);
        console.log(`[RetrievalService] Final chunk count after rerank and limit: ${finalResults.length}`);

        return finalResults;
    }

    private static async findSymbolMatches(repoId: string, query: string): Promise<RetrievalResult[]> {
        // Extract potential symbols (simple word extraction for now, can be improved)
        const words = query.split(/\W+/).filter(w => w.length > 3);
        if (words.length === 0) return [];

        // Query RepositoryFile for symbols matching these words
        // We look into the 'symbols' JSON field which contains an array of { name, startLine, endLine }
        const files = await prisma.repositoryFile.findMany({
            where: {
                repositoryId: repoId,
            },
            select: {
                path: true,
                content: true,
                symbols: true
            }
        });

        const matches: RetrievalResult[] = [];

        for (const file of files) {
            const symbols = (file.symbols as any[]) || [];
            for (const sym of symbols) {
                if (words.some(word => sym.name.toLowerCase().includes(word.toLowerCase()))) {
                    // Extract exact source lines if content exists
                    const content = this.extractLines(file.content || "", sym.startLine, sym.endLine);
                    matches.push({
                        content,
                        filePath: file.path,
                        startLine: sym.startLine,
                        endLine: sym.endLine,
                        symbolName: sym.name,
                        similarity: 1.0, // Exact or near-exact symbol match
                        matchType: "SYMBOL",
                        score: 0 // Will be calculated in rerank
                    });
                }
            }
        }

        return matches;
    }

    private static async findSemanticChunks(repoId: string, queryVector: number[]): Promise<RetrievalResult[]> {
        const vectorStr = `[${queryVector.join(",")}]`;
        
        // pgvector similarity search using raw query since Prisma doesn't support vector operators yet
        const results = await prisma.$queryRaw<any[]>`
            SELECT 
                ce.chunk as content,
                rf.path as "filePath",
                ce."startLine" as "startLine",
                ce."endLine" as "endLine",
                ce."symbolName" as "symbolName",
                1 - (ce.embedding <=> ${vectorStr}::vector) as similarity
            FROM code_embeddings ce
            JOIN repository_files rf ON ce."fileId" = rf.id
            WHERE rf."repositoryId" = ${repoId}
            ORDER BY ce.embedding <=> ${vectorStr}::vector
            LIMIT 15
        `;

        return results.map(r => ({
            ...r,
            matchType: "SEMANTIC",
            score: 0
        }));
    }

    private static deduplicate(results: RetrievalResult[]): RetrievalResult[] {
        const seen = new Set<string>();
        return results.filter(r => {
            const key = `${r.filePath}:${r.startLine}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private static rerank(results: RetrievalResult[], query: string): RetrievalResult[] {
        return results.map(r => {
            let score = r.similarity;
            
            // Symbol match weight
            if (r.matchType === "SYMBOL") {
                score += 2.0;
            }

            // Length penalty (favor concise but useful chunks)
            const chunkLength = r.content.length;
            if (chunkLength > 2000) {
                score -= 0.5;
            } else if (chunkLength < 100) {
                score -= 0.2; // Too small might be noise
            }

            // Boost if the filename is in the query
            if (query.toLowerCase().includes(r.filePath.toLowerCase().split('/').pop() || "")) {
                score += 0.5;
            }

            return { ...r, score };
        }).sort((a, b) => b.score - a.score);
    }

    private static limitContext(results: RetrievalResult[]): RetrievalResult[] {
        let currentTokens = 0;
        const limited: RetrievalResult[] = [];

        for (const res of results) {
            if (limited.length >= this.MAX_CHUNKS) break;
            
            const estimatedTokens = Math.ceil(res.content.length / 4);
            if (currentTokens + estimatedTokens > this.MAX_TOKENS) continue;

            limited.push(res);
            currentTokens += estimatedTokens;
        }

        return limited;
    }

    private static extractLines(content: string, start: number, end: number): string {
        const lines = content.split("\n");
        // start and end are typically 1-indexed from parsers
        return lines.slice(Math.max(0, start - 1), end).join("\n");
    }
}

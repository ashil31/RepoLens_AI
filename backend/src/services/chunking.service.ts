import { SymbolInfo } from "./parser.service"
import XXH from "xxhashjs"

export interface CodeChunk {
    content: string
    startLine: number
    endLine: number
    symbolName?: string
}

/**
 * Generates a fast xxHash64 hash for a given text chunk (~15x faster than SHA256).
 */
export function hashChunk(text: string): string {
    return XXH.h64(0).update(text).digest().toString(16)
}

/**
 * Splits code into semantic chunks based on function and class boundaries.
 * Ensures no code is lost between symbols and filters out tiny chunks.
 * maxChunkSize ~800 chars ≈ 300–400 tokens; smaller chunks = faster embedding.
 */
export function chunkCode(code: string, symbols: SymbolInfo[], maxChunkSize = 800): CodeChunk[] {
    const lines = code.split("\n")
    const chunks: CodeChunk[] = []
    const covered = new Set<number>()

    // Sort symbols by start line
    const sortedSymbols = [...symbols].sort((a, b) => a.startLine - b.startLine)

    sortedSymbols.forEach(symbol => {
        // Track covered lines
        for (let i = symbol.startLine; i <= symbol.endLine; i++) {
            covered.add(i)
        }

        // Extract content for this symbol
        const content = lines.slice(symbol.startLine - 1, symbol.endLine).join("\n")
        
        // Skip tiny chunks (low value for semantic search)
        if (content.trim().length < 120) return

        // If the symbol is small enough, make it a chunk
        if (content.length <= maxChunkSize) {
            chunks.push({
                content,
                startLine: symbol.startLine,
                endLine: symbol.endLine,
                symbolName: symbol.name
            })
        } else {
            // If symbol is too large, split it further
            const subLines = lines.slice(symbol.startLine - 1, symbol.endLine)
            const subChunks = fallbackChunking(subLines, 25, symbol.startLine, maxChunkSize)
            chunks.push(...subChunks.map(sc => ({ ...sc, symbolName: symbol.name })))
        }
    })

    // Handle code between symbols (covered logic)
    let start = -1
    for (let i = 1; i <= lines.length; i++) {
        if (!covered.has(i)) {
            if (start === -1) start = i
        } else {
            if (start !== -1) {
                const uncoveredContent = lines.slice(start - 1, i - 1).join("\n")
                if (uncoveredContent.trim().length >= 120) {
                    if (uncoveredContent.length <= maxChunkSize) {
                        chunks.push({
                            content: uncoveredContent,
                            startLine: start,
                            endLine: i - 1
                        })
                    } else {
                        const subLines = lines.slice(start - 1, i - 1)
                        chunks.push(...fallbackChunking(subLines, 25, start, maxChunkSize))
                    }
                }
                start = -1
            }
        }
    }

    // Handle remaining uncovered code at the end of the file
    if (start !== -1) {
        const uncoveredContent = lines.slice(start - 1).join("\n")
        if (uncoveredContent.trim().length >= 120) {
            if (uncoveredContent.length <= maxChunkSize) {
                chunks.push({
                    content: uncoveredContent,
                    startLine: start,
                    endLine: lines.length
                })
            } else {
                const subLines = lines.slice(start - 1)
                chunks.push(...fallbackChunking(subLines, 25, start, maxChunkSize))
            }
        }
    }

    return chunks
}

function fallbackChunking(lines: string[], linesPerChunk: number, startOffset = 1, maxChunkSize = 800): CodeChunk[] {
    const chunks: CodeChunk[] = []
    for (let i = 0; i < lines.length; i += linesPerChunk) {
        const chunkLines = lines.slice(i, i + linesPerChunk)
        const content = chunkLines.join("\n")
        
        if (content.trim().length >= 120) {
            if (content.length <= maxChunkSize) {
                chunks.push({
                    content,
                    startLine: startOffset + i,
                    endLine: startOffset + i + chunkLines.length - 1
                })
            } else {
                // If even the line-based chunk is too large, split by characters
                let charIdx = 0
                while (charIdx < content.length) {
                    const subContent = content.slice(charIdx, charIdx + maxChunkSize)
                    chunks.push({
                        content: subContent,
                        startLine: startOffset + i, // Approximation as we are in a sub-char chunk
                        endLine: startOffset + i + chunkLines.length - 1
                    })
                    charIdx += maxChunkSize
                }
            }
        }
    }
    return chunks
}

import { SymbolInfo } from "./parser.service"

export interface CodeChunk {
    content: string
    startLine: number
    endLine: number
    symbolName?: string
}

/**
 * Splits code into semantic chunks based on function and class boundaries.
 * Falls back to token-window-like chunking if symbols are too large or missing.
 */
export function chunkCode(code: string, symbols: SymbolInfo[], maxChunkSize = 1000): CodeChunk[] {
    const lines = code.split("\n")
    const chunks: CodeChunk[] = []

    if (symbols.length === 0) {
        // Fallback to simple line-based chunking
        return fallbackChunking(lines, 30) // 30 lines per chunk
    }

    // Sort symbols by start line
    const sortedSymbols = [...symbols].sort((a, b) => a.startLine - b.startLine)

    sortedSymbols.forEach(symbol => {
        // Extract content for this symbol
        const content = lines.slice(symbol.startLine - 1, symbol.endLine).join("\n")
        
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
            const subChunks = fallbackChunking(subLines, 20, symbol.startLine)
            chunks.push(...subChunks.map(sc => ({ ...sc, symbolName: symbol.name })))
        }
    })

    // Handle code between symbols (if any)
    // This is a simplified version. A robust version would track "covered" lines.
    
    return chunks
}

function fallbackChunking(lines: string[], linesPerChunk: number, startOffset = 1): CodeChunk[] {
    const chunks: CodeChunk[] = []
    for (let i = 0; i < lines.length; i += linesPerChunk) {
        const chunkLines = lines.slice(i, i + linesPerChunk)
        chunks.push({
            content: chunkLines.join("\n"),
            startLine: startOffset + i,
            endLine: startOffset + i + chunkLines.length - 1
        })
    }
    return chunks
}

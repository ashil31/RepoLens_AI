/**
 * Resolves import paths to actual file paths within the repository.
 * Handles relative imports (./, ../) and tries common extensions when needed.
 */

const COMMON_EXTENSIONS = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".vue",
    ".svelte",
    ".mts",
    ".cts",
]

const PYTHON_EXTENSIONS = [".py"]

/**
 * Resolves a relative import path to an actual file path.
 * @param sourcePath - The file containing the import (e.g. "src/App.jsx")
 * @param importPath - The raw import string (e.g. "./Button" or "../utils")
 * @param allFilePaths - Set of all file paths in the repository
 * @returns The resolved file path if found, or null
 */
/**
 * Normalizes import string from various formats (JS/TS, Python) to a path.
 * e.g. "from .utils import x" -> ".utils", "./Button" -> "./Button"
 */
function normalizeImportPath(raw: string): string | null {
    const trimmed = raw.trim()
    if (trimmed.startsWith(".")) return trimmed
    const fromMatch = trimmed.match(/^from\s+([^\s]+)\s+import/)
    if (fromMatch && fromMatch[1].startsWith(".")) return fromMatch[1]
    return null
}

export function resolveImport(
    sourcePath: string,
    importPath: string,
    allFilePaths: Set<string>
): string | null {
    const normalized = normalizeImportPath(importPath)
    if (!normalized) return null

    const sourceDir = sourcePath.includes("/") ? sourcePath.replace(/\/[^/]+$/, "") : ""
    const resolved = resolveRelative(sourceDir, normalized)

    if (allFilePaths.has(resolved)) {
        return resolved
    }

    const hasExt = /\.[a-zA-Z0-9]+$/.test(resolved)
    if (hasExt) {
        return null
    }

    for (const ext of COMMON_EXTENSIONS) {
        const candidate = resolved + ext
        if (allFilePaths.has(candidate)) {
            return candidate
        }
    }

    const indexCandidates = COMMON_EXTENSIONS.map((ext) => resolved + "/index" + ext)
    for (const candidate of indexCandidates) {
        if (allFilePaths.has(candidate)) {
            return candidate
        }
    }

    for (const ext of PYTHON_EXTENSIONS) {
        const candidate = resolved + ext
        if (allFilePaths.has(candidate)) return candidate
    }
    const pyIndexCandidates = PYTHON_EXTENSIONS.map((ext) => resolved + "/__init__" + ext)
    for (const candidate of pyIndexCandidates) {
        if (allFilePaths.has(candidate)) return candidate
    }

    return null
}

function resolveRelative(baseDir: string, importPath: string): string {
    if (!importPath.startsWith(".")) {
        return importPath
    }

    const parts = importPath.split("/").filter(Boolean)
    const baseParts = baseDir ? baseDir.split("/").filter(Boolean) : []

    for (const part of parts) {
        if (part === ".") {
            continue
        }
        if (part === "..") {
            baseParts.pop()
            continue
        }
        baseParts.push(part)
    }

    return baseParts.join("/")
}

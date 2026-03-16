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
/** Common path alias prefixes (e.g. @/ -> src/) */
const PATH_ALIAS_PREFIXES = ["@/", "@", "~/", "~"]

/**
 * Normalizes import string from various formats (JS/TS, Python) to a path.
 * Handles: ./, ../, @/, ~/, from .x import
 */
function normalizeImportPath(raw: string): string | null {
    const trimmed = raw.trim()
    if (trimmed.startsWith(".")) return trimmed
    const fromMatch = trimmed.match(/^from\s+([^\s]+)\s+import/)
    if (fromMatch && fromMatch[1].startsWith(".")) return fromMatch[1]
    for (const prefix of PATH_ALIAS_PREFIXES) {
        if (trimmed.startsWith(prefix)) {
            const rest = trimmed.slice(prefix.length).replace(/^\//, "")
            return rest ? rest : null
        }
    }
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
    const isAlias = PATH_ALIAS_PREFIXES.some((p) => importPath.trim().startsWith(p))

    let resolved: string | null
    if (isAlias) {
        resolved = resolvePathAlias(normalized, allFilePaths)
    } else {
        resolved = resolveRelative(sourceDir, normalized)
    }
    if (resolved == null) return null

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

/**
 * Infer path alias bases from actual repo structure.
 * e.g. frontend/src/App.tsx → "frontend/src", src/components/X → "src"
 */
function inferAliasBases(allFilePaths: Set<string>): string[] {
    const bases = new Set<string>()
    const seen = new Set<string>()
    for (const p of allFilePaths) {
        const parts = p.split("/")
        for (let i = 1; i <= parts.length; i++) {
            const prefix = parts.slice(0, i).join("/")
            if (seen.has(prefix)) continue
            seen.add(prefix)
            if (prefix.includes("src") || /^(app|lib|components|pages|views)$/.test(parts[i - 1]!)) {
                bases.add(prefix)
            }
        }
        if (parts.length > 0) bases.add(parts[0]!)
    }
    const ordered = Array.from(bases)
    ordered.sort((a, b) => b.length - a.length)
    return ordered
}

/** Resolve @/ or ~/ style paths using inferred + fallback bases */
function resolvePathAlias(relativePath: string, allFilePaths: Set<string>): string | null {
    const inferred = inferAliasBases(allFilePaths)
    const fallback = ["src", "client/src", "frontend/src", "app", "lib", "packages/frontend/src", ""]
    const bases = [...new Set([...inferred, ...fallback])]
    for (const base of bases) {
        const candidate = base ? `${base}/${relativePath}` : relativePath
        if (allFilePaths.has(candidate)) return candidate
        for (const ext of COMMON_EXTENSIONS) {
            if (allFilePaths.has(candidate + ext)) return candidate + ext
        }
        for (const ext of COMMON_EXTENSIONS) {
            const idx = `${candidate}/index${ext}`
            if (allFilePaths.has(idx)) return idx
        }
    }
    if (allFilePaths.has(relativePath)) return relativePath
    for (const ext of COMMON_EXTENSIONS) {
        if (allFilePaths.has(relativePath + ext)) return relativePath + ext
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

import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import { detectLanguage } from "../utils/language"

export interface FileMetadata {
    fileName: string | undefined
    folderStructure: string
    language: string
    imports: string[]
    exports: string[]
    functions: string[]
    classes: string[]
}

/**
 * Extracts structured metadata from source code.
 * Uses Babel for JS/TS and Regex for other languages.
 */
export function parseCodeFile(filePath: string, code: string): FileMetadata {
    const language = detectLanguage(filePath)
    const fileName = filePath.split("/").pop()

    const result: FileMetadata = {
        fileName,
        folderStructure: filePath,
        language,
        imports: [],
        exports: [],
        functions: [],
        classes: []
    }

    try {
        if (language === "JavaScript" || language === "TypeScript") {
            return parseWithBabel(result, code)
        } else if (language === "Jupyter Notebook") {
            return parseJupyterNotebook(result, code)
        } else {
            return parseWithRegex(result, code, language)
        }
    } catch (error) {
        console.error(`Error parsing ${language} file ${filePath}:`, error)
        return result
    }
}

function parseWithBabel(meta: FileMetadata, code: string): FileMetadata {
    const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy", "classProperties"]
    })

    traverse(ast, {
        ImportDeclaration(path) {
            meta.imports.push(path.node.source.value)
        },

        ExportNamedDeclaration(path) {
            if (path.node.declaration) {
                const decl = path.node.declaration as any
                if (decl.id?.name) {
                    meta.exports.push(decl.id.name)
                } else if (decl.declarations) {
                    decl.declarations.forEach((d: any) => {
                        if (d.id?.name) meta.exports.push(d.id.name)
                    })
                }
            }
            if (path.node.specifiers) {
                path.node.specifiers.forEach((spec: any) => {
                    if (spec.exported?.name) meta.exports.push(spec.exported.name)
                })
            }
        },

        ExportDefaultDeclaration() {
            meta.exports.push("default")
        },

        FunctionDeclaration(path) {
            if (path.node.id) {
                meta.functions.push(path.node.id.name)
            }
        },

        ClassDeclaration(path) {
            if (path.node.id) {
                meta.classes.push(path.node.id.name)
            }
        },

        VariableDeclarator(path) {
            const id = path.node.id as any
            const init = path.node.init as any
            if (id?.name && (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression")) {
                meta.functions.push(id.name)
            }
        }
    })

    return meta
}

function parseJupyterNotebook(meta: FileMetadata, code: string): FileMetadata {
    try {
        const notebook = JSON.parse(code)
        if (!notebook.cells || !Array.isArray(notebook.cells)) return meta

        const pythonCode = notebook.cells
            .filter((cell: any) => cell.cell_type === "code")
            .map((cell: any) => {
                if (Array.isArray(cell.source)) return cell.source.join("")
                return cell.source || ""
            })
            .join("\n")

        // Analyze extracted Python code using Python regex patterns
        return parseWithRegex(meta, pythonCode, "Python")
    } catch (error) {
        console.error("Error parsing Jupyter Notebook:", error)
        return meta
    }
}

function parseWithRegex(meta: FileMetadata, code: string, language: string): FileMetadata {
    const lines = code.split("\n")

    // Common patterns
    const patterns = {
        Python: {
            imports: /^(?:from\s+([^\s]+)\s+import|import\s+([^\s]+))/,
            functions: /^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
            classes: /^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/
        },
        Go: {
            imports: /^\s*(?:import\s+\"?([^\s\"]+)\"?|import\s+\(([\s\S]*?)\))/,
            functions: /^func\s+(?:\([^\)]+\)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
            classes: /^type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+struct/
        },
        Java: {
            imports: /^import\s+([^\s;]+);/,
            functions: /(?:public|protected|private|static|\s) +[\w<>\[\]]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^\)]*\)\s*(?:\{|throws)/,
            classes: /^(?:public\s+)?(?:abstract\s+)?class\s+([a-zA-Z_][a-zA-Z0-9_]*)/
        },
        Generic: {
            imports: /^(?:import|include|require)\s+[\"\']?([^\s\"\';]+)[\"\']?/,
            functions: /(?:def|func|function|void|int|string|bool)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/i,
            classes: /(?:class|struct|type)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i
        }
    }

    const langPatterns = patterns[language as keyof typeof patterns] || patterns.Generic

    lines.forEach(line => {
        const trimmed = line.trim()
        if (!trimmed) return

        // Extract Imports
        const importMatch = trimmed.match(langPatterns.imports)
        if (importMatch) {
            const imp = importMatch[1] || importMatch[2]
            if (imp) meta.imports.push(imp.trim())
        }

        // Extract Functions
        const funcMatch = trimmed.match(langPatterns.functions)
        if (funcMatch && funcMatch[1]) {
            meta.functions.push(funcMatch[1])
        }

        // Extract Classes
        const classMatch = trimmed.match(langPatterns.classes)
        if (classMatch && classMatch[1]) {
            meta.classes.push(classMatch[1])
        }
    })

    // Clean up empty/duplicate results
    meta.imports = Array.from(new Set(meta.imports.filter(Boolean)))
    meta.functions = Array.from(new Set(meta.functions.filter(Boolean)))
    meta.classes = Array.from(new Set(meta.classes.filter(Boolean)))

    return meta
}

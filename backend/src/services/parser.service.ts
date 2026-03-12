import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import { detectLanguage } from "../utils/language"
import Parser from "tree-sitter"
import Python from "tree-sitter-python"
import Go from "tree-sitter-go"
import Java from "tree-sitter-java"

export interface SymbolInfo {
    name: string
    type: "function" | "class" | "method" | "interface" | "route" | "controller" | "service"
    startLine: number
    endLine: number
}

export interface FileMetadata {
    fileName: string | undefined
    folderStructure: string
    language: string
    imports: string[]
    exports: string[]
    symbols: SymbolInfo[]
}

/**
 * Extracts structured metadata from source code.
 * Uses Babel for JS/TS and Tree-sitter for other languages.
 */
export function parseCodeFile(filePath: string, code: string): FileMetadata {
    const language = detectLanguage(filePath)
    const fileName = filePath.split("/").pop()

    let result: FileMetadata = {
        fileName,
        folderStructure: filePath,
        language,
        imports: [],
        exports: [],
        symbols: []
    }

    try {
        if (language === "JavaScript" || language === "TypeScript") {
            return parseWithBabel(result, code)
        } else if (language === "Python") {
            return parseWithTreeSitter(result, code, Python, "Python")
        } else if (language === "Go") {
            return parseWithTreeSitter(result, code, Go, "Go")
        } else if (language === "Java") {
            return parseWithTreeSitter(result, code, Java, "Java")
        } else if (language === "Jupyter Notebook") {
            return parseJupyterNotebook(result, code)
        } else {
            // Fallback to regex for unsupported languages
            return parseWithRegex(result, code, language)
        }
    } catch (error) {
        console.error(`Error parsing ${language} file ${filePath}:`, error)
        return result
    }
}

function parseWithBabel(meta: FileMetadata, code: string): FileMetadata {
    try {
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
                if (path.node.id && path.node.loc) {
                    meta.symbols.push({
                        name: path.node.id.name,
                        type: "function",
                        startLine: path.node.loc.start.line,
                        endLine: path.node.loc.end.line
                    })
                }
            },

            ClassDeclaration(path) {
                if (path.node.id && path.node.loc) {
                    meta.symbols.push({
                        name: path.node.id.name,
                        type: "class",
                        startLine: path.node.loc.start.line,
                        endLine: path.node.loc.end.line
                    })
                }
            },

            VariableDeclarator(path) {
                const id = path.node.id as any
                const init = path.node.init as any
                if (id?.name && (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression") && path.node.loc) {
                    meta.symbols.push({
                        name: id.name,
                        type: "function",
                        startLine: path.node.loc.start.line,
                        endLine: path.node.loc.end.line
                    })
                }
            },

            TSInterfaceDeclaration(path) {
                if (path.node.id && path.node.loc) {
                    meta.symbols.push({
                        name: path.node.id.name,
                        type: "interface",
                        startLine: path.node.loc.start.line,
                        endLine: path.node.loc.end.line
                    })
                }
            },

            ClassMethod(path) {
                const key = path.node.key as any
                if (key.name && path.node.loc) {
                    meta.symbols.push({
                        name: key.name,
                        type: "method",
                        startLine: path.node.loc.start.line,
                        endLine: path.node.loc.end.line
                    })
                }
            }
        })
    } catch (err) {
        console.warn("Babel parsing failed, falling back to regex", err)
        return parseWithRegex(meta, code, meta.language)
    }

    return meta
}

function parseWithTreeSitter(meta: FileMetadata, code: string, lang: any, langName: string): FileMetadata {
    const parser = new Parser()
    parser.setLanguage(lang)
    const tree = parser.parse(code)
    const root = tree.rootNode

    // Simplified symbol extraction using queries would be ideal, 
    // but a recursive traversal is more flexible for multiple languages without custom queries for each.
    function traverseNode(node: Parser.SyntaxNode) {
        const type = node.type

        // Python
        if (langName === "Python") {
            if (type === "function_definition") {
                const nameNode = node.childForFieldName("name")
                if (nameNode) {
                    meta.symbols.push({
                        name: nameNode.text,
                        type: "function",
                        startLine: node.startPosition.row + 1,
                        endLine: node.endPosition.row + 1
                    })
                }
            } else if (type === "class_definition") {
                const nameNode = node.childForFieldName("name")
                if (nameNode) {
                    meta.symbols.push({
                        name: nameNode.text,
                        type: "class",
                        startLine: node.startPosition.row + 1,
                        endLine: node.endPosition.row + 1
                    })
                }
            } else if (type === "import_from_statement" || type === "import_statement") {
                meta.imports.push(node.text)
            }
        }

        // Go
        if (langName === "Go") {
            if (type === "function_declaration" || type === "method_declaration") {
                const nameNode = node.childForFieldName("name")
                if (nameNode) {
                    meta.symbols.push({
                        name: nameNode.text,
                        type: type === "function_declaration" ? "function" : "method",
                        startLine: node.startPosition.row + 1,
                        endLine: node.endPosition.row + 1
                    })
                }
            } else if (type === "type_declaration") {
                // Check if it's a struct or interface (simplified)
                const nameNode = node.childForFieldName("name")
                if (nameNode) {
                    meta.symbols.push({
                        name: nameNode.text,
                        type: "class", // Map struct to class for consistency
                        startLine: node.startPosition.row + 1,
                        endLine: node.endPosition.row + 1
                    })
                }
            } else if (type === "import_declaration") {
                meta.imports.push(node.text)
            }
        }

        // Java
        if (langName === "Java") {
            if (type === "method_declaration") {
                const nameNode = node.childForFieldName("name")
                if (nameNode) {
                    meta.symbols.push({
                        name: nameNode.text,
                        type: "method",
                        startLine: node.startPosition.row + 1,
                        endLine: node.endPosition.row + 1
                    })
                }
            } else if (type === "class_declaration" || type === "interface_declaration") {
                const nameNode = node.childForFieldName("name")
                if (nameNode) {
                    meta.symbols.push({
                        name: nameNode.text,
                        type: type === "class_declaration" ? "class" : "interface",
                        startLine: node.startPosition.row + 1,
                        endLine: node.endPosition.row + 1
                    })
                }
            } else if (type === "import_declaration") {
                meta.imports.push(node.text)
            }
        }

        for (const child of node.children) {
            traverseNode(child)
        }
    }

    traverseNode(root)
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

        return parseWithTreeSitter(meta, pythonCode, Python, "Python")
    } catch (error) {
        console.error("Error parsing Jupyter Notebook:", error)
        return meta
    }
}

function parseWithRegex(meta: FileMetadata, code: string, language: string): FileMetadata {
    const lines = code.split("\n")

    const patterns = {
        Generic: {
            imports: /^(?:import|include|require|from)\s+[\"\']?([^\s\"\';]+)[\"\']?/,
            functions: /(?:def|func|function|void|int|string|bool)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/i,
            classes: /(?:class|struct|type|interface)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i
        }
    }

    const langPatterns = patterns.Generic

    lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return

        const importMatch = trimmed.match(langPatterns.imports)
        if (importMatch && importMatch[1]) meta.imports.push(importMatch[1].trim())

        const funcMatch = trimmed.match(langPatterns.functions)
        if (funcMatch && funcMatch[1]) {
            meta.symbols.push({
                name: funcMatch[1],
                type: "function",
                startLine: index + 1,
                endLine: index + 1 // Regex fallback can't easily find end line
            })
        }

        const classMatch = trimmed.match(langPatterns.classes)
        if (classMatch && classMatch[1]) {
            meta.symbols.push({
                name: classMatch[1],
                type: "class",
                startLine: index + 1,
                endLine: index + 1
            })
        }
    })

    meta.imports = Array.from(new Set(meta.imports.filter(Boolean)))
    return meta
}

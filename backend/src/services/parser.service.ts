import { parse } from "@babel/parser"
import traverse from "@babel/traverse"

export interface FileMetadata {
    fileName: string | undefined
    folderStructure: string
    imports: string[]
    exports: string[]
    functions: string[]
    classes: string[]
}

/**
 * Extracts structured metadata from source code using Babel.
 * Supports TypeScript and JSX.
 */
export function parseCodeFile(filePath: string, code: string): FileMetadata {
    try {
        const ast = parse(code, {
            sourceType: "module",
            plugins: ["typescript", "jsx", "decorators-legacy", "classProperties"]
        })

        const imports: string[] = []
        const exports: string[] = []
        const functions: string[] = []
        const classes: string[] = []

        traverse(ast, {
            ImportDeclaration(path) {
                imports.push(path.node.source.value)
            },

            ExportNamedDeclaration(path) {
                // handle: export const foo = ...
                if (path.node.declaration) {
                    const decl = path.node.declaration as any
                    if (decl.id?.name) {
                        exports.push(decl.id.name)
                    } else if (decl.declarations) {
                        decl.declarations.forEach((d: any) => {
                            if (d.id?.name) exports.push(d.id.name)
                        })
                    }
                }
                // handle: export { foo, bar }
                if (path.node.specifiers) {
                    path.node.specifiers.forEach((spec: any) => {
                        if (spec.exported?.name) exports.push(spec.exported.name)
                    })
                }
            },

            ExportDefaultDeclaration(path) {
                exports.push("default")
            },

            FunctionDeclaration(path) {
                if (path.node.id) {
                    functions.push(path.node.id.name)
                }
            },

            ClassDeclaration(path) {
                if (path.node.id) {
                    classes.push(path.node.id.name)
                }
            },

            // Arrow functions assigned to constants
            VariableDeclarator(path) {
                const id = path.node.id as any
                const init = path.node.init as any
                if (id?.name && (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression")) {
                    functions.push(id.name)
                }
            }
        })

        return {
            fileName: filePath.split("/").pop(),
            folderStructure: filePath,
            imports,
            exports,
            functions,
            classes
        }
    } catch (error) {
        console.error(`Error parsing file ${filePath}:`, error)
        // Return minimal metadata on error to avoid breaking the pipeline
        return {
            fileName: filePath.split("/").pop(),
            folderStructure: filePath,
            imports: [],
            exports: [],
            functions: [],
            classes: []
        }
    }
}

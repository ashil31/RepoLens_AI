import madge from "madge"

/**
 * Generates a dependency graph for the given repository path.
 * Returns an object where keys are file paths and values are arrays of dependencies.
 */
export async function generateDependencyGraph(repoPath: string) {
    try {
        const result = await madge(repoPath, {
            fileExtensions: ["ts", "js", "tsx", "jsx"],
            // Skip node_modules by default
            excludeRegExp: [/node_modules/]
        })

        const graph = result.obj()
        return graph
    } catch (error) {
        console.error(`Error generating dependency graph for ${repoPath}:`, error)
        // Return empty graph on failure
        return {}
    }
}

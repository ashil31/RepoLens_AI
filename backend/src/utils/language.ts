export const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
    // JavaScript / TypeScript
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",

    // Python
    ".py": "Python",
    ".pyw": "Python",

    // Go
    ".go": "Go",

    // Java / Kotlin / Scala
    ".java": "Java",
    ".kt": "Kotlin",
    ".kts": "Kotlin",
    ".scala": "Scala",

    // C / C++
    ".c": "C",
    ".cpp": "C++",
    ".h": "C/C++ Header",
    ".hpp": "C++ Header",
    ".cc": "C++",

    // C#
    ".cs": "C#",

    // Ruby
    ".rb": "Ruby",

    // PHP
    ".php": "PHP",

    // Swift
    ".swift": "Swift",

    // Rust
    ".rs": "Rust",

    // Shell
    ".sh": "Shell",
    ".bash": "Shell",

    // Config / Data
    ".yaml": "YAML",
    ".yml": "YAML",
    ".json": "JSON",
    ".md": "Markdown",
    ".xml": "XML",
    ".toml": "TOML",

    // Others
    ".dart": "Dart",
    ".lua": "Lua",
    ".sql": "SQL",
    ".gradle": "Gradle",
    ".ipynb": "Jupyter Notebook",
};

/**
 * Detects the programming language based on the file extension.
 * Defaults to "Text" if unknown.
 */
export function detectLanguage(filePath: string): string {
    const ext = "." + filePath.split(".").pop()?.toLowerCase();
    return EXTENSION_LANGUAGE_MAP[ext] || "Text";
}

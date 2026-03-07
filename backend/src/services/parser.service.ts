import * as fs from 'fs';
import * as path from 'path';

export interface ParsedMetadata {
    fileName: string;
    folderStructure: string;
    language: string;
    imports: string[];
    exports: string[];
    functions: string[];
    classes: string[];
}

// ─────────────────────────────────────────────────────────────
// Language detection by file extension
// ─────────────────────────────────────────────────────────────

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
    // JavaScript / TypeScript
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    // Python
    '.py': 'python',
    '.pyw': 'python',
    // Java
    '.java': 'java',
    // Kotlin
    '.kt': 'kotlin',
    '.kts': 'kotlin',
    // Go
    '.go': 'go',
    // Rust
    '.rs': 'rust',
    // C / C++
    '.c': 'c',
    '.h': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.hpp': 'cpp',
    // C#
    '.cs': 'csharp',
    // PHP
    '.php': 'php',
    // Ruby
    '.rb': 'ruby',
    // Swift
    '.swift': 'swift',
    // Dart
    '.dart': 'dart',
    // Scala
    '.scala': 'scala',
    // R
    '.r': 'r',
    '.R': 'r',
    // Shell scripts
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'bash',
    // Lua
    '.lua': 'lua',
    // Generic config/markup (best-effort)
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'css',
};

const detectLanguage = (filePath: string): string => {
    const ext = path.extname(filePath).toLowerCase();
    return EXTENSION_LANGUAGE_MAP[ext] || 'unknown';
};

// ─────────────────────────────────────────────────────────────
// Regex pattern definitions per language
// ─────────────────────────────────────────────────────────────

interface LangPatterns {
    imports: RegExp[];
    exports: RegExp[];
    functions: RegExp[];
    classes: RegExp[];
}

const PATTERNS: Record<string, LangPatterns> = {
    javascript: {
        imports: [
            /^import\s+.*?from\s+['"](.+?)['"]/m,
            /require\s*\(\s*['"](.+?)['"]\s*\)/,
        ],
        exports: [
            /^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)/m,
            /^module\.exports\s*=\s*(\w+)/m,
            /^exports\.(\w+)\s*=/m,
        ],
        functions: [
            /(?:async\s+)?function\s+(\w+)\s*\(/,
            /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(.*?\)\s*=>/,
            /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/,
        ],
        classes: [
            /^class\s+(\w+)/m,
        ],
    },
    typescript: {
        imports: [
            /^import\s+.*?from\s+['"](.+?)['"]/m,
            /require\s*\(\s*['"](.+?)['"]\s*\)/,
        ],
        exports: [
            /^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/m,
            /^export\s+\{\s*([\w,\s]+)\s*\}/m,
        ],
        functions: [
            /(?:async\s+)?function\s+(\w+)\s*[<(]/,
            /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(.*?\)\s*(?::\s*\w+)?\s*=>/,
            /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/,
            /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/m, // class methods
        ],
        classes: [
            /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/m,
            /^(?:export\s+)?interface\s+(\w+)/m,
        ],
    },
    python: {
        imports: [
            /^import\s+([\w.]+)/m,
            /^from\s+([\w.]+)\s+import/m,
        ],
        exports: [
            // Python has no explicit export keyword; anything at module level is exported
            /^(\w+)\s*=/m,
        ],
        functions: [
            /^def\s+(\w+)\s*\(/m,
            /^\s+def\s+(\w+)\s*\(/m, // class methods
        ],
        classes: [
            /^class\s+(\w+)/m,
        ],
    },
    java: {
        imports: [
            /^import\s+([\w.]+);/m,
        ],
        exports: [
            /^public\s+(?:static\s+)?(?:\w+\s+)+(\w+)\s*\(/m,
        ],
        functions: [
            /(?:public|private|protected|static|final|synchronized)[\w\s<>\[\]]*\s+(\w+)\s*\(/,
        ],
        classes: [
            /^(?:public\s+)?(?:abstract\s+)?class\s+(\w+)/m,
            /^(?:public\s+)?interface\s+(\w+)/m,
            /^(?:public\s+)?enum\s+(\w+)/m,
        ],
    },
    kotlin: {
        imports: [
            /^import\s+([\w.]+)/m,
        ],
        exports: [],
        functions: [
            /^fun\s+(\w+)\s*\(/m,
            /^\s+fun\s+(\w+)\s*\(/m,
        ],
        classes: [
            /^(?:data\s+|sealed\s+|abstract\s+)?class\s+(\w+)/m,
            /^object\s+(\w+)/m,
            /^interface\s+(\w+)/m,
        ],
    },
    go: {
        imports: [
            /^import\s+"([\w./]+)"/m,
            /"([\w./]+)"/,
        ],
        exports: [
            /^func\s+([A-Z]\w+)\s*\(/m, // Exported functions start with uppercase
        ],
        functions: [
            /^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/m,
        ],
        classes: [
            /^type\s+(\w+)\s+struct/m,
            /^type\s+(\w+)\s+interface/m,
        ],
    },
    rust: {
        imports: [
            /^use\s+([\w:]+)/m,
            /^extern\s+crate\s+(\w+)/m,
        ],
        exports: [
            /^pub\s+fn\s+(\w+)/m,
            /^pub\s+struct\s+(\w+)/m,
        ],
        functions: [
            /^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*[<(]/m,
        ],
        classes: [
            /^(?:pub\s+)?struct\s+(\w+)/m,
            /^(?:pub\s+)?enum\s+(\w+)/m,
            /^(?:pub\s+)?trait\s+(\w+)/m,
            /^impl\s+(\w+)/m,
        ],
    },
    c: {
        imports: [
            /^#include\s+[<"](.+?)[>"]/m,
        ],
        exports: [],
        functions: [
            /^[\w\s\*]+\s+(\w+)\s*\([^;]+\)\s*\{/m,
        ],
        classes: [],
    },
    cpp: {
        imports: [
            /^#include\s+[<"](.+?)[>"]/m,
            /^using\s+namespace\s+(\w+)/m,
        ],
        exports: [],
        functions: [
            /^[\w\s\*<>:]+\s+(\w+)::\w+\s*\(/m,
            /^[\w\s\*<>]+\s+(\w+)\s*\([^;]+\)\s*\{/m,
        ],
        classes: [
            /^class\s+(\w+)/m,
            /^struct\s+(\w+)/m,
            /^namespace\s+(\w+)/m,
        ],
    },
    csharp: {
        imports: [
            /^using\s+([\w.]+);/m,
        ],
        exports: [],
        functions: [
            /(?:public|private|protected|internal|static|override|virtual|async)[\w\s<>\[\]]*\s+(\w+)\s*\(/,
        ],
        classes: [
            /^(?:public\s+)?(?:abstract\s+|sealed\s+)?class\s+(\w+)/m,
            /^(?:public\s+)?interface\s+(\w+)/m,
            /^(?:public\s+)?enum\s+(\w+)/m,
        ],
    },
    php: {
        imports: [
            /^(?:require|include|require_once|include_once)\s*\(?['"](.+?)['"]\)?/m,
            /^use\s+([\w\\]+)/m,
        ],
        exports: [],
        functions: [
            /^(?:public\s+|private\s+|protected\s+|static\s+)*function\s+(\w+)\s*\(/m,
        ],
        classes: [
            /^(?:abstract\s+)?class\s+(\w+)/m,
            /^interface\s+(\w+)/m,
            /^trait\s+(\w+)/m,
        ],
    },
    ruby: {
        imports: [
            /^require\s+['"](.+?)['"]/m,
            /^require_relative\s+['"](.+?)['"]/m,
            /^include\s+(\w+)/m,
        ],
        exports: [],
        functions: [
            /^def\s+(\w[?!_\w]*)/m,
            /^\s+def\s+(\w[?!_\w]*)/m,
        ],
        classes: [
            /^class\s+(\w+)/m,
            /^module\s+(\w+)/m,
        ],
    },
    swift: {
        imports: [
            /^import\s+(\w+)/m,
        ],
        exports: [],
        functions: [
            /^(?:public\s+|private\s+|internal\s+|open\s+)?(?:override\s+)?func\s+(\w+)\s*[<(]/m,
            /^\s+func\s+(\w+)\s*\(/m,
        ],
        classes: [
            /^(?:public\s+|private\s+|internal\s+|open\s+)?class\s+(\w+)/m,
            /^(?:public\s+)?struct\s+(\w+)/m,
            /^(?:public\s+)?protocol\s+(\w+)/m,
            /^(?:public\s+)?enum\s+(\w+)/m,
        ],
    },
    dart: {
        imports: [
            /^import\s+['"](.+?)['"]/m,
        ],
        exports: [],
        functions: [
            /^(?:Future<\w+>|void|int|String|bool|List|Map|dynamic)?\s+(\w+)\s*\(/m,
            /^\s+(?:\w+\s+)?(\w+)\s*\([^;]+\)\s*\{/m,
        ],
        classes: [
            /^(?:abstract\s+)?class\s+(\w+)/m,
            /^mixin\s+(\w+)/m,
        ],
    },
    scala: {
        imports: [
            /^import\s+([\w.]+)/m,
        ],
        exports: [],
        functions: [
            /^(?:def|val|var)\s+(\w+)\s*[:(]/m,
            /^\s+def\s+(\w+)\s*[:(]/m,
        ],
        classes: [
            /^(?:case\s+)?class\s+(\w+)/m,
            /^object\s+(\w+)/m,
            /^trait\s+(\w+)/m,
        ],
    },
    r: {
        imports: [
            /^library\s*\(\s*(\w+)\s*\)/m,
            /^require\s*\(\s*(\w+)\s*\)/m,
            /^source\s*\(\s*['"](.+?)['"]\s*\)/m,
        ],
        exports: [],
        functions: [
            /^(\w+)\s*<-\s*function\s*\(/m,
            /^(\w+)\s*=\s*function\s*\(/m,
        ],
        classes: [
            /^setClass\s*\(\s*['"](\w+)['"]/m,
        ],
    },
    bash: {
        imports: [
            /^(?:source|\.\s+)\s+['"]?(.+?)['"]?$/m,
        ],
        exports: [
            /^export\s+(\w+)=/m,
        ],
        functions: [
            /^(?:function\s+)?(\w+)\s*\(\s*\)\s*\{/m,
        ],
        classes: [],
    },
    lua: {
        imports: [
            /^(?:local\s+\w+\s*=\s*)?require\s*\(?['"](.+?)['"]\)?/m,
        ],
        exports: [],
        functions: [
            /^(?:local\s+)?function\s+(\w+[\.:]\w+|\w+)\s*\(/m,
            /^(\w+)\s*=\s*function\s*\(/m,
        ],
        classes: [],
    },
};

// Fallback generic patterns for unknown languages
const GENERIC_PATTERNS: LangPatterns = {
    imports: [
        /^import\s+([\w./"']+)/m,
        /^#include\s+[<"](.+?)[>"]/m,
        /^use\s+([\w:]+)/m,
        /^require\s*\(?['"](.+?)['"]\)?/m,
        /^from\s+([\w.]+)\s+import/m,
    ],
    exports: [
        /^export\s+(?:default\s+)?(\w+)/m,
    ],
    functions: [
        /^(?:function|def|func|fun)\s+(\w+)\s*\(/m,
        /^(?:public|private|protected)\s+(?:\w+\s+)?(\w+)\s*\(/m,
    ],
    classes: [
        /^(?:class|struct|interface|trait|object)\s+(\w+)/m,
    ],
};

// ─────────────────────────────────────────────────────────────
// Extraction helper
// ─────────────────────────────────────────────────────────────

const extractAll = (code: string, patterns: RegExp[]): string[] => {
    const results: Set<string> = new Set();
    const lines = code.split('\n');

    for (const pattern of patterns) {
        // Test line by line for multiline patterns
        for (const line of lines) {
            const match = line.match(pattern);
            if (match) {
                const captured = match[1]?.trim();
                if (captured && captured.length > 0 && captured.length < 100) {
                    // Split comma-separated exports like { A, B, C }
                    captured.split(',').forEach(item => {
                        const clean = item.trim().replace(/[{}]/g, '');
                        if (clean) results.add(clean);
                    });
                }
            }
        }
    }

    return [...results];
};

// ─────────────────────────────────────────────────────────────
// Main parser
// ─────────────────────────────────────────────────────────────

/**
 * Parses any code file and extracts structured metadata:
 * imports, exports, functions, classes, folder structure.
 *
 * @param filePath - Absolute or relative path to the file
 * @returns ParsedMetadata
 */
export const parseFile = (filePath: string): ParsedMetadata => {
    const code = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const folderStructure = path.dirname(filePath);
    const language = detectLanguage(filePath);

    const patterns = PATTERNS[language] ?? GENERIC_PATTERNS;
    // Always merge with generic to catch anything language-specific patterns might miss
    const merged: LangPatterns = {
        imports: [...(patterns.imports || []), ...GENERIC_PATTERNS.imports],
        exports: [...(patterns.exports || []), ...GENERIC_PATTERNS.exports],
        functions: [...(patterns.functions || []), ...GENERIC_PATTERNS.functions],
        classes: [...(patterns.classes || []), ...GENERIC_PATTERNS.classes],
    };

    return {
        fileName,
        folderStructure,
        language,
        imports: extractAll(code, merged.imports),
        exports: extractAll(code, merged.exports),
        functions: extractAll(code, merged.functions),
        classes: extractAll(code, merged.classes),
    };
};

// ─────────────────────────────────────────────────────────────
// Formatter
// ─────────────────────────────────────────────────────────────

/**
 * Formats ParsedMetadata into a readable string.
 *
 * @param metadata - ParsedMetadata from parseFile()
 * @returns Formatted string output
 */
export const formatParsedOutput = (metadata: ParsedMetadata): string => {
    const lines: string[] = [];

    lines.push(`File: ${metadata.fileName}`);
    lines.push(`Language: ${metadata.language}`);
    lines.push(`Folder: ${metadata.folderStructure}`);
    lines.push('');

    if (metadata.classes.length > 0) {
        lines.push('Classes');
        metadata.classes.forEach(c => lines.push(`  ${c}`));
        lines.push('');
    }

    if (metadata.functions.length > 0) {
        lines.push('Functions');
        metadata.functions.forEach(f => lines.push(`  ${f}`));
        lines.push('');
    }

    if (metadata.exports.length > 0) {
        lines.push('Exports');
        metadata.exports.forEach(e => lines.push(`  ${e}`));
        lines.push('');
    }

    if (metadata.imports.length > 0) {
        lines.push('Imports');
        metadata.imports.forEach(i => lines.push(`  ${i}`));
    }

    return lines.join('\n').trim();
};

export const DEFAULT_IGNORED_DIRECTORIES = [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    'public',
];

export const DEFAULT_INCLUDED_DIRECTORIES = [
    'src',
    'lib',
    'controllers',
    'routes',
    'models',
];

export interface FilterOptions {
    /** Additional directories to ignore */
    extraIgnored?: string[];
    /** Additional directories to explicitly include */
    extraIncluded?: string[];
    /** If true, strictly include ONLY files that match the included directories. Default is false (include everything not ignored). */
    strictInclude?: boolean;
}

/**
 * Filter a list of file paths to remove unnecessary files before analysis.
 * 
 * @param filePaths - Array of file paths strings
 * @param options - Optional configuration for custom inclusions/exclusions
 * @returns Array of filtered file paths strings
 */
export const filterFiles = (filePaths: string[], options?: FilterOptions): string[] => {
    const ignored = [...DEFAULT_IGNORED_DIRECTORIES, ...(options?.extraIgnored || [])];
    const included = [...DEFAULT_INCLUDED_DIRECTORIES, ...(options?.extraIncluded || [])];
    const isStrict = options?.strictInclude ?? false; // Default to false so it includes everything not ignored

    return filePaths.filter((filePath) => {
        // Normalize path separators to forward slashes for consistent checking
        const normalizedPath = filePath.replace(/\\/g, '/');
        const pathSegments = normalizedPath.split('/');

        // 1. Check if the file is in any of the ignored directories
        const isIgnored = ignored.some((dir) => pathSegments.includes(dir));
        if (isIgnored) {
            return false; // Always drop ignored files
        }

        // 2. If we are in strict mode, ensure it matches at least one included directory
        if (isStrict && included.length > 0) {
            const isIncluded = included.some((dir) => pathSegments.includes(dir));
            if (!isIncluded) {
                return false; // Drop if not explicitly included
            }
        }

        // If it's not ignored (and passes strict mode if enabled), keep it!
        return true;
    });
};

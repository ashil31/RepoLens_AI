export const DEFAULT_IGNORED_DIRECTORIES = [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    'public',
    '.next',
    '.venv',
    '.turbo',
];

export const DEFAULT_IGNORED_FILES = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'tsconfig.json',
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
    const ignoredDirs = [...DEFAULT_IGNORED_DIRECTORIES, ...(options?.extraIgnored || [])];
    const ignoredFiles = [...DEFAULT_IGNORED_FILES];
    const included = [...DEFAULT_INCLUDED_DIRECTORIES, ...(options?.extraIncluded || [])];
    const isStrict = options?.strictInclude ?? false; // Default to false so it includes everything not ignored

    return filePaths.filter((filePath) => {
        // Normalize path separators to forward slashes for consistent checking
        const normalizedPath = filePath.replace(/\\/g, '/');
        const pathSegments = normalizedPath.split('/');
        const fileName = pathSegments[pathSegments.length - 1];

        // 1. Check if the file name is in the ignored files list
        if (ignoredFiles.includes(fileName)) {
            return false;
        }

        // 2. Check if the file is in any of the ignored directories
        const isIgnoredDir = ignoredDirs.some((dir) => pathSegments.includes(dir));
        if (isIgnoredDir) {
            return false; // Always drop ignored files
        }

        // 3. If we are in strict mode, ensure it matches at least one included directory
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

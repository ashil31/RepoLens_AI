import { Readable } from "stream"
import { pipeline } from "stream/promises"
import { Octokit } from "@octokit/rest"
import * as nodeCrypto from "crypto"
import { from as copyFrom } from "pg-copy-streams"
import { AppError } from "../utils/appError"
import { HTTPSTATUS } from "../config/http.config"
import {
    findReposByWorkspaceId,
    findRepoById,
    deleteRepository
} from "../repositories/project.repository"
import * as githubApi from "./github.service"
import * as githubRepository from "../repositories/github.repository"
import { prisma} from "../database/prisma"
import { JobStep } from "@prisma/client"
import pLimit from "p-limit"
import { parseCodeFile } from "./parser.service"
import { filterFiles } from "../utils/fileFilter"
import { resolveImport } from "../utils/importResolver"
import { buildApiDependencies } from "./api-dependency.service"
import { chunkCode, hashChunk } from "./chunking.service"
import { generateBatchedEmbeddings } from "./embedding.service"
import { AIService } from "./ai.service"
import { SymbolInfo, FileMetadata } from "./parser.service"

interface ParsedFile {
    path: string
    content: string
    meta: FileMetadata
}

// Default Octokit (no auth – public repos only)
const getDefaultOctokit = () => new Octokit({})

// ── Helpers ───────────────────────────────────────────────────────────────────

export const parseGitHubUrl = (repoUrl: string): { owner: string; name: string } => {
    try {
        const url = new URL(repoUrl)
        const parts = url.pathname.replace(/^\//, "").replace(/\/$/, "").split("/")
        if (parts.length < 2 || !parts[0] || !parts[1]) {
            throw new Error()
        }
        return { owner: parts[0], name: parts[1] }
    } catch {
        throw new AppError(
            "Invalid GitHub URL. Expected format: https://github.com/owner/repo",
            HTTPSTATUS.BAD_REQUEST,
            "INVALID_GITHUB_URL"
        )
    }
}

// ── GitHub Fetch & Save ───────────────────────────────────────────────────────

export const parseRepoFullName = (fullName: string): { owner: string; name: string } => {
    const parts = fullName.trim().split("/")
    if (parts.length < 2 || !parts[0] || !parts[1]) {
        throw new AppError(
            "Invalid repository full name. Expected format: owner/repo",
            HTTPSTATUS.BAD_REQUEST,
            "INVALID_REPO_FULL_NAME"
        )
    }
    return { owner: parts[0], name: parts[1] }
}

export const fetchRepositoryMetadata = async (owner: string, name: string, octokit: Octokit) => {
    try {
        const { data } = await octokit.repos.get({ owner, repo: name })
        return data as any
    } catch (err) {
        throw new AppError("Failed to fetch repository from GitHub. Ensure it is public or provide a token.", HTTPSTATUS.NOT_FOUND, "GITHUB_REPO_NOT_FOUND")
    }
}

export const fetchRepositoryFiles = async (
    owner: string,
    name: string,
    defaultBranch: string,
    octokit: Octokit,
    accessToken?: string
) => {
    const { data: branchData } = await octokit.repos.getBranch({ owner, repo: name, branch: defaultBranch })
    const treeSha = branchData.commit.commit.tree.sha

    const { data: treeData } = await octokit.git.getTree({
        owner,
        repo: name,
        tree_sha: treeSha,
        recursive: "true"
    })

    // Apply file filtering
    const allPaths = treeData.tree
        .filter(node => node.type === "blob" && node.path)
        .map(node => node.path as string)

    const filteredPaths = filterFiles(allPaths)

    const binaryExtensions = [
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
        ".mp4", ".mp3", ".wav", ".ogg",
        ".zip", ".tar", ".gz", ".rar",
        ".exe", ".dll", ".so",
        ".pdf", ".ico"
    ]

    const codeFiles = treeData.tree.filter((node) => {
        if (node.type !== "blob" || !node.path) return false
        if (!filteredPaths.includes(node.path)) return false
        const ext = node.path.split(".").pop()?.toLowerCase()
        if (!ext) return false
        return !binaryExtensions.includes("." + ext)
    })

    const MAX_FILES = 2000
    const filesToFetch = codeFiles.slice(0, MAX_FILES)

    const fileContents = await Promise.all(
        filesToFetch.map(async (fileNode) => {
            if (!fileNode.path) return { path: "", content: "" }
            try {
                const url = `https://raw.githubusercontent.com/${owner}/${name}/${defaultBranch}/${fileNode.path}`
                const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
                const response = await fetch(url, { headers })
                const content = await response.text()
                const sanitizedContent = content.replace(/\0/g, "")
                return { path: fileNode.path, content: sanitizedContent }
            } catch {
                return { path: fileNode.path, content: "" }
            }
        })
    )
    return fileContents.filter(f => f.path && f.content)
}

/**
 * Adds a log entry to an AnalysisJob.
 */
export async function addJobLog(jobId: string, message: string) {
    const job = await prisma.analysisJob.findUnique({
        where: { id: jobId },
        select: { logs: true }
    })
    const existingLogs = Array.isArray(job?.logs) ? (job!.logs as string[]) : []
    const newLogs = [...existingLogs, `[${new Date().toISOString()}] ${message}`]

    await prisma.analysisJob.update({
        where: { id: jobId },
        data: { logs: newLogs }
    })
}

/**
 * Updates an AnalysisJob's step and progress.
 */
export async function updateJobProgress(jobId: string, step: JobStep, progress: number) {
    await prisma.analysisJob.update({
        where: { id: jobId },
        data: { currentStep: step, progress }
    })
}

/**
 * The core analysis pipeline, used by workers.
 */
export const processRepositoryAnalysis = async (
    jobId: string,
    repositoryId: string,
    workspaceId: string,
    githubUrl: string,
    accessToken?: string
) => {
    await prisma.analysisJob.update({
        where: { id: jobId },
        data: {
            status: "PROCESSING",
            startedAt: new Date()
        }
    })

    const { owner, name } = parseGitHubUrl(githubUrl)
    const octokit = accessToken ? new Octokit({ auth: accessToken }) : getDefaultOctokit()

    const MAX_TOTAL_LINES = 100000
    const MAX_FILE_LINES = 5000
    let totalLinesProcessed = 0

    try {
        // 1. Fetch Metadata
        await updateJobProgress(jobId, "FETCHING_REPO", 5)
        await addJobLog(jobId, "Fetching repository metadata...")
        const repoMetadata = await fetchRepositoryMetadata(owner, name, octokit)
        await addJobLog(jobId, `Successfully fetched metadata for ${owner}/${name}`)

        // 2. Fetch Files
        await updateJobProgress(jobId, "DOWNLOADING_FILES", 15)
        await addJobLog(jobId, "Downloading repository files...")
        const fileContents = await fetchRepositoryFiles(owner, name, repoMetadata.default_branch, octokit, accessToken)
        await addJobLog(jobId, `Downloaded ${fileContents.length} files`)

        // 3. Parsing Code & Symbol Extraction (Parallelized with limits)
        await updateJobProgress(jobId, "PARSING_CODE", 25)
        await addJobLog(jobId, "Parsing code and extracting symbols...")

        const filteredFiles = fileContents.filter(f => {
            const lines = f.content.split("\n")
            if (lines.length > MAX_FILE_LINES) {
                addJobLog(jobId, `Skipping large file: ${f.path} (${lines.length} lines)`)
                return false
            }
            if (totalLinesProcessed + lines.length > MAX_TOTAL_LINES) {
                return false
            }
            totalLinesProcessed += lines.length
            return true
        })

        if (totalLinesProcessed >= MAX_TOTAL_LINES) {
            await addJobLog(jobId, `Total line limit reached (${MAX_TOTAL_LINES}). Some files were skipped.`)
        }

        const limit = pLimit(8)
        const parsedFiles: ParsedFile[] = await Promise.all(
            filteredFiles.map((file) =>
                limit(async () => ({
                    ...file,
                    meta: parseCodeFile(file.path, file.content)
                }))
            )
        )

        const allSymbols = parsedFiles.flatMap(f => f.meta.symbols.map(s => ({ ...s, filePath: f.path })))
        await addJobLog(jobId, `Extracted ${allSymbols.length} symbols from ${parsedFiles.length} files`)

        // 4. Building Graph
        await updateJobProgress(jobId, "BUILDING_GRAPH", 35)
        await addJobLog(jobId, "Building dependency graph...")

        const allFilePaths = new Set<string>(parsedFiles.map((f: ParsedFile) => f.path))
        const dependencies: { sourcePath: string; targetPath: string }[] = []
        const seenEdges = new Set<string>()

        parsedFiles.forEach((file: ParsedFile) => {
            file.meta.imports.forEach((imp: string) => {
                const resolved = resolveImport(file.path, imp.trim(), allFilePaths)
                if (!resolved || resolved === file.path) return
                const key = `${file.path}->${resolved}`
                if (seenEdges.has(key)) return
                seenEdges.add(key)
                dependencies.push({
                    sourcePath: file.path,
                    targetPath: resolved
                })
            })
        })

        // API edges: frontend (axios/fetch) → backend routes
        const apiDeps = buildApiDependencies(
            parsedFiles.map((f: ParsedFile) => ({ path: f.path, content: f.content, meta: f.meta }))
        )
        apiDeps.forEach((d) => {
            const key = `${d.sourcePath}->${d.targetPath}`
            if (seenEdges.has(key)) return
            seenEdges.add(key)
            dependencies.push(d)
        })

        await addJobLog(jobId, `Resolved ${dependencies.length} file dependencies (${apiDeps.length} API edges)`)

        // 5. Prepare for incremental embedding: fetch existing files (path -> contentHash)
        const existingFiles = await prisma.repositoryFile.findMany({
            where: { repositoryId },
            select: { id: true, path: true, contentHash: true }
        })
        const existingByPath = new Map(existingFiles.map(f => [f.path, f]))
        const newFilePaths = new Set<string>(parsedFiles.map((f: ParsedFile) => f.path))

        // Delete files no longer in repo
        const toDelete = existingFiles.filter(f => !newFilePaths.has(f.path))
        if (toDelete.length > 0) {
            await prisma.repositoryFile.deleteMany({ where: { id: { in: toDelete.map(f => f.id) } } })
            await addJobLog(jobId, `Removed ${toDelete.length} files no longer in repo`)
        }

        await prisma.repositoryDependency.deleteMany({ where: { repositoryId } })

        // 6. Streaming: Chunking, Embedding & Saving (Per File) - skip unchanged files
        // 6. Streaming: Chunking, Buffering, Embedding & Saving
        await updateJobProgress(jobId, "EMBEDDING", 50)
        await addJobLog(jobId, "Processing files with buffered embedding pipeline...")

        const CHUNK_BATCH_TARGET = 128

        type BufferedChunk = {
            chunk: any
            fileId: string
            language: string
        }

        let chunkBuffer: string[] = []
        let chunkMeta: BufferedChunk[] = []
        const globalChunkHashes = new Set<string>()

        /** Escape text for PostgreSQL COPY format: \ -> \\, \t\n\r preserved */
        function escapeCopyText(s: string): string {
            return s.replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r")
        }

        async function flushEmbeddingBuffer() {
            if (chunkBuffer.length === 0) return

            const embeddings = await generateBatchedEmbeddings(chunkBuffer)

            if (embeddings.length !== chunkMeta.length) {
                throw new Error(
                    `Embedding mismatch: expected ${chunkMeta.length}, got ${embeddings.length}`
                )
            }

            const rows: string[] = []
            for (let i = 0; i < embeddings.length; i++) {
                const meta = chunkMeta[i]
                const embedding = embeddings[i]
                const id = nodeCrypto.randomUUID()
                const chunkEscaped = escapeCopyText(meta.chunk.content)
                const vecStr = `[${(embedding as number[]).join(",")}]`
                const startLine = meta.chunk.startLine ?? "\\N"
                const endLine = meta.chunk.endLine ?? "\\N"
                const symbolName = meta.chunk.symbolName ? escapeCopyText(meta.chunk.symbolName) : "\\N"
                const language = meta.language ? escapeCopyText(meta.language) : "\\N"
                rows.push(`${id}\t${chunkEscaped}\t${vecStr}\t${startLine}\t${endLine}\t${meta.fileId}\t${symbolName}\t${language}`)
            }

            await prisma.$executeRawUnsafe(`
    INSERT INTO code_embeddings 
    (id, chunk, embedding, "startLine", "endLine", "fileId", "symbolName", "language")
    VALUES ${rows
        .map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}::vector, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`)
        .join(",")}
`,
...rows.flatMap((r, i) => {
    const parts = r.split("\t")
    return [
        parts[0], // id
        parts[1], // chunk
        parts[2], // embedding
        parts[3] === "\\N" ? null : Number(parts[3]),
        parts[4] === "\\N" ? null : Number(parts[4]),
        parts[5], // fileId
        parts[6] === "\\N" ? null : parts[6],
        parts[7] === "\\N" ? null : parts[7]
    ]
}))

            chunkBuffer = []
            chunkMeta = []
        }

        let skippedCount = 0
        for (let i = 0; i < parsedFiles.length; i++) {
            const file = parsedFiles[i]
            const contentHash = nodeCrypto.createHash("sha256").update(file.content).digest("hex")
            const existing = existingByPath.get(file.path)

            if (existing?.contentHash === contentHash) {
                skippedCount++
                continue
            }

            if (existing) {
                await prisma.repositoryFile.delete({ where: { id: existing.id } })
            }

            const chunks = chunkCode(file.content, file.meta.symbols)

            const dbFile = await prisma.repositoryFile.create({
                data: {
                    repositoryId,
                    path: file.path,
                    contentHash,
                    content: file.content,
                    language: file.meta.language,
                    symbols: file.meta.symbols as any,
                    chunkCount: chunks.length
                }
            })

            if (chunks.length === 0) continue

            // per-file deduplication
            const uniqueChunksMap = new Map<
                string,
                { content: string; originalIndexes: number[] }
            >()

            chunks.forEach((chunk, index) => {
                const hash = hashChunk(chunk.content)

                if (uniqueChunksMap.has(hash)) {
                    uniqueChunksMap.get(hash)!.originalIndexes.push(index)
                } else {
                    uniqueChunksMap.set(hash, { content: chunk.content, originalIndexes: [index] })
                }
            })

            const uniqueChunkEntries = Array.from(uniqueChunksMap.values())

            uniqueChunkEntries.forEach(entry => {
                entry.originalIndexes.forEach(idx => {
                    const chunk = chunks[idx]
                    const hash = hashChunk(chunk.content)

                    if (globalChunkHashes.has(hash)) return
                    globalChunkHashes.add(hash)

                    chunkBuffer.push(chunk.content)
                    chunkMeta.push({
                        chunk,
                        fileId: dbFile.id,
                        language: file.meta.language
                    })
                })
            })

            if (chunkBuffer.length >= CHUNK_BATCH_TARGET) {
                await flushEmbeddingBuffer()
            }
        }

        if (skippedCount > 0) {
            await addJobLog(jobId, `Skipped re-embedding ${skippedCount} unchanged files (content hash match)`)
        }

        for (let i = 0; i < parsedFiles.length; i++) {
            if (i % 5 === 0 || i === parsedFiles.length - 1) {
                const progress = 50 + Math.floor(((i + 1) / parsedFiles.length) * 30)
                await updateJobProgress(jobId, "EMBEDDING", progress)
            }
        }

        // flush remaining chunks
        await flushEmbeddingBuffer()

        // 7. Generating AI Analysis & Repository Summary
        await updateJobProgress(jobId, "GENERATING_AI", 85)
        await addJobLog(jobId, "Generating AI documentation and repository summary...")

        const overview = await AIService.generateRepositoryOverview({
            symbols: allSymbols,
            dependencies: dependencies
        })

        await new Promise(resolve => setTimeout(resolve, 1000))

        const architecture = await AIService.generateArchitectureAnalysis({
            symbols: allSymbols,
            dependencies: dependencies
        })

        // Generate Repo Summary for Vector Search
        const primaryLanguage = repoMetadata.language || "Unknown"
        const repoSummary = `
Repository: ${owner}/${name}
Primary Language: ${primaryLanguage}

File Structure:
${parsedFiles.slice(0, 50).map((f: ParsedFile) => f.path).join("\n")}${parsedFiles.length > 50 ? "\n..." : ""}

Key Symbols:
${allSymbols.slice(0, 50).map((s: any) => `${s.type}: ${s.name}`).join("\n")}${allSymbols.length > 50 ? "\n..." : ""}

Dependencies:
${Array.from(new Set(dependencies.map(d => d.targetPath))).slice(0, 30).join("\n")}
        `.trim()

        const [summaryEmbedding] = await generateBatchedEmbeddings([repoSummary])

        // 8. Finalize Repo Metadata & Summary Upsert
        await prisma.repository.update({
            where: { id: repositoryId },
            data: {
                description: repoMetadata.description || "",
                language: primaryLanguage,
                stars: repoMetadata.stargazers_count || 0,
                isPrivate: repoMetadata.private || false,
                status: "COMPLETED",
                analyzedAt: new Date(),
                documentation: overview,
                architecture: architecture,
                totalFiles: fileContents.length,
                mainLanguage: primaryLanguage
            }
        })

        // Save Repository Embedding (Delete old if exists, then create raw)
        await prisma.repositoryEmbedding.deleteMany({ where: { repositoryId } })
        
        const embeddingId = nodeCrypto.randomUUID()
        await prisma.$executeRawUnsafe(
            `INSERT INTO repository_embeddings (id, "repositoryId", summary, embedding, "createdAt") 
             VALUES ($1, $2, $3, $4::vector, NOW())`,
            embeddingId,
            repositoryId,
            repoSummary,
            `[${summaryEmbedding.join(",")}]`
        )

        // Bulk Create Dependencies
        if (dependencies.length > 0) {
            await prisma.repositoryDependency.createMany({
                data: dependencies.map(d => ({
                    repositoryId,
                    sourcePath: d.sourcePath,
                    targetPath: d.targetPath
                }))
            })
        }

        // Finalize Job
        await prisma.analysisJob.update({
            where: { id: jobId },
            data: {
                status: "COMPLETED",
                currentStep: "DONE",
                progress: 100,
                completedAt: new Date()
            }
        })

        await addJobLog(jobId, "Analysis completed successfully.")
        return { success: true }
    } catch (error) {
        console.error(`Analysis failed for job ${jobId}:`, error)
        const errorMessage = error instanceof Error ? error.message : "Internal server error"
        await prisma.analysisJob.update({
            where: { id: jobId },
            data: {
                status: "FAILED",
                error: errorMessage,
                completedAt: new Date()
            }
        })
        throw error
    }
}

export const fetchAndSaveRepository = async (
    workspaceId: string,
    githubUrl: string,
    accessToken?: string
) => {
    // Keep for back-compat or standalone use
    const { owner, name } = parseGitHubUrl(githubUrl)
    const octokit = accessToken ? new Octokit({ auth: accessToken }) : getDefaultOctokit()
    const repoMetadata = await fetchRepositoryMetadata(owner, name, octokit)
    const fileContents = await fetchRepositoryFiles(owner, name, repoMetadata.default_branch, octokit, accessToken)

    return prisma.$transaction(async (tx) => {
        const repo = await tx.repository.upsert({
            where: { workspaceId_owner_name: { workspaceId, owner, name } },
            update: {
                description: repoMetadata.description || "",
                language: repoMetadata.language || "",
                stars: repoMetadata.stargazers_count || 0,
                isPrivate: repoMetadata.private || false,
                status: "COMPLETED",
                analyzedAt: new Date()
            },
            create: {
                workspaceId,
                owner,
                name,
                description: repoMetadata.description || "",
                language: repoMetadata.language || "",
                stars: repoMetadata.stargazers_count || 0,
                isPrivate: repoMetadata.private || false,
                status: "COMPLETED",
                repoUrl: githubUrl
            }
        })

        await tx.repositoryFile.deleteMany({ where: { repositoryId: repo.id } })

        if (fileContents.length > 0) {
            await tx.repositoryFile.createMany({
                data: fileContents.map(f => ({
                    repositoryId: repo.id,
                    path: f.path,
                    content: f.content,
                    language: f.path.split(".").pop() || ""
                }))
            })
        }
        return repo
    })
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export const getWorkspaceRepositories = async (workspaceId: string) => {
    return findReposByWorkspaceId(workspaceId)
}

export const getRepositoryDetails = async (workspaceId: string, repoId: string) => {
    const repo = await prisma.repository.findUnique({
        where: { id: repoId },
        include: {
            files: { select: { id: true, path: true, language: true } },
            dependencies: { select: { sourcePath: true, targetPath: true } },
            analysisJobs: {
                where: { status: { in: ["PENDING", "PROCESSING"] } },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { id: true, currentStep: true, progress: true, status: true }
            }
        }
    })
    if (!repo || repo.workspaceId !== workspaceId) {
        throw new AppError("Repository not found", HTTPSTATUS.NOT_FOUND, "REPO_NOT_FOUND")
    }
    const activeJob = (repo.analysisJobs && repo.analysisJobs.length > 0) ? repo.analysisJobs[0] : null
    const { analysisJobs, ...rest } = repo
    return { ...rest, activeJob } as typeof rest & { activeJob: typeof activeJob }
}

export const getRepositoryFileContent = async (
    workspaceId: string,
    repoId: string,
    fileId: string
): Promise<{ content: string; path: string; language: string | null }> => {
    const repo = await prisma.repository.findUnique({
        where: { id: repoId },
        select: { workspaceId: true },
    })
    if (!repo || repo.workspaceId !== workspaceId) {
        throw new AppError("Repository not found", HTTPSTATUS.NOT_FOUND, "REPO_NOT_FOUND")
    }
    const file = await prisma.repositoryFile.findFirst({
        where: { id: fileId, repositoryId: repoId },
        select: { content: true, path: true, language: true },
    })
    if (!file) {
        throw new AppError("File not found", HTTPSTATUS.NOT_FOUND, "FILE_NOT_FOUND")
    }
    return {
        content: file.content ?? "",
        path: file.path,
        language: file.language,
    }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export const removeRepository = async (workspaceId: string, repoId: string, userId: string) => {
    const repo = await findRepoById(repoId)
    if (!repo) {
        throw new AppError("Repository not found", HTTPSTATUS.NOT_FOUND, "REPO_NOT_FOUND")
    }

    if (repo.workspaceId !== workspaceId) {
        throw new AppError("Forbidden", HTTPSTATUS.FORBIDDEN, "FORBIDDEN")
    }

    return deleteRepository(repoId)
}

// ── GitHub (workspace connection) ─────────────────────────────────────────────
// Delegates to github.service + github.repository; single entry for "repos + GitHub" per workspace.

export async function connectGitHub(
    workspaceId: string,
    userId: string,
    installationId: number
) {
    const details = await githubApi.getInstallationDetails(installationId)
    return githubRepository.upsertInstallation({
        githubInstallationId: installationId,
        githubAccountLogin: details.accountLogin,
        githubAccountId: details.accountId,
        userId,
        workspaceId
    })
}

export async function getGitHubRepositories(workspaceId: string, userId: string) {
    const installation = await githubRepository.findInstallationByUserAndWorkspace(userId, workspaceId)
    if (!installation) return { repos: [], connected: false, accountLogin: null as string | null }
    const repos = await githubApi.getInstallationRepositories(installation.githubInstallationId)
    return {
        repos: (repos as {
            full_name?: string
            name?: string
            private?: boolean
            default_branch?: string
            updated_at?: string | null
            description?: string | null
            language?: string | null
            stargazers_count?: number
            owner?: { login?: string }
        }[]).map((r) => ({
            fullName: r.full_name,
            name: r.name,
            private: r.private,
            defaultBranch: r.default_branch,
            updatedAt: r.updated_at ?? undefined,
            description: r.description ?? undefined,
            language: r.language ?? undefined,
            stars: r.stargazers_count ?? undefined,
            owner: r.owner?.login
        })),
        connected: true,
        accountLogin: installation.githubAccountLogin
    }
}

export async function getGitHubInstallationStatus(workspaceId: string, userId: string) {
    const installation = await githubRepository.findInstallationByUserAndWorkspace(userId, workspaceId)
    if (!installation) return { connected: false, accountLogin: null as string | null }
    return { connected: true, accountLogin: installation.githubAccountLogin }
}

export async function disconnectGitHub(workspaceId: string, userId: string) {
    return githubRepository.deleteInstallationByUserAndWorkspace(userId, workspaceId)
}

/** Returns installation token for this workspace (for adding repo by full name). Never store the token. */
export async function getInstallationTokenForWorkspace(
    workspaceId: string,
    userId: string
): Promise<string | null> {
    const installation = await githubRepository.findInstallationByUserAndWorkspace(userId, workspaceId)
    if (!installation) return null
    return githubApi.getInstallationToken(installation.githubInstallationId)
}

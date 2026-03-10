import { Octokit } from "@octokit/rest"
import { AppError } from "../utils/appError"
import { HTTPSTATUS } from "../config/http.config"
import {
    findReposByWorkspaceId,
    findRepoById,
    deleteRepository
} from "../repositories/project.repository"
import * as githubApi from "./github.service"
import * as githubRepository from "../repositories/github.repository"
import { prisma } from "../database/prisma"
import { JobStep } from "@prisma/client"

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

    const binaryExtensions = [
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
        ".mp4", ".mp3", ".wav", ".ogg",
        ".zip", ".tar", ".gz", ".rar",
        ".exe", ".dll", ".so",
        ".pdf", ".ico"
    ]
    const codeFiles = treeData.tree.filter((node) => {
        if (node.type !== "blob" || !node.path) return false
        const ext = node.path.split(".").pop()?.toLowerCase()
        if (!ext) return false
        return !binaryExtensions.includes("." + ext)
    })

    const MAX_FILES = 200
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
    const existingLogs = Array.isArray(job?.logs) ? (job.logs as string[]) : []
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
    const { owner, name } = parseGitHubUrl(githubUrl)
    const octokit = accessToken ? new Octokit({ auth: accessToken }) : getDefaultOctokit()

    try {
        // 1. Fetch Metadata
        await updateJobProgress(jobId, "FETCHING_REPO", 10)
        await addJobLog(jobId, "Fetching repository metadata...")
        const repoMetadata = await fetchRepositoryMetadata(owner, name, octokit)
        await addJobLog(jobId, `Successfully fetched metadata for ${owner}/${name}`)

        // 2. Fetch Files
        await updateJobProgress(jobId, "DOWNLOADING_FILES", 30)
        await addJobLog(jobId, "Downloading repository files...")
        const fileContents = await fetchRepositoryFiles(owner, name, repoMetadata.default_branch, octokit, accessToken)
        await addJobLog(jobId, `Downloaded ${fileContents.length} files`)

        // 3. Parsing Code
        await updateJobProgress(jobId, "PARSING_CODE", 50)
        await addJobLog(jobId, "Parsing code into AST...")
        // Here we would call parserService.parseCodeFile for each file

        // 4. Building Graph
        await updateJobProgress(jobId, "BUILDING_GRAPH", 70)
        await addJobLog(jobId, "Building dependency graph...")
        // Building dependency graph...

        // 5. Generating AI Analysis
        await updateJobProgress(jobId, "GENERATING_AI", 90)
        await addJobLog(jobId, "Generating AI documentation and architecture summary...")
        // AI analysis...

        // 6. Save to database in a transaction
        await prisma.$transaction(async (tx) => {
            await tx.repository.update({
                where: { id: repositoryId },
                data: {
                    description: repoMetadata.description || "",
                    language: repoMetadata.language || "",
                    stars: repoMetadata.stargazers_count || 0,
                    isPrivate: repoMetadata.private || false,
                    status: "COMPLETED",
                    analyzedAt: new Date(),
                    documentation: "AI-generated documentation placeholder",
                    architecture: "AI-generated architecture placeholder",
                    totalFiles: fileContents.length,
                    mainLanguage: repoMetadata.language || "Unknown"
                }
            })

            await tx.repositoryFile.deleteMany({ where: { repositoryId } })

            if (fileContents.length > 0) {
                await tx.repositoryFile.createMany({
                    data: fileContents.map(f => ({
                        repositoryId,
                        path: f.path,
                        content: f.content,
                        language: f.path.split(".").pop() || ""
                    }))
                })
            }

            // Finalize Job
            await tx.analysisJob.update({
                where: { id: jobId },
                data: {
                    status: "COMPLETED",
                    currentStep: "DONE",
                    progress: 100,
                    completedAt: new Date()
                }
            })
        }, {
            timeout: 30000 // 30 seconds
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
        include: { files: { select: { id: true, path: true, language: true } } }
    })
    if (!repo || repo.workspaceId !== workspaceId) {
        throw new AppError("Repository not found", HTTPSTATUS.NOT_FOUND, "REPO_NOT_FOUND")
    }
    return repo
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

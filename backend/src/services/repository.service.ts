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

export const fetchAndSaveRepository = async (
    workspaceId: string,
    githubUrl: string,
    accessToken?: string
) => {
    const { owner, name } = parseGitHubUrl(githubUrl)
    const octokit = accessToken ? new Octokit({ auth: accessToken }) : getDefaultOctokit()
    let repoMetadata: { default_branch: string; description?: string | null; language?: string | null; stargazers_count?: number; private?: boolean }
    try {
        const { data } = await octokit.repos.get({ owner, repo: name })
        repoMetadata = data
    } catch (err) {
        throw new AppError("Failed to fetch repository from GitHub. Ensure it is public or provide a token.", HTTPSTATUS.NOT_FOUND, "GITHUB_REPO_NOT_FOUND")
    }

    // 1. Fetch metadata (recursive)
    let fileContents: { path: string; content: string }[] = []
    try {
        const { data: branchData } = await octokit.repos.getBranch({ owner, repo: name, branch: repoMetadata.default_branch })
        const treeSha = branchData.commit.commit.tree.sha

        const { data: treeData } = await octokit.git.getTree({
            owner,
            repo: name,
            tree_sha: treeSha,
            recursive: "true"
        })

        // Filter for code files (excluding binary files)
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

        // For simplicity and speed in this module, we will fetch contents of a limited number of files
        // In a real production system, this would be queued or streamed
        const MAX_FILES = 200
        const filesToFetch = codeFiles.slice(0, MAX_FILES)

        fileContents = await Promise.all(
            filesToFetch.map(async (fileNode) => {
                if (!fileNode.path) return { path: "", content: "" }
                try {
                    const url = `https://raw.githubusercontent.com/${owner}/${name}/${repoMetadata.default_branch}/${fileNode.path}`
                    const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
                    const response = await fetch(url, { headers })
                    const content = await response.text()
                    // Sanitize: Remove null bytes which PostgreSQL doesn't allow in UTF-8 strings
                    const sanitizedContent = content.replace(/\0/g, "")
                    return { path: fileNode.path, content: sanitizedContent }
                } catch {
                    return { path: fileNode.path, content: "" }
                }
            })
        )
        fileContents = fileContents.filter(f => f.path && f.content)

    } catch (err) {
        console.error("Failed to fetch repository tree", err)
        // Non-fatal, we save without files or throw AppError
    }

    // 3. Save to database using a transaction
    return prisma.$transaction(async (tx) => {
        // Upsert repository
        const repo = await tx.repository.upsert({
            where: {
                workspaceId_owner_name: {
                    workspaceId,
                    owner,
                    name
                }
            },
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

        // Empty existing files to avoid duplicates/stale files on re-fetch
        await tx.repositoryFile.deleteMany({
            where: { repositoryId: repo.id }
        })

        // Save new files
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
    }, {
        timeout: 30000 // 30 seconds
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

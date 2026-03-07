import { Octokit } from "@octokit/rest"
import { AppError } from "../utils/appError"
import { HTTPSTATUS } from "../config/http.config"
import { findWorkspaceMember } from "../repositories/workspace.repository"
import {
    createRepository,
    findReposByWorkspaceId,
    findRepoByOwnerAndName,
    findRepoById,
    deleteRepository
} from "../repositories/project.repository"
import { prisma } from "../database/prisma"

// Initialize Octokit (you can optionally pass auth token from env vars)
const octokit = new Octokit({
    // auth: process.env.GITHUB_TOKEN
})

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

export const fetchAndSaveRepository = async (
    workspaceId: string,
    githubUrl: string
) => {
    const { owner, name } = parseGitHubUrl(githubUrl)

    // 1. Fetch metadata
    let repoMetadata
    try {
        const { data } = await octokit.repos.get({ owner, repo: name })
        repoMetadata = data
    } catch (err) {
        throw new AppError("Failed to fetch repository from GitHub. Ensure it is public or provide a token.", HTTPSTATUS.NOT_FOUND, "GITHUB_REPO_NOT_FOUND")
    }

    // 2. Fetch Default branch tree (recursive)
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

        // Filter for code files (avoiding images, binary files)
        const textExtensions = [".ts", ".js", ".json", ".md", ".html", ".css", ".py", ".java", ".cpp", ".c", ".go", ".rs"]
        const codeFiles = treeData.tree.filter(
            (node) => node.type === "blob" && textExtensions.some(ext => node.path?.endsWith(ext))
        )

        // For simplicity and speed in this module, we will fetch contents of a limited number of files
        // In a real production system, this would be queued or streamed
        const MAX_FILES = 20
        const filesToFetch = codeFiles.slice(0, MAX_FILES)

        fileContents = await Promise.all(
            filesToFetch.map(async (fileNode) => {
                if (!fileNode.path) return { path: "", content: "" }
                try {
                    const response = await fetch(`https://raw.githubusercontent.com/${owner}/${name}/${repoMetadata.default_branch}/${fileNode.path}`)
                    const content = await response.text()
                    return { path: fileNode.path, content }
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

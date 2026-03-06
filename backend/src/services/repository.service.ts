import { AppError } from "../utils/appError"
import { HTTPSTATUS } from "../config/http.config"
import {
    createRepository,
    findReposByUserId,
    findRepoByOwnerAndName,
    findRepoById,
    deleteRepository
} from "../repositories/project.repository"

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse a GitHub URL like https://github.com/facebook/react
 * and extract { owner, name }
 */
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

// ── Save / Update ─────────────────────────────────────────────────────────────

export const saveRepository = async (
    userId: string,
    data: {
        owner: string
        name: string
        description?: string
        language?: string
        stars?: number
        isPrivate?: boolean
    }
) => {
    return createRepository({ userId, ...data })
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export const getUserRepositories = async (userId: string) => {
    return findReposByUserId(userId)
}

export const getRepositoryByOwnerAndName = async (
    userId: string,
    owner: string,
    name: string
) => {
    const repo = await findRepoByOwnerAndName(userId, owner, name)
    if (!repo) {
        throw new AppError("Repository not found", HTTPSTATUS.NOT_FOUND, "REPO_NOT_FOUND")
    }
    return repo
}

export const getRepositoryById = async (repoId: string) => {
    const repo = await findRepoById(repoId)
    if (!repo) {
        throw new AppError("Repository not found", HTTPSTATUS.NOT_FOUND, "REPO_NOT_FOUND")
    }
    return repo
}

// ── Delete ────────────────────────────────────────────────────────────────────

export const removeRepository = async (userId: string, repoId: string) => {
    const repo = await findRepoById(repoId)
    if (!repo) {
        throw new AppError("Repository not found", HTTPSTATUS.NOT_FOUND, "REPO_NOT_FOUND")
    }
    if (repo.userId !== userId) {
        throw new AppError("Forbidden", HTTPSTATUS.FORBIDDEN, "FORBIDDEN")
    }
    return deleteRepository(repoId)
}

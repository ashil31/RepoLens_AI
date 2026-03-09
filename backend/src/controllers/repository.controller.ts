import { Request, Response } from "express"
import { HTTPSTATUS } from "../config/http.config"
import { catchAsync } from "../utils/catchAsync"
import { AppError } from "../utils/appError"
import { findWorkspaceMember } from "../repositories/workspace.repository"
import {
    fetchAndSaveRepository,
    getWorkspaceRepositories,
    getRepositoryDetails,
    removeRepository,
    parseRepoFullName,
    connectGitHub,
    getGitHubRepositories,
    getGitHubInstallationStatus,
    disconnectGitHub,
    getInstallationTokenForWorkspace
} from "../services/repository.service"
import * as githubService from "../services/github.service"
import * as githubRepository from "../repositories/github.repository"

async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
    if (!workspaceId) throw new AppError("Workspace ID required", HTTPSTATUS.BAD_REQUEST, "BAD_REQUEST")
    const member = await findWorkspaceMember(workspaceId, userId)
    if (!member) {
        throw new AppError("Forbidden: You do not have access to this workspace", HTTPSTATUS.FORBIDDEN, "FORBIDDEN")
    }
    return member
}

// ── Repositories (workspace repos in DB) ──────────────────────────────────────

export const addRepositoryHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    const { githubUrl, repositoryFullName } = req.body

    await verifyWorkspaceAccess(workspaceId, userId)

    let repo
    if (repositoryFullName && typeof repositoryFullName === "string") {
        const token = await getInstallationTokenForWorkspace(workspaceId, userId)
        if (!token) {
            throw new AppError("Connect GitHub App for this workspace to import repositories.", HTTPSTATUS.BAD_REQUEST, "GITHUB_NOT_CONNECTED")
        }
        const { owner, name } = parseRepoFullName(repositoryFullName)
        const url = `https://github.com/${owner}/${name}`
        repo = await fetchAndSaveRepository(workspaceId, url, token)
    } else if (githubUrl && typeof githubUrl === "string") {
        repo = await fetchAndSaveRepository(workspaceId, githubUrl)
    } else {
        throw new AppError("Either githubUrl or repositoryFullName is required", HTTPSTATUS.BAD_REQUEST, "BAD_REQUEST")
    }

    res.status(HTTPSTATUS.CREATED).json({
        message: "Repository added and analyzed successfully",
        data: repo
    })
})

export const getWorkspaceRepositoriesHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    await verifyWorkspaceAccess(workspaceId, userId)
    const repos = await getWorkspaceRepositories(workspaceId)
    res.status(HTTPSTATUS.OK).json({ data: repos })
})

export const getRepositoryDetailsHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    const repoId = req.params.repoId as string
    await verifyWorkspaceAccess(workspaceId, userId)
    const repo = await getRepositoryDetails(workspaceId, repoId)
    res.status(HTTPSTATUS.OK).json({ data: repo })
})

export const deleteRepositoryHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    const repoId = req.params.repoId as string
    await verifyWorkspaceAccess(workspaceId, userId)
    await removeRepository(workspaceId, repoId, userId)
    res.status(HTTPSTATUS.OK).json({ message: "Repository removed successfully" })
})

// ── GitHub (workspace connection: install, list from GitHub, status, disconnect) ─

export const installGitHubHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    const { installationId } = req.body
    if (installationId == null || typeof installationId !== "number") {
        throw new AppError("installationId is required", HTTPSTATUS.BAD_REQUEST, "BAD_REQUEST")
    }
    await verifyWorkspaceAccess(workspaceId, userId)
    const installation = await connectGitHub(workspaceId, userId, installationId)
    res.status(HTTPSTATUS.OK).json({
        message: "GitHub App connected successfully",
        data: { accountLogin: installation.githubAccountLogin }
    })
})

export const getGitHubRepositoriesHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    await verifyWorkspaceAccess(workspaceId, userId)
    const result = await getGitHubRepositories(workspaceId, userId)
    res.status(HTTPSTATUS.OK).json({
        data: result.repos,
        connected: result.connected,
        accountLogin: result.accountLogin
    })
})

export const getGitHubInstallationStatusHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    await verifyWorkspaceAccess(workspaceId, userId)
    const result = await getGitHubInstallationStatus(workspaceId, userId)
    res.status(HTTPSTATUS.OK).json({
        connected: result.connected,
        accountLogin: result.accountLogin
    })
})

export const disconnectGitHubHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    await verifyWorkspaceAccess(workspaceId, userId)
    await disconnectGitHub(workspaceId, userId)
    res.status(HTTPSTATUS.OK).json({ message: "GitHub App disconnected" })
})

// ── Webhook (no workspace; raw body, mounted in app.ts) ───────────────────────

export async function handleWebhook(req: Request, res: Response): Promise<void> {
    const rawBody = req.body
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
        res.status(HTTPSTATUS.BAD_REQUEST).send("Raw body required")
        return
    }
    const signature = req.headers["x-hub-signature-256"] as string | undefined
    if (!githubService.verifyWebhookSignature(rawBody, signature)) {
        res.status(HTTPSTATUS.UNAUTHORIZED).send("Invalid signature")
        return
    }
    let payload: { action?: string; installation?: { id: number }; [k: string]: unknown }
    try {
        payload = JSON.parse(rawBody.toString("utf8"))
    } catch {
        res.status(HTTPSTATUS.BAD_REQUEST).send("Invalid JSON")
        return
    }
    const event = req.headers["x-github-event"] as string

    try {
        if (event === "installation") {
            const action = payload.action
            const installation = payload.installation
            if (!installation || typeof installation.id !== "number") {
                res.status(HTTPSTATUS.BAD_REQUEST).send("Missing installation")
                return
            }
            if (action === "deleted" || action === "suspend") {
                await githubRepository.deleteInstallationByGithubId(installation.id)
            }
        }
    } catch (err) {
        console.error("[GitHub Webhook]", err)
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).send("Webhook handler error")
        return
    }
    res.status(HTTPSTATUS.OK).send("OK")
}

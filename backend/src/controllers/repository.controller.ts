import { Request, Response } from "express"
import { HTTPSTATUS } from "../config/http.config"
import { catchAsync } from "../utils/catchAsync"
import { AppError } from "../utils/appError"
import { findWorkspaceMember } from "../repositories/workspace.repository"
import {
    fetchAndSaveRepository,
    getWorkspaceRepositories,
    getRepositoryDetails,
    removeRepository
} from "../services/repository.service"

// Middleware-like function to ensure user is part of the workspace
const verifyWorkspaceAccess = async (workspaceId: string, userId: string) => {
    if (!workspaceId) throw new AppError("Workspace ID required", HTTPSTATUS.BAD_REQUEST, "BAD_REQUEST")
    const member = await findWorkspaceMember(workspaceId, userId)
    if (!member) {
        throw new AppError("Forbidden: You do not have access to this workspace", HTTPSTATUS.FORBIDDEN, "FORBIDDEN")
    }
    return member
}

export const addRepositoryHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    const { githubUrl } = req.body

    if (!githubUrl) {
        throw new AppError("GitHub URL is required", HTTPSTATUS.BAD_REQUEST, "BAD_REQUEST")
    }

    await verifyWorkspaceAccess(workspaceId, userId)

    const repo = await fetchAndSaveRepository(workspaceId, githubUrl)

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

    res.status(HTTPSTATUS.OK).json({
        data: repos
    })
})

export const getRepositoryDetailsHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    const repoId = req.params.repoId as string

    await verifyWorkspaceAccess(workspaceId, userId)

    const repo = await getRepositoryDetails(workspaceId, repoId)

    res.status(HTTPSTATUS.OK).json({
        data: repo
    })
})

export const deleteRepositoryHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.workspaceId as string
    const repoId = req.params.repoId as string

    await verifyWorkspaceAccess(workspaceId, userId)

    await removeRepository(workspaceId, repoId, userId)

    res.status(HTTPSTATUS.OK).json({
        message: "Repository removed successfully"
    })
})

import { Request, Response } from "express"
import { HTTPSTATUS } from "../config/http.config"
import { catchAsync } from "../utils/catchAsync"
import {
    createNewWorkspace,
    getUserWorkspaces,
    getWorkspaceDetails,
    updateWorkspaceDetails,
    removeWorkspace,
    inviteMemberToWorkspace,
    removeMember
} from "../services/workspace.service"

export const createWorkspaceHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const { name } = req.body

    const workspace = await createNewWorkspace(userId, name)
    res.status(HTTPSTATUS.CREATED).json({
        message: "Workspace created successfully",
        data: workspace
    })
})

export const getUserWorkspacesHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaces = await getUserWorkspaces(userId)

    res.status(HTTPSTATUS.OK).json({
        data: workspaces
    })
})

export const getWorkspaceByIdHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.id as string

    const workspace = await getWorkspaceDetails(userId, workspaceId)
    res.status(HTTPSTATUS.OK).json({
        data: workspace
    })
})

export const updateWorkspaceHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.id as string
    const { name } = req.body

    const workspace = await updateWorkspaceDetails(userId, workspaceId, name)
    res.status(HTTPSTATUS.OK).json({
        message: "Workspace updated successfully",
        data: workspace
    })
})

export const deleteWorkspaceHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const workspaceId = req.params.id as string

    await removeWorkspace(userId, workspaceId)
    res.status(HTTPSTATUS.OK).json({
        message: "Workspace deleted successfully"
    })
})

// ── Members ──────────────────────────────────────────────────────────────────

export const addMemberHandler = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.user!.id as string
    const workspaceId = req.params.id as string
    const { email, role } = req.body

    const member = await inviteMemberToWorkspace(ownerId, workspaceId, email, role)
    res.status(HTTPSTATUS.CREATED).json({
        message: "Member invited successfully",
        data: member
    })
})

export const removeMemberHandler = catchAsync(async (req: Request, res: Response) => {
    const requesterId = req.user!.id as string
    const workspaceId = req.params.id as string
    const userIdToRemove = req.params.userId as string

    await removeMember(requesterId, workspaceId, userIdToRemove)
    res.status(HTTPSTATUS.OK).json({
        message: "Member removed successfully"
    })
})

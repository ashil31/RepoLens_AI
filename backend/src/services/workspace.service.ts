import { AppError } from "../utils/appError"
import { HTTPSTATUS } from "../config/http.config"
import { WorkspaceRole } from "@prisma/client"
import {
    createWorkspace,
    findWorkspacesByUserId,
    findWorkspaceById,
    findWorkspaceMember,
    updateWorkspace,
    deleteWorkspace,
    addMemberToWorkspace,
    removeMemberFromWorkspace
} from "../repositories/workspace.repository"
import { findUserByEmail } from "../repositories/user.repository"

export const createNewWorkspace = async (userId: string, name: string) => {
    if (!name) {
        throw new AppError("Workspace name is required", HTTPSTATUS.BAD_REQUEST, "INVALID_INPUT")
    }
    return createWorkspace({ name, userId })
}

export const getUserWorkspaces = async (userId: string) => {
    return findWorkspacesByUserId(userId)
}

export const getWorkspaceDetails = async (userId: string, workspaceId: string) => {
    const workspace = await findWorkspaceById(workspaceId)
    if (!workspace) {
        throw new AppError("Workspace not found", HTTPSTATUS.NOT_FOUND, "WORKSPACE_NOT_FOUND")
    }

    const member = workspace.members.find((m) => m.userId === userId)
    if (!member) {
        throw new AppError("Forbidden", HTTPSTATUS.FORBIDDEN, "FORBIDDEN")
    }

    return workspace
}

export const updateWorkspaceDetails = async (userId: string, workspaceId: string, name: string) => {
    const member = await findWorkspaceMember(workspaceId, userId)
    if (!member || member.role !== WorkspaceRole.OWNER) {
        throw new AppError("Only the workspace owner can update it", HTTPSTATUS.FORBIDDEN, "FORBIDDEN")
    }
    return updateWorkspace(workspaceId, name)
}

export const removeWorkspace = async (userId: string, workspaceId: string) => {
    const member = await findWorkspaceMember(workspaceId, userId)
    if (!member || member.role !== WorkspaceRole.OWNER) {
        throw new AppError("Only the workspace owner can delete it", HTTPSTATUS.FORBIDDEN, "FORBIDDEN")
    }
    return deleteWorkspace(workspaceId)
}

// ── Members ──────────────────────────────────────────────────────────────────

export const inviteMemberToWorkspace = async (
    ownerId: string,
    workspaceId: string,
    emailToInvite: string,
    role: WorkspaceRole = WorkspaceRole.MEMBER
) => {
    const ownerMember = await findWorkspaceMember(workspaceId, ownerId)
    if (!ownerMember || ownerMember.role !== WorkspaceRole.OWNER) {
        throw new AppError("Only the workspace owner can invite members", HTTPSTATUS.FORBIDDEN, "FORBIDDEN")
    }

    // Optional: wait for auth repository grep to see if findUserByEmail exists there
    const userToInvite = await findUserByEmail(emailToInvite)
    if (!userToInvite) {
        throw new AppError("User not found with this email", HTTPSTATUS.NOT_FOUND, "USER_NOT_FOUND")
    }

    const existingMember = await findWorkspaceMember(workspaceId, userToInvite.id)
    if (existingMember) {
        throw new AppError("User is already a member", HTTPSTATUS.CONFLICT, "ALREADY_MEMBER")
    }

    return addMemberToWorkspace(workspaceId, userToInvite.id, role)
}

export const removeMember = async (requesterId: string, workspaceId: string, userIdToRemove: string) => {
    const requester = await findWorkspaceMember(workspaceId, requesterId)
    if (!requester) {
        throw new AppError("Workspace not found", HTTPSTATUS.NOT_FOUND, "NOT_FOUND")
    }

    // A user can remove themselves or an OWNER can remove others
    if (requester.userId !== userIdToRemove && requester.role !== WorkspaceRole.OWNER) {
        throw new AppError("Forbidden: Cannot remove this member", HTTPSTATUS.FORBIDDEN, "FORBIDDEN")
    }

    // Prevent owner from removing themselves if they are the only owner
    if (requester.userId === userIdToRemove && requester.role === WorkspaceRole.OWNER) {
        const workspace = await findWorkspaceById(workspaceId)
        const owners = workspace?.members.filter(m => m.role === WorkspaceRole.OWNER)
        if (owners && owners.length <= 1) {
            throw new AppError("Cannot remove the only owner. Delete the workspace instead.", HTTPSTATUS.BAD_REQUEST, "BAD_REQUEST")
        }
    }

    return removeMemberFromWorkspace(workspaceId, userIdToRemove)
}

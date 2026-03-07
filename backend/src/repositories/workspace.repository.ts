import { prisma } from "../database/prisma"
import { WorkspaceRole } from "@prisma/client"

// ── Create ───────────────────────────────────────────────────────────────────

export const createWorkspace = async (data: { name: string; userId: string }) => {
    return prisma.workspace.create({
        data: {
            name: data.name,
            members: {
                create: {
                    userId: data.userId,
                    role: WorkspaceRole.OWNER
                }
            }
        },
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, email: true }
                    }
                }
            }
        }
    })
}

// ── Read ─────────────────────────────────────────────────────────────────────

export const findWorkspacesByUserId = async (userId: string) => {
    return prisma.workspace.findMany({
        where: {
            members: {
                some: { userId }
            }
        },
        include: {
            members: {
                include: {
                    user: { select: { id: true, email: true } }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })
}

export const findWorkspaceById = async (workspaceId: string) => {
    return prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            members: {
                include: {
                    user: { select: { id: true, email: true } }
                }
            }
        }
    })
}

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
    return prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: { workspaceId, userId }
        }
    })
}

// ── Members ──────────────────────────────────────────────────────────────────

export const addMemberToWorkspace = async (
    workspaceId: string,
    userId: string,
    role: WorkspaceRole = WorkspaceRole.MEMBER
) => {
    return prisma.workspaceMember.create({
        data: {
            workspaceId,
            userId,
            role
        }
    })
}

export const removeMemberFromWorkspace = async (workspaceId: string, userId: string) => {
    return prisma.workspaceMember.delete({
        where: {
            workspaceId_userId: { workspaceId, userId }
        }
    })
}

// ── Update & Delete ──────────────────────────────────────────────────────────

export const updateWorkspace = async (workspaceId: string, name: string) => {
    return prisma.workspace.update({
        where: { id: workspaceId },
        data: { name }
    })
}

export const deleteWorkspace = async (workspaceId: string) => {
    return prisma.workspace.delete({
        where: { id: workspaceId }
    })
}

import { prisma } from "../database/prisma"

// ── Create ───────────────────────────────────────────────────────────────────

export const createRepository = async (data: {
    workspaceId: string
    owner: string
    name: string
    description?: string
    language?: string
    stars?: number
    isPrivate?: boolean
}) => {
    return prisma.repository.upsert({
        where: {
            workspaceId_owner_name: {
                workspaceId: data.workspaceId,
                owner: data.owner,
                name: data.name
            }
        },
        update: {
            description: data.description,
            language: data.language,
            stars: data.stars,
            isPrivate: data.isPrivate ?? false,
            analyzedAt: new Date()
        },
        create: {
            workspaceId: data.workspaceId,
            owner: data.owner,
            name: data.name,
            description: data.description,
            language: data.language,
            stars: data.stars,
            isPrivate: data.isPrivate ?? false
        }
    })
}

// ── Read ─────────────────────────────────────────────────────────────────────

export const findReposByWorkspaceId = async (workspaceId: string) => {
    return prisma.repository.findMany({
        where: { workspaceId },
        orderBy: { analyzedAt: "desc" }
    })
}

export const findRepoByOwnerAndName = async (
    workspaceId: string,
    owner: string,
    name: string
) => {
    return prisma.repository.findUnique({
        where: {
            workspaceId_owner_name: { workspaceId, owner, name }
        }
    })
}

export const findRepoById = async (repoId: string) => {
    return prisma.repository.findUnique({
        where: { id: repoId }
    })
}

// ── Delete ────────────────────────────────────────────────────────────────────

export const deleteRepository = async (repoId: string) => {
    return prisma.repository.delete({
        where: { id: repoId }
    })
}

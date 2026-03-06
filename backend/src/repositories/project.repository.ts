import { prisma } from "../database/prisma"

// ── Create ───────────────────────────────────────────────────────────────────

export const createRepository = async (data: {
    userId: string
    owner: string
    name: string
    description?: string
    language?: string
    stars?: number
    isPrivate?: boolean
}) => {
    return prisma.repository.upsert({
        where: {
            userId_owner_name: {
                userId: data.userId,
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
            userId: data.userId,
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

export const findReposByUserId = async (userId: string) => {
    return prisma.repository.findMany({
        where: { userId },
        orderBy: { analyzedAt: "desc" }
    })
}

export const findRepoByOwnerAndName = async (
    userId: string,
    owner: string,
    name: string
) => {
    return prisma.repository.findUnique({
        where: {
            userId_owner_name: { userId, owner, name }
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

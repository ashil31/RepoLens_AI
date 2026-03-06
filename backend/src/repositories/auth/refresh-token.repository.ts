import { prisma } from "../../database/prisma"

export const createRefreshToken = async (data: {
    tokenHash: string
    userId: string
    expiresAt: Date
    device?: string
    ip?: string
}) => {
    return prisma.refreshToken.create({
        data: {
            tokenHash: data.tokenHash,
            userId: data.userId,
            expiresAt: data.expiresAt,
            device: data.device,
            ip: data.ip
        }
    })
}

export const findRefreshTokenByHash = async (tokenHash: string) => {
    return prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true }
    })
}

export const deleteRefreshTokenByHash = async (tokenHash: string) => {
    return prisma.refreshToken.delete({
        where: { tokenHash }
    })
}

export const getUserActiveSessions = async (userId: string) => {
    return prisma.refreshToken.findMany({
        where: {
            userId,
            revoked: false,
            expiresAt: { gt: new Date() }
        },
        select: {
            id: true,
            device: true,
            ip: true,
            createdAt: true,
            expiresAt: true
        }
    })
}

export const revokeRefreshTokenById = async (id: string) => {
    return prisma.refreshToken.update({
        where: { id },
        data: { revoked: true }
    })
}

export const revokeAllUserRefreshTokens = async (userId: string) => {
    return prisma.refreshToken.deleteMany({
        where: { userId }
    })
}

export const deleteExpiredRefreshTokens = async () => {
    return prisma.refreshToken.deleteMany({
        where: {
            expiresAt: { lt: new Date() }
        }
    })
}

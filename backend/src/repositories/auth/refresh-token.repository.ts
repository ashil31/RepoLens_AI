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
    await prisma.refreshToken.deleteMany({
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

/** Revoke all active tokens for this user + device + ip so we keep one session per device. */
export const revokeActiveByUserAndDevice = async (
    userId: string,
    device?: string | null,
    ip?: string | null
) => {
    await prisma.refreshToken.updateMany({
        where: {
            userId,
            revoked: false,
            expiresAt: { gt: new Date() },
            ...(device != null && { device }),
            ...(ip != null && { ip })
        },
        data: { revoked: true }
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

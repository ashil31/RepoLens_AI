import { prisma } from "../database/prisma"

// ── Create ───────────────────────────────────────────────────────────────────

export const createUser = async (data: {
    email: string
    passwordHash?: string
}) => {
    return prisma.user.create({
        data: {
            email: data.email,
            passwordHash: data.passwordHash,
            credits: 2
        }
    })
}

// ── Read ─────────────────────────────────────────────────────────────────────

export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email }
    })
}

export const findUserByGoogleId = async (googleId: string) => {
    return prisma.user.findUnique({
        where: { googleId }
    })
}

export const findUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
    })
}

// ── Credits ───────────────────────────────────────────────────────────────────

export const getUserCredits = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true }
    })
    return user?.credits ?? 0
}

export const deductCredit = async (userId: string) => {
    return prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } }
    })
}

export const addCredits = async (userId: string, amount: number) => {
    return prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } }
    })
}

// ── Update ────────────────────────────────────────────────────────────────────

export const updateUserPassword = async (
    userId: string,
    passwordHash: string
) => {
    return prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
    })
}

export const markUserAsVerified = async (userId: string) => {
    return prisma.user.update({
        where: { id: userId },
        data: { isVerified: true }
    })
}

export const createGoogleUser = async (data: {
    email: string
    googleId: string
}) => {
    return prisma.user.create({
        data: {
            email: data.email,
            googleId: data.googleId,
            isVerified: true, // Google users are pre-verified
            credits: 5 // Bonus for google sign up? keeping it consistent or 2
        }
    })
}

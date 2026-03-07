import bcrypt from "bcryptjs"
import { AppError } from "../utils/appError"
import { HTTPSTATUS } from "../config/http.config"
import {
    createUser,
    findUserByEmail,
    findUserById,
    findUserByGoogleId,
    createGoogleUser,
    markUserAsVerified,
    getUserCredits,
    deductCredit
} from "../repositories/user.repository"
import { AppError as AppAppError } from "../utils/appError"

const SALT_ROUNDS = 12

// ── Register ─────────────────────────────────────────────────────────────────

export const registerUser = async (email: string, password: string) => {
    const existing = await findUserByEmail(email)
    if (existing) {
        throw new AppAppError("Email already in use", HTTPSTATUS.CONFLICT, "EMAIL_EXISTS")
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await createUser({ email, passwordHash })

    return user
}

export const verifyUserEmail = async (userId: string) => {
    return markUserAsVerified(userId)
}

export const handleGoogleAuth = async (email: string, googleId: string) => {
    let user = await findUserByGoogleId(googleId)
    if (!user) {
        // Check if user exists with same email but no googleId
        const existingEmail = await findUserByEmail(email)
        if (existingEmail) {
            // Link account or error? Professional way is usually to link if verified or error
            // For now let's just error if it's already a local account to be safe, or link it.
            // Linking: update existing email user with googleId
            // But let's keep it simple: create new or find.
            throw new AppAppError("Email already registered with another method", HTTPSTATUS.CONFLICT)
        }
        user = await createGoogleUser({ email, googleId })
    }
    return user
}

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginUser = async (email: string, password: string) => {
    const user = await findUserByEmail(email)
    if (!user || !user.passwordHash) {
        throw new AppAppError("Invalid credentials", HTTPSTATUS.UNAUTHORIZED, "INVALID_CREDENTIALS")
    }

    if (!user.isVerified) {
        throw new AppAppError("Please verify your email first", HTTPSTATUS.FORBIDDEN, "EMAIL_NOT_VERIFIED")
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
        throw new AppAppError("Invalid credentials", HTTPSTATUS.UNAUTHORIZED, "INVALID_CREDENTIALS")
    }

    return user
}

// ── Profile ───────────────────────────────────────────────────────────────────

export const getUserProfile = async (userId: string) => {
    const user = await findUserById(userId)
    if (!user) {
        throw new AppError("User not found", HTTPSTATUS.NOT_FOUND, "USER_NOT_FOUND")
    }
    return user
}

export const updateProfile = async (
    userId: string,
    data: { fullName?: string; username?: string; profileImage?: string }
) => {
    const { updateUserProfile } = await import("../repositories/user.repository")

    // Check if username is already taken by someone else
    if (data.username) {
        const { findUserByUsername } = await import("../repositories/user.repository")
        const existingUsername = await findUserByUsername(data.username)
        if (existingUsername && existingUsername.id !== userId) {
            throw new AppError("Username is already taken", HTTPSTATUS.CONFLICT, "USERNAME_TAKEN")
        }
    }

    const updatedUser = await updateUserProfile(userId, data)
    return updatedUser
}

// ── Credits ───────────────────────────────────────────────────────────────────

export const checkAndDeductCredit = async (userId: string) => {
    const credits = await getUserCredits(userId)
    if (credits <= 0) {
        throw new AppError(
            "Insufficient credits. Please top up to continue analyzing repositories.",
            HTTPSTATUS.FORBIDDEN,
            "INSUFFICIENT_CREDITS"
        )
    }
    await deductCredit(userId)
}

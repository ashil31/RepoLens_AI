import { Request, Response } from "express"
import { HTTPSTATUS } from "../config/http.config"
import { asyncHandler } from "../middlewares/asyncHandler.middleware"
import { registerUser, loginUser, verifyUserEmail, handleGoogleAuth } from "../services/user.service"
import * as AuthService from "../services/auth.service"
import * as RefreshTokenRepo from "../repositories/auth/refresh-token.repository"
import { createNewWorkspace, getUserWorkspaces } from "../services/workspace.service"
import { findUserById } from "../repositories/user.repository"
import { config } from "../config/app.config"
import { prisma } from "../database/prisma"
import { AppError } from "../utils/appError"

// ── Helpers ───────────────────────────────────────────────────────────────────

const setRefreshTokenCookie = (res: Response, token: string) => {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: config.JWT_REFRESH_EXPIRES_MS
    })
}

// ── Controllers ───────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body
    const user = await registerUser(email, password)

    // Generate and "send" OTP
    await AuthService.generateOtp(user.id, "EMAIL_VERIFICATION")

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Registration successful. Please check your email for the verification code.",
        userId: user.id
    })
})

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { userId, code } = req.body

    const isValid = await AuthService.verifyOtp(userId, code, "EMAIL_VERIFICATION")
    if (!isValid) {
        throw new AppError("Invalid or expired OTP", HTTPSTATUS.BAD_REQUEST)
    }

    await verifyUserEmail(userId)

    // Create a default workspace for the new user
    await createNewWorkspace(userId, "My Workspace")

    return res.status(HTTPSTATUS.OK).json({
        message: "Email verified successfully. You can now login."
    })
})

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body
    const user = await loginUser(email, password)

    // Ensure user has at least one workspace (for existing users who signed up before default workspace was added)
    const workspaces = await getUserWorkspaces(user.id)
    if (workspaces.length === 0) {
        await createNewWorkspace(user.id, "My Workspace")
    }

    const userAgent = (req.headers["user-agent"] as string) || "unknown"
    const ip = req.ip || req.socket.remoteAddress || "unknown"

    const accessToken = AuthService.generateAccessToken({ id: user.id, email: user.email })
    const refreshToken = await AuthService.generateRefreshToken(user.id, userAgent, ip)

    setRefreshTokenCookie(res, refreshToken)

    return res.status(HTTPSTATUS.OK).json({
        message: "Login successful",
        accessToken,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            username: user.username,
            credits: user.credits,
        }
    })
})

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const oldRefreshToken = req.cookies.refreshToken
    if (!oldRefreshToken) {
        throw new AppError("Refresh token missing", HTTPSTATUS.UNAUTHORIZED)
    }

    const user = await AuthService.verifyRefreshToken(oldRefreshToken)
    if (!user) {
        throw new AppError("Invalid or expired refresh token", HTTPSTATUS.UNAUTHORIZED)
    }

    const userAgent = (req.headers["user-agent"] as string) || "unknown"
    const ip = req.ip || req.socket.remoteAddress || "unknown"

    const accessToken = AuthService.generateAccessToken({ id: user.id, email: user.email })
    const newRefreshToken = await AuthService.rotateRefreshToken(oldRefreshToken, user.id, userAgent, ip)

    setRefreshTokenCookie(res, newRefreshToken)

    return res.status(HTTPSTATUS.OK).json({
        accessToken
    })
})

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id
    const sessions = await RefreshTokenRepo.getUserActiveSessions(userId)
    const refreshToken = req.cookies.refreshToken
    let currentSessionId: string | null = null
    if (refreshToken) {
        currentSessionId = await AuthService.getSessionIdByRawToken(refreshToken)
    }

    return res.status(HTTPSTATUS.OK).json({
        sessions,
        currentSessionId
    })
})

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params
    const userId = (req as any).user.id

    // Fetch session and verify ownership
    const session = await prisma.refreshToken.findUnique({
        where: { id: sessionId as string }
    })

    if (!session || session.userId !== userId) {
        throw new AppError("Session not found or unauthorized", HTTPSTATUS.NOT_FOUND)
    }

    await RefreshTokenRepo.revokeRefreshTokenById(sessionId as string)

    return res.status(HTTPSTATUS.OK).json({
        message: "Session revoked successfully"
    })
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken
    if (refreshToken) {
        await AuthService.revokeRefreshTokenByRawToken(refreshToken)
    }
    res.clearCookie("refreshToken", { path: "/" })
    return res.status(HTTPSTATUS.OK).json({
        message: "Logged out successfully"
    })
})

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const jwtUser = (req as any).user as { id: string; email: string }
    const user = await findUserById(jwtUser.id)
    if (!user) {
        throw new AppError("User not found", HTTPSTATUS.NOT_FOUND)
    }
    return res.status(HTTPSTATUS.OK).json({
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            username: user.username,
            profileImage: user.profileImage,
            credits: user.credits,
        }
    })
})

import { Request, Response } from "express"
import { HTTPSTATUS } from "../config/http.config"
import { asyncHandler } from "../middlewares/asyncHandler.middleware"
import { registerUser, loginUser, verifyUserEmail, handleGoogleAuth } from "../services/user.service"
import * as AuthService from "../services/auth.service"
import * as RefreshTokenRepo from "../repositories/refresh-token.repository"
import { prisma } from "../database/prisma"
import { AppError } from "../utils/appError"

// ── Helpers ───────────────────────────────────────────────────────────────────

const setRefreshTokenCookie = (res: Response, token: string) => {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/", // Important for cross-route access
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
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

    return res.status(HTTPSTATUS.OK).json({
        message: "Email verified successfully. You can now login."
    })
})

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body
    const user = await loginUser(email, password)

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
            credits: user.credits
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

    return res.status(HTTPSTATUS.OK).json({
        sessions
    })
})

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params
    const userId = (req as any).user.id

    // Fetch session and verify ownership
    const session = await prisma.refreshToken.findUnique({
        where: { id: sessionId }
    })

    if (!session || session.userId !== userId) {
        throw new AppError("Session not found or unauthorized", HTTPSTATUS.NOT_FOUND)
    }

    await RefreshTokenRepo.revokeRefreshTokenById(sessionId)

    return res.status(HTTPSTATUS.OK).json({
        message: "Session revoked successfully"
    })
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken
    if (refreshToken) {
        // Optional: delete from DB
        await AuthService.rotateRefreshToken(refreshToken, "")
    }
    res.clearCookie("refreshToken", { path: "/" })
    return res.status(HTTPSTATUS.OK).json({
        message: "Logged out successfully"
    })
})

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    return res.status(HTTPSTATUS.OK).json({
        user
    })
})

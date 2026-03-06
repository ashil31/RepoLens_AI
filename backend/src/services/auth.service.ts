import jwt from "jsonwebtoken"
import crypto from "crypto"
import { config } from "../config/app.config"
import * as RefreshTokenRepo from "../repositories/refresh-token.repository"
import * as OtpRepo from "../repositories/otp.repository"
import { OtpType, User } from "@prisma/client"

const hashToken = (token: string) => {
    return crypto.createHash("sha256").update(token).digest("hex")
}

export const generateAccessToken = (user: { id: string; email: string }) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        config.JWT_ACCESS_SECRET,
        { expiresIn: config.JWT_ACCESS_EXPIRES_IN as any }
    )
}

export const generateRefreshToken = async (userId: string, device?: string, ip?: string) => {
    const token = crypto.randomBytes(40).toString("hex")
    const tokenHash = hashToken(token)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    await RefreshTokenRepo.createRefreshToken({
        tokenHash,
        userId,
        expiresAt,
        device,
        ip
    })

    return token
}

export const verifyRefreshToken = async (token: string) => {
    const tokenHash = hashToken(token)
    const storedToken = await RefreshTokenRepo.findRefreshTokenByHash(tokenHash)

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
        if (storedToken) {
            await RefreshTokenRepo.deleteRefreshTokenByHash(tokenHash)
        }
        return null
    }

    return storedToken.user
}

export const rotateRefreshToken = async (oldToken: string, userId: string, device?: string, ip?: string) => {
    const oldHash = hashToken(oldToken)
    await RefreshTokenRepo.deleteRefreshTokenByHash(oldHash)
    return generateRefreshToken(userId, device, ip)
}

// ── OTP ──────────────────────────────────────────────────────────────────────

export const generateOtp = async (userId: string, type: OtpType = "EMAIL_VERIFICATION") => {
    const code = Math.floor(100000 + Math.random() * 900000).toString() // 6 digit OTP
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10 minutes

    await OtpRepo.createOtp({
        userId,
        code,
        type,
        expiresAt
    })

    // In a real app, send this via email
    console.log(`[OTP] For User ${userId}: ${code}`)

    return code
}

export const verifyOtp = async (userId: string, code: string, type: OtpType) => {
    const otp = await OtpRepo.findValidOtp(userId, code, type)
    if (!otp) return false

    await OtpRepo.deleteOtp(otp.id)
    return true
}

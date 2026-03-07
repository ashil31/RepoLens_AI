import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config/app.config"
import { AppError } from "../utils/appError"
import { HTTPSTATUS } from "../config/http.config"
import { getUserCredits } from "../repositories/user.repository"

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null

    if (!token) {
        return next(new AppError("Unauthorized - Access token missing", HTTPSTATUS.UNAUTHORIZED))
    }

    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET as string)
            ; (req as any).user = decoded
        next()
    } catch (error) {
        console.error("[Auth] Token verification failed:", error)
        return next(new AppError("Invalid or expired access token", HTTPSTATUS.UNAUTHORIZED))
    }
}

/**
 * Middleware to check if user has specific roles (if implemented)
 * For now, just a placeholder for future-proofing.
 */
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user
        if (!user) {
            return next(new AppError("Unauthorized", HTTPSTATUS.UNAUTHORIZED))
        }
        // Future: check user.role
        next()
    }
}

/**
 * Middleware to check if user has enough credits before performing an action
 */
export const creditCheck = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const userId = (req as any).user?.id
    if (!userId) {
        return next(new AppError("Unauthorized", HTTPSTATUS.UNAUTHORIZED))
    }

    try {
        const credits = await getUserCredits(userId)
        if (credits <= 0) {
            return next(
                new AppError(
                    "Insufficient credits. Please top up to continue.",
                    HTTPSTATUS.FORBIDDEN,
                    "INSUFFICIENT_CREDITS"
                )
            )
        }
        next()
    } catch (error) {
        next(error)
    }
}

import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config/app.config"
import { AppError } from "../utils/appError"
import { HTTPSTATUS } from "../config/http.config"

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
        return next(new AppError("Invalid or expired access token", HTTPSTATUS.UNAUTHORIZED))
    }
}

import { ErrorRequestHandler } from "express"
import { ZodError } from "zod"
import { HTTPSTATUS } from "../config/http.config"
import { AppError } from "../utils/appError"

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    console.error("Error:", err)

    if (err instanceof ZodError) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: "Validation error",
            errors: err.issues
        })
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message
        })
    }

    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error"
    })
}

import rateLimit from "express-rate-limit"

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        error: "Too many requests"
    }
})

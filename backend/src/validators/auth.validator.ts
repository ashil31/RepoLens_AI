import { z } from "zod"

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters")
    })
})

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required")
    })
})

export const verifyOtpSchema = z.object({
    body: z.object({
        userId: z.string().min(1, "User ID is required"),
        code: z.string().length(6, "OTP must be 6 digits")
    })
})

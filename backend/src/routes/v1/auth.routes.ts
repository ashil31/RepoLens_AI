import { Router } from "express"
import { register, login, logout, getMe, verifyOtp, refresh, getSessions, revokeSession } from "../../controllers/auth.controller"
import { validate } from "../../middlewares/validate.middleware"
import { authenticate } from "../../middlewares/auth.middleware"
import { registerSchema, loginSchema, verifyOtpSchema } from "../../schemas/auth.schema"

const router = Router()

router.post("/register", validate(registerSchema), register)
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp)
router.post("/login", validate(loginSchema), login)
router.post("/refresh", refresh)
router.post("/logout", logout)

// Protected routes
router.get("/me", authenticate, getMe)
router.get("/sessions", authenticate, getSessions)
router.delete("/sessions/:sessionId", authenticate, revokeSession)

export default router

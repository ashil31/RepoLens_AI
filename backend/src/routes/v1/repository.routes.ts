import { Router } from "express"
import { authenticate, creditCheck } from "../../middlewares/auth.middleware"

const router = Router()

// Currently these controllers don't fully exist for /analyze and /chat, 
// using placeholder structure until Module 3/4.
// For now, let's just create the route structure.

// router.post("/add", authenticate, creditCheck, (req, res) => res.send("Repo added"))
// router.post("/analyze", authenticate, creditCheck, (req, res) => res.send("Repo analyzed"))

export default router

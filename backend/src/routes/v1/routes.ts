import { Router } from "express"
import healthRoutes from "./health.routes"
import authRoutes from "./auth.routes"
import repositoryRoutes from "./repository.routes"

const router = Router()

router.use("/health", healthRoutes)
router.use("/auth", authRoutes)
router.use("/repo", repositoryRoutes)

export default router

import { Router } from "express"
import healthRoutes from "./health.routes"
import authRoutes from "./auth.routes"
import workspaceRoutes from "./workspace.routes"
import repositoryRoutes from "./repository.routes"
import profileRoutes from "./profile.routes"
import analysisRoutes from "./analysis.routes"

const router = Router()

router.use("/health", healthRoutes)
router.use("/auth", authRoutes)
router.use("/profile", profileRoutes)
router.use("/analysis", analysisRoutes)
router.use("/workspaces", workspaceRoutes)
router.use("/workspaces/:workspaceId/repos", repositoryRoutes)

export default router

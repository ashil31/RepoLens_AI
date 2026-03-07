import { Router } from "express"
import healthRoutes from "./health.routes"
import authRoutes from "./auth.routes"
import workspaceRoutes from "./workspace.routes"
import repositoryRoutes from "./repository.routes"

const router = Router()

router.use("/health", healthRoutes)
router.use("/auth", authRoutes)
router.use("/workspaces", workspaceRoutes)
router.use("/workspaces/:workspaceId/repos", repositoryRoutes)

export default router

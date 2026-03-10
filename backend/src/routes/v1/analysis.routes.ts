import { Router } from "express"
import { authenticate } from "../../middlewares/auth.middleware"
import { getAnalysisJobStatusHandler } from "../../controllers/analysis.controller"

const router = Router()

router.use(authenticate)

router.get("/jobs/:jobId", getAnalysisJobStatusHandler)

export default router

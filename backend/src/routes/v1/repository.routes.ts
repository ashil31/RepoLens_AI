import { Router } from "express"
import { authenticate } from "../../middlewares/auth.middleware"
import {
    addRepositoryHandler,
    getWorkspaceRepositoriesHandler,
    getRepositoryDetailsHandler,
    deleteRepositoryHandler
} from "../../controllers/repository.controller"

const router = Router({ mergeParams: true })

router.use(authenticate)

router.post("/add", addRepositoryHandler)
router.get("/", getWorkspaceRepositoriesHandler)
router.get("/:repoId", getRepositoryDetailsHandler)
router.delete("/:repoId", deleteRepositoryHandler)

export default router

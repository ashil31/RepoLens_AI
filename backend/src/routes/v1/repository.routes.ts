import { Router } from "express"
import { authenticate } from "../../middlewares/auth.middleware"
import {
    addRepositoryHandler,
    getWorkspaceRepositoriesHandler,
    getRepositoryDetailsHandler,
    deleteRepositoryHandler,
    installGitHubHandler,
    getGitHubRepositoriesHandler,
    getGitHubInstallationStatusHandler,
    disconnectGitHubHandler
} from "../../controllers/repository.controller"

const router = Router({ mergeParams: true })

router.use(authenticate)

// GitHub (workspace connection) — more specific first
router.post("/github/install", installGitHubHandler)
router.get("/github/repositories", getGitHubRepositoriesHandler)
router.get("/github/installation", getGitHubInstallationStatusHandler)
router.delete("/github/installation", disconnectGitHubHandler)

// Repositories (workspace repos)
router.post("/add", addRepositoryHandler)
router.get("/", getWorkspaceRepositoriesHandler)
router.get("/:repoId", getRepositoryDetailsHandler)
router.delete("/:repoId", deleteRepositoryHandler)

export default router

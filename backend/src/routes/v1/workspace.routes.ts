import { Router } from "express"
import { authenticate } from "../../middlewares/auth.middleware"
import {
    createWorkspaceHandler,
    getUserWorkspacesHandler,
    getWorkspaceByIdHandler,
    updateWorkspaceHandler,
    deleteWorkspaceHandler,
    addMemberHandler,
    removeMemberHandler
} from "../../controllers/workspace.controller"

const router = Router()

router.use(authenticate)

router.post("/", createWorkspaceHandler)
router.get("/", getUserWorkspacesHandler)
router.get("/:id", getWorkspaceByIdHandler)
router.put("/:id", updateWorkspaceHandler)
router.delete("/:id", deleteWorkspaceHandler)

// Members
router.post("/:id/members", addMemberHandler)
router.delete("/:id/members/:userId", removeMemberHandler)

export default router

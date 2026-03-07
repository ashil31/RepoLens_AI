import { Router } from "express"
import { authenticate } from "../../middlewares/auth.middleware"
import { getProfileHandler, updateProfileHandler } from "../../controllers/profile.controller"

const router = Router()

router.use(authenticate)

router.get("/", getProfileHandler)
router.put("/", updateProfileHandler)

export default router

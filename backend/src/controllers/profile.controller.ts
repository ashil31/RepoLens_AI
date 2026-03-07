import { Request, Response } from "express"
import { HTTPSTATUS } from "../config/http.config"
import { catchAsync } from "../utils/catchAsync"
import { getUserProfile, updateProfile } from "../services/user.service"

export const getProfileHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string

    const profile = await getUserProfile(userId)

    // Omit sensitive data
    const { passwordHash, ...safeProfile } = profile

    res.status(HTTPSTATUS.OK).json({
        data: safeProfile
    })
})

export const updateProfileHandler = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id as string
    const { fullName, username, profileImage } = req.body

    const updatedProfile = await updateProfile(userId, { fullName, username, profileImage })

    // Omit sensitive data
    const { passwordHash, ...safeProfile } = updatedProfile

    res.status(HTTPSTATUS.OK).json({
        message: "Profile updated successfully",
        data: safeProfile
    })
})

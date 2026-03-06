import { OtpType } from "@prisma/client"
import { prisma } from "../database/prisma"

export const createOtp = async (data: {
    userId: string
    code: string
    type?: OtpType
    expiresAt: Date
}) => {
    // Delete existing OTPs of the same type for this user to avoid clutter
    await prisma.otp.deleteMany({
        where: {
            userId: data.userId,
            type: data.type || "EMAIL_VERIFICATION"
        }
    })

    return prisma.otp.create({
        data: {
            userId: data.userId,
            code: data.code,
            type: data.type || "EMAIL_VERIFICATION",
            expiresAt: data.expiresAt
        }
    })
}

export const findValidOtp = async (userId: string, code: string, type: OtpType) => {
    return prisma.otp.findFirst({
        where: {
            userId,
            code,
            type,
            expiresAt: { gt: new Date() }
        }
    })
}

export const deleteOtp = async (id: string) => {
    return prisma.otp.delete({
        where: { id }
    })
}

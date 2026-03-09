import { prisma } from "../database/prisma"

export const findInstallationByUserAndWorkspace = async (
    userId: string,
    workspaceId: string
) => {
    return prisma.gitHubInstallation.findUnique({
        where: {
            workspaceId_userId: { workspaceId, userId }
        }
    })
}

export const upsertInstallation = async (data: {
    githubInstallationId: number
    githubAccountLogin: string
    githubAccountId: number
    userId: string
    workspaceId: string
}) => {
    return prisma.gitHubInstallation.upsert({
        where: {
            workspaceId_userId: {
                workspaceId: data.workspaceId,
                userId: data.userId
            }
        },
        update: {
            githubInstallationId: data.githubInstallationId,
            githubAccountLogin: data.githubAccountLogin,
            githubAccountId: data.githubAccountId
        },
        create: data
    })
}

export const findInstallationByGithubInstallationId = async (
    githubInstallationId: number
) => {
    return prisma.gitHubInstallation.findFirst({
        where: { githubInstallationId }
    })
}

export const deleteInstallationByUserAndWorkspace = async (
    userId: string,
    workspaceId: string
) => {
    return prisma.gitHubInstallation.deleteMany({
        where: { userId, workspaceId }
    })
}

export const deleteInstallationByGithubId = async (
    githubInstallationId: number
) => {
    return prisma.gitHubInstallation.deleteMany({
        where: { githubInstallationId }
    })
}

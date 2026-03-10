import { Queue } from "bullmq"
import { redisConfig } from "../config/redis.config"
import { prisma } from "../database/prisma"
import { AppError } from "../utils/appError"
import { HTTPSTATUS } from "../config/http.config"

const ANALYSIS_QUEUE_NAME = "repository-analysis"

export const analysisQueue = new Queue(ANALYSIS_QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
        timeout: 15 * 60 * 1000, // 15 minutes timeout
    },
})

export interface AnalysisJobData {
    repositoryId: string
    workspaceId: string
    userId: string
    githubUrl: string
    accessToken?: string
    jobId: string
}

/**
 * Adds a repository analysis job to the queue.
 */
export async function addAnalysisJob(data: AnalysisJobData) {
    // 2. Add to BullMQ
    await analysisQueue.add("analyze", data, {
        jobId: data.jobId
    })

    return data.jobId
}

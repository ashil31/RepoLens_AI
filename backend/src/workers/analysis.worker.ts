import { Worker, Job } from "bullmq"
import { redisConfig } from "../config/redis.config"
import { processRepositoryAnalysis } from "../services/repository.service"
import { prisma } from "../database/prisma"
import type { AnalysisJobData } from "../services/analysis.queue"

const worker = new Worker<AnalysisJobData>(
    "repository-analysis",
    async (job: Job<AnalysisJobData>) => {
        const { jobId, repositoryId, workspaceId, githubUrl, accessToken } = job.data

        const jobRecord = await prisma.analysisJob.findUnique({ where: { id: jobId } })
        if (!jobRecord) {
            console.warn(`[Worker] Job ${jobId} not found. Skipping.`)
            return
        }

        await processRepositoryAnalysis(
            jobId,
            repositoryId,
            workspaceId,
            githubUrl,
            accessToken
        )
    },
    { connection: redisConfig, concurrency: 2 }
)

worker.on("active", (job) => console.log(`[Worker] Job ${job.id} started`))
worker.on("completed", (job) => console.log(`[Worker] Job ${job.id} completed`))
worker.on("failed", (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message))

console.log("✅ Repository analysis worker ready.")

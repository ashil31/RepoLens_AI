import { Worker, Job } from "bullmq"
import { redisConfig } from "./config/redis.config"
import { processRepositoryAnalysis } from "./services/repository.service"
import { prisma } from "./database/prisma"
import { AnalysisJobData } from "./services/analysis.queue"

console.log("🚀 Starting Repository Analysis Worker...")

const worker = new Worker(
    "repository-analysis",
    async (job: Job<AnalysisJobData>) => {
        const { jobId, repositoryId, workspaceId, githubUrl, accessToken } = job.data

        console.log(`[Worker] Processing job ${jobId} for repo ${repositoryId}`)

        try {
            // 1. Mark job as PROCESSING
            await prisma.analysisJob.update({
                where: { id: jobId },
                data: {
                    status: "PROCESSING",
                    startedAt: new Date()
                }
            })

            // 2. Run the analysis pipeline
            await processRepositoryAnalysis(jobId, repositoryId, workspaceId, githubUrl, accessToken)

            console.log(`[Worker] Job ${jobId} completed successfully`)
        } catch (error) {
            console.error(`[Worker] Job ${jobId} failed:`, error)
            // Error handling is also done inside processRepositoryAnalysis, 
            // but we catch here to prevent worker crash
            throw error
        }
    },
    {
        connection: redisConfig,
        concurrency: 2, // Limit simultaneous analyses
    }
)

worker.on("active", (job) => {
    console.log(`[Worker] Job ${job.id} started processing`)
})

worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} has completed!`)
})

worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} has failed with ${err.message}`)
})

console.log("✅ Worker is ready and listening for jobs.")

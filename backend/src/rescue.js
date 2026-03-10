const { PrismaClient } = require("@prisma/client")
const { Queue } = require("bullmq")
const dotenv = require("dotenv")
const path = require("path")

dotenv.config()

const prisma = new PrismaClient()

async function rescue() {
    console.log("--- Rescuing Pending Jobs (JS) ---")
    
    // Redis config
    const redisConfig = {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD || undefined,
    }

    const queue = new Queue("repository-analysis", { connection: redisConfig })

    const pendingJobs = await prisma.analysisJob.findMany({
        where: { status: "PENDING" },
        include: { repository: true }
    })

    console.log(`Found ${pendingJobs.length} jobs to rescue.`)

    for (const job of pendingJobs) {
        console.log(`Queueing Job ${job.id} for ${job.repository.owner}/${job.repository.name}...`)
        
        await queue.add("analyze", {
            jobId: job.id,
            repositoryId: job.repositoryId,
            workspaceId: job.repository.workspaceId,
            userId: "SYSTEM_RESCUE",
            githubUrl: job.repository.repoUrl,
            accessToken: undefined
        }, {
            jobId: job.id
        })
        
        console.log(`✅ Job ${job.id} added to queue.`)
    }

    await queue.close()
    await prisma.$disconnect()
    console.log("--- Rescue Complete ---")
}

rescue().catch(err => {
    console.error(err)
    process.exit(1)
})

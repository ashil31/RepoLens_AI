import { prisma } from "./database/prisma"
import { addAnalysisJob } from "./services/analysis.queue"
import { parseGitHubUrl } from "./services/repository.service"

async function rescueJobs() {
    console.log("--- Rescuing Pending Jobs ---")

    const pendingJobs = await prisma.analysisJob.findMany({
        where: {
            status: "PENDING"
        },
        include: {
            repository: true
        }
    })

    console.log(`Found ${pendingJobs.length} pending jobs.`)

    for (const job of pendingJobs) {
        console.log(`Rescuing Job ${job.id} for ${job.repository.owner}/${job.repository.name}...`)

        try {
            await addAnalysisJob({
                jobId: job.id,
                repositoryId: job.repositoryId,
                workspaceId: job.repository.workspaceId,
                userId: "SYSTEM_RESCUE",
                githubUrl: job.repository.repoUrl,
                accessToken: undefined
            } as any)
            console.log(`✅ Job ${job.id} added to queue.`)
        } catch (err) {
            console.error(`❌ Failed to rescue job ${job.id}:`, err)
        }
    }

    console.log("--- Rescue Complete ---")
    process.exit(0)
}

rescueJobs().catch(console.error)

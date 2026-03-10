import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("--- Recent Analysis Jobs ---")
    const jobs = await prisma.analysisJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            repository: {
                select: { owner: true, name: true }
            }
        }
    })

    jobs.forEach(job => {
        console.log(`Job ID: ${job.id}`)
        console.log(`Repo: ${job.repository.owner}/${job.repository.name}`)
        console.log(`Status: ${job.status}`)
        console.log(`Step: ${job.currentStep}`)
        console.log(`Progress: ${job.progress}%`)
        console.log(`Error: ${job.error || 'None'}`)
        console.log("Logs:", JSON.stringify(job.logs, null, 2))
        console.log("----------------------------")
    })

    if (jobs.length > 0) {
        const repoId = jobs[0].repositoryId
        const fileCount = await prisma.repositoryFile.count({ where: { repositoryId: repoId } })
        console.log(`Files in DB for most recent repo: ${fileCount}`)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  try {
    console.log("--- Recent Analysis Jobs ---")
    const jobs = await prisma.analysisJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    if (jobs.length === 0) {
      console.log("No jobs found.")
    }

    for (const job of jobs) {
      console.log(`Job ID: ${job.id}`)
      console.log(`Status: ${job.status}`)
      console.log(`Step: ${job.currentStep}`)
      console.log(`Progress: ${job.progress}%`)
      console.log(`Error: ${job.error || 'None'}`)
      console.log("----------------------------")
    }
  } catch (err) {
    console.error("Error querying DB:", err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
